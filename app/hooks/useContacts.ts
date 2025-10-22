'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import type { Contact } from '../contacts/types';

interface CreateContactData {
  name: string;
  country: string;
  phoneNumbers?: Array<{
    phoneNumber: string;
    provider?: string;
    country?: string;
    isPrimary: boolean;
  }>;
  bankAccounts?: Array<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    isPrimary: boolean;
  }>;
  cryptoAddresses?: Array<{
    address: string;
    chainId?: number;
    isPrimary: boolean;
  }>;
}

// Query keys for consistent cache management
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...contactKeys.lists(), filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

/**
 * Custom hook for fetching and caching contacts
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Background refetching
 * - Optimistic updates
 * - Error handling
 */
export function useContacts() {
  const { getAccessToken, authenticated } = usePrivy();
  const queryClient = useQueryClient();

  // Fetch contacts query
  const {
    data: contacts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: contactKeys.lists(),
    queryFn: async (): Promise<Contact[]> => {
      if (!authenticated) return [];
      
      const token = await getAccessToken();
      const res = await fetch('/api/contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const data = await res.json();
      return data.contacts || [];
    },
    enabled: authenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: false, // Don't refetch on component mount if data is fresh
  });

  // Create contact mutation
  const createContact = useMutation({
    mutationFn: async (contactData: CreateContactData): Promise<Contact> => {
      const token = await getAccessToken();
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create contact');
      }

      return res.json();
    },
    onMutate: async (newContact) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });

      // Snapshot previous value
      const previousContacts = queryClient.getQueryData<Contact[]>(contactKeys.lists());

      // Optimistically update cache with temporary contact
      if (previousContacts) {
        const optimisticContact: Partial<Contact> = {
          id: `temp-${Date.now()}`,
          userId: '',
          name: newContact.name,
          country: newContact.country,
          isNedaPayUser: false,
          favorite: false,
          phoneNumbers: [],
          bankAccounts: [],
          cryptoAddresses: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData<Contact[]>(
          contactKeys.lists(),
          [...previousContacts, optimisticContact as Contact]
        );
      }

      return { previousContacts };
    },
    onError: (err, newContact, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        queryClient.setQueryData(contactKeys.lists(), context.previousContacts);
      }
    },
    onSuccess: (newContact) => {
      // Update cache with real contact data
      queryClient.setQueryData<Contact[]>(contactKeys.lists(), (old) => {
        if (!old) return [newContact];
        // Replace temporary contact with real one
        return old.map((c) => (c.id.startsWith('temp-') ? newContact : c));
      });
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });

  // Update contact mutation
  const updateContact = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateContactData> }): Promise<Contact> => {
      const token = await getAccessToken();
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to update contact');
      }

      return res.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });
      const previousContacts = queryClient.getQueryData<Contact[]>(contactKeys.lists());

      // Optimistically update
      if (previousContacts) {
        queryClient.setQueryData<Contact[]>(
          contactKeys.lists(),
          previousContacts.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date() } as Contact : c
          )
        );
      }

      return { previousContacts };
    },
    onError: (err, variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(contactKeys.lists(), context.previousContacts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });

  // Delete contact mutation
  const deleteContact = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const token = await getAccessToken();
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to delete contact');
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });
      const previousContacts = queryClient.getQueryData<Contact[]>(contactKeys.lists());

      // Optimistically remove
      if (previousContacts) {
        queryClient.setQueryData<Contact[]>(
          contactKeys.lists(),
          previousContacts.filter((c) => c.id !== id)
        );
      }

      return { previousContacts };
    },
    onError: (err, id, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(contactKeys.lists(), context.previousContacts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });

  // Prefetch contacts (useful for preloading)
  const prefetchContacts = async () => {
    await queryClient.prefetchQuery({
      queryKey: contactKeys.lists(),
      queryFn: async () => {
        const token = await getAccessToken();
        const res = await fetch('/api/contacts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        return data.contacts || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    // Data
    contacts,
    isLoading,
    isError,
    error,
    
    // Actions
    refetch,
    prefetchContacts,
    createContact: createContact.mutate,
    updateContact: updateContact.mutate,
    deleteContact: deleteContact.mutate,
    
    // Mutation states
    isCreating: createContact.isPending,
    isUpdating: updateContact.isPending,
    isDeleting: deleteContact.isPending,
    createError: createContact.error,
    updateError: updateContact.error,
    deleteError: deleteContact.error,
  };
}

/**
 * Hook for filtering contacts by payment method
 */
export function useFilteredContacts(mode: 'phone' | 'bank' | 'crypto' | 'all' = 'all') {
  const { contacts, ...rest } = useContacts();

  const filteredContacts = contacts.filter((contact) => {
    switch (mode) {
      case 'phone':
        return contact.phoneNumbers && contact.phoneNumbers.length > 0;
      case 'bank':
        return contact.bankAccounts && contact.bankAccounts.length > 0;
      case 'crypto':
        return contact.cryptoAddresses && contact.cryptoAddresses.length > 0;
      default:
        return true;
    }
  });

  return {
    contacts: filteredContacts,
    ...rest,
  };
}
