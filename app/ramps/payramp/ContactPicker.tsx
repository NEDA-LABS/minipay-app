'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, X, Search, Phone, Building2, Wallet, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Contact } from '../../contacts/types';
import { useFilteredContacts } from '../../hooks/useContacts';

interface ContactPickerProps {
  onSelectContact: (data: {
    accountName: string;
    accountNumber?: string;
    phoneNumber?: string;
    bankDetails?: { accountNumber: string; bankName: string; accountName: string };
  }) => void;
  mode: 'phone' | 'bank';
  disabled?: boolean;
}

export default function ContactPicker({ onSelectContact, mode, disabled }: ContactPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use cached contacts with automatic filtering by mode
  const { contacts, isLoading, prefetchContacts } = useFilteredContacts(mode);

  // Prefetch contacts on component mount for instant loading
  useEffect(() => {
    prefetchContacts();
  }, [prefetchContacts]);

  // Filter by search query (memoized for performance)
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter((c: Contact) =>
      c.name.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleSelectContact = (contact: Contact) => {
    if (mode === 'phone' && contact.phoneNumbers?.[0]) {
      const phoneNumber = contact.phoneNumbers[0];
      let cleanNumber = phoneNumber.phoneNumber;
      
      // Remove country code prefix - handles both +255 and 255 formats
      cleanNumber = cleanNumber.replace(/^\+/, ''); // Remove leading +
      
      // Remove common African country codes if they appear at the start
      const countryCodes = ['255', '254', '256', '234', '233', '250', '251', '252', '253', '257', '258', '260', '263', '265', '267', '268'];
      for (const code of countryCodes) {
        if (cleanNumber.startsWith(code)) {
          cleanNumber = cleanNumber.substring(code.length);
          break;
        }
      }
      
      // Remove leading zero if present (e.g., 0769527679 -> 769527679)
      cleanNumber = cleanNumber.replace(/^0+/, '');
      
      // Remove any spaces or formatting
      cleanNumber = cleanNumber.replace(/[\s-]/g, '');
      
      onSelectContact({
        accountName: contact.name,
        phoneNumber: cleanNumber.trim(),
      });
    } else if (mode === 'bank' && contact.bankAccounts?.[0]) {
      const bankAccount = contact.bankAccounts[0];
      
      onSelectContact({
        accountName: bankAccount.accountName || contact.name,
        accountNumber: bankAccount.accountNumber,
        bankDetails: {
          accountNumber: bankAccount.accountNumber,
          bankName: bankAccount.bankName,
          accountName: bankAccount.accountName || contact.name,
        },
      });
    }
    
    setIsOpen(false);
    setSearchQuery('');
  };

  const getAvailablePaymentMethods = (contact: Contact) => {
    const methods = [];
    if (contact.phoneNumbers?.length) methods.push(`${contact.phoneNumbers.length} phone`);
    if (contact.bankAccounts?.length) methods.push(`${contact.bankAccounts.length} bank`);
    if (contact.cryptoAddresses?.length) methods.push(`${contact.cryptoAddresses.length} wallet`);
    return methods.join(', ');
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">From Contacts</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] bg-slate-900/95 border-slate-700 !rounded-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Select Contact
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-slate-800"
              >
                <X className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Choose a saved contact to auto-fill {mode === 'phone' ? 'mobile number' : 'bank account'} details
            </p>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Contact List */}
          <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  {searchQuery
                    ? 'No contacts found'
                    : `No contacts with ${mode === 'phone' ? 'phone numbers' : 'bank accounts'}`}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact: Contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-lg text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm truncate">
                        {contact.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {mode === 'phone' && contact.phoneNumbers?.[0] && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Phone className="w-3 h-3" />
                            {contact.phoneNumbers[0].phoneNumber}
                          </span>
                        )}
                        {mode === 'bank' && contact.bankAccounts?.[0] && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Building2 className="w-3 h-3" />
                            {contact.bankAccounts[0].bankName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {getAvailablePaymentMethods(contact)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
