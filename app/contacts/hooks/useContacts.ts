/**
 * useContacts Hook
 * Central hook for managing contact operations and state
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import type {
  Contact,
  ContactFilters,
  CreateContactData,
  UpdateContactData,
  ContactsResponse,
  ContactResponse,
} from '../types';

export const useContacts = () => {
  const { getAccessToken } = useWallet();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all contacts with optional filters
   */
  const fetchContacts = useCallback(async (filters?: ContactFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.country) queryParams.append('country', filters.country);
      if (filters?.favorite !== undefined) queryParams.append('favorite', String(filters.favorite));
      if (filters?.isNedaPayUser !== undefined) queryParams.append('isNedaPayUser', String(filters.isNedaPayUser));
      if (filters?.limit) queryParams.append('limit', String(filters.limit));
      if (filters?.offset) queryParams.append('offset', String(filters.offset));

      const response = await fetch(`/api/contacts?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const data: ContactsResponse = await response.json();
      
      if (data.success) {
        setContacts(data.contacts);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contacts';
      setError(message);
      console.error('Error fetching contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  /**
   * Get a single contact by ID
   */
  const getContact = useCallback(async (contactId: string): Promise<Contact | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contact');
      }

      const data: ContactResponse = await response.json();
      
      if (data.success) {
        return data.contact;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contact';
      setError(message);
      console.error('Error fetching contact:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  /**
   * Create a new contact
   */
  const createContact = useCallback(async (data: CreateContactData): Promise<Contact | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create contact');
      }

      const responseData: ContactResponse = await response.json();
      
      if (responseData.success) {
        // Add to local state
        setContacts(prev => [responseData.contact, ...prev]);
        return responseData.contact;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create contact';
      setError(message);
      console.error('Error creating contact:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  /**
   * Update an existing contact
   */
  const updateContact = useCallback(async (
    contactId: string,
    data: UpdateContactData
  ): Promise<Contact | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update contact');
      }

      const responseData: ContactResponse = await response.json();
      
      if (responseData.success) {
        // Update in local state
        setContacts(prev =>
          prev.map(contact =>
            contact.id === contactId ? responseData.contact : contact
          )
        );
        return responseData.contact;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update contact';
      setError(message);
      console.error('Error updating contact:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  /**
   * Delete a contact
   */
  const deleteContact = useCallback(async (contactId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete contact');
      }

      // Remove from local state
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(message);
      console.error('Error deleting contact:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async (contactId: string): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/contacts/${contactId}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update in local state
        setContacts(prev =>
          prev.map(contact =>
            contact.id === contactId
              ? { ...contact, favorite: data.favorite }
              : contact
          )
        );
        return true;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle favorite';
      setError(message);
      console.error('Error toggling favorite:', err);
      return false;
    }
  }, [getAccessToken]);

  /**
   * Search for existing NedaPay user
   */
  const searchUser = useCallback(async (
    query: string,
    type: 'wallet' | 'email' | 'privyUserId'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/contacts/search-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to search user');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search user';
      setError(message);
      console.error('Error searching user:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  /**
   * Get recent contacts
   */
  const getRecentContacts = useCallback((limit = 5): Contact[] => {
    return [...contacts]
      .filter(c => c.lastUsed)
      .sort((a, b) => {
        const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }, [contacts]);

  /**
   * Get favorite contacts
   */
  const getFavoriteContacts = useCallback((): Contact[] => {
    return contacts.filter(c => c.favorite);
  }, [contacts]);

  /**
   * Search contacts locally
   */
  const searchContactsLocal = useCallback((query: string): Contact[] => {
    const lowercaseQuery = query.toLowerCase();
    return contacts.filter(
      contact =>
        contact.name.toLowerCase().includes(lowercaseQuery) ||
        contact.nickname?.toLowerCase().includes(lowercaseQuery) ||
        contact.notes?.toLowerCase().includes(lowercaseQuery)
    );
  }, [contacts]);

  return {
    // State
    contacts,
    isLoading,
    error,
    
    // CRUD Operations
    fetchContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact,
    
    // Additional Operations
    toggleFavorite,
    searchUser,
    
    // Utility Functions
    getRecentContacts,
    getFavoriteContacts,
    searchContactsLocal,
  };
};
