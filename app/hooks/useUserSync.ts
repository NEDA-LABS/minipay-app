import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import toast from 'react-hot-toast';

export function useUserSync() {
  const { address, authenticated, ready } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  type User = {
    email?: string | null;
    wallet?: string | null;
    [key: string]: any; // Allow for other properties
  };

  const [userData, setUserData] = useState<User | null>(null);

  // Sync user when they authenticate
  useEffect(() => {
    if (!ready || !authenticated || !address || isLoading) return;

    const syncUser = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            wallet: address,
            environment: 'minipay' 
          }),
        });

        const result = await response.json();
        setUserData(result.user);
        
        // Store user data in localStorage for quick access
        localStorage.setItem('userData', JSON.stringify(result.user));
      } catch (error) {
        toast.error('Failed to sync user data');
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [ready, authenticated, address, isLoading]);

  // Function to add email to user
  const addEmail = async (email: string) => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/add-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          wallet: address, 
          email 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add email');
      }

      const result = await response.json();
      setUserData(result.user);
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      toast.success('Email added successfully!');
      return result.user;
    } catch (error) {
      toast.error('Failed to add email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userData,
    isLoading,
    addEmail,
    hasEmail: userData?.email != null,
    hasWallet: userData?.wallet != null,
  };
}