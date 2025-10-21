'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, User, Plus, Trash2, Phone, Wallet, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Contact, CreateContactData, ContactFormProps, CreatePhoneNumberData, CreateBankAccountData, CreateCryptoAddressData } from '../types';

export default function ContactFormModal({
  isOpen,
  onClose,
  onSuccess,
  editContact = null,
  prefillData,
}: ContactFormProps) {
  const { getAccessToken } = usePrivy();
  const isEditing = !!editContact;

  // Form state - simplified
  const [name, setName] = useState(editContact?.name || prefillData?.name || '');
  const [phoneNumbers, setPhoneNumbers] = useState<CreatePhoneNumberData[]>(
    editContact?.phoneNumbers?.length 
      ? editContact.phoneNumbers.map(p => ({ phoneNumber: p.phoneNumber, provider: p.provider, country: p.country, isPrimary: p.isPrimary }))
      : [{ phoneNumber: '', provider: '', country: '', isPrimary: true }]
  );
  const [bankAccounts, setBankAccounts] = useState<CreateBankAccountData[]>(
    editContact?.bankAccounts?.length
      ? editContact.bankAccounts.map(b => ({ accountNumber: b.accountNumber, accountName: b.accountName, bankName: b.bankName, currency: b.currency, isPrimary: b.isPrimary }))
      : []
  );
  const [cryptoAddresses, setCryptoAddresses] = useState<CreateCryptoAddressData[]>(
    editContact?.cryptoAddresses?.length
      ? editContact.cryptoAddresses.map(c => ({ address: c.address, isPrimary: c.isPrimary }))
      : []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper functions to add/remove items
  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { phoneNumber: '', provider: '', country: '', isPrimary: false }]);
  };

  const removePhoneNumber = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const addBankAccount = () => {
    setBankAccounts([...bankAccounts, { accountNumber: '', accountName: '', bankName: '', currency: 'USD', isPrimary: false }]);
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const addCryptoAddress = () => {
    setCryptoAddresses([...cryptoAddresses, { address: '', isPrimary: false }]);
  };

  const removeCryptoAddress = (index: number) => {
    setCryptoAddresses(cryptoAddresses.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get authentication token
      const token = await getAccessToken();
      
      // Filter out empty entries
      const validPhoneNumbers = phoneNumbers.filter(p => p.phoneNumber.trim());
      const validBankAccounts = bankAccounts.filter(b => b.accountNumber.trim() && b.bankName.trim());
      const validCryptoAddresses = cryptoAddresses.filter(c => c.address.trim());

      const formData: CreateContactData = {
        name: name.trim(),
        // country: 'US', // Default country
        phoneNumbers: validPhoneNumbers,
        bankAccounts: validBankAccounts,
        cryptoAddresses: validCryptoAddresses,
      };
      
      const url = isEditing && editContact ? `/api/contacts/${editContact.id}` : '/api/contacts';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save contact');
      }

      const savedContact = await response.json();
      onSuccess(savedContact);
      toast.success(isEditing ? 'Contact updated!' : 'Contact created!');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border-slate-700 !rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              {isEditing ? 'Edit Contact' : 'New Contact'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-800"
            >
              <X className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300 flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="bg-slate-800/50 border-slate-600 text-white"
              required
            />
          </div>

          {/* Phone Numbers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Numbers (optional)
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addPhoneNumber}
                className="h-7 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={phone.phoneNumber}
                  onChange={(e) => {
                    const updated = [...phoneNumbers];
                    updated[index].phoneNumber = e.target.value;
                    setPhoneNumbers(updated);
                  }}
                  placeholder="+1 234 567 8900"
                  className="flex-1 bg-slate-800/50 border-slate-600 text-white"
                />
                {phoneNumbers.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removePhoneNumber(index)}
                    className="h-10 w-10 p-0 hover:bg-slate-800 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Bank Accounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Bank Accounts (optional)
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addBankAccount}
                className="h-7 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            {bankAccounts.map((account, index) => (
              <div key={index} className="space-y-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                <div className="flex gap-2">
                  <Input
                    value={account.accountNumber}
                    onChange={(e) => {
                      const updated = [...bankAccounts];
                      updated[index].accountNumber = e.target.value;
                      setBankAccounts(updated);
                    }}
                    placeholder="Account Number"
                    className="flex-1 bg-slate-800/50 border-slate-600 text-white"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeBankAccount(index)}
                    className="h-10 w-10 p-0 hover:bg-slate-800 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={account.accountName}
                    onChange={(e) => {
                      const updated = [...bankAccounts];
                      updated[index].accountName = e.target.value;
                      setBankAccounts(updated);
                    }}
                    placeholder="Account Name"
                    className="bg-slate-800/50 border-slate-600 text-white"
                  />
                  <Input
                    value={account.bankName}
                    onChange={(e) => {
                      const updated = [...bankAccounts];
                      updated[index].bankName = e.target.value;
                      setBankAccounts(updated);
                    }}
                    placeholder="Bank Name"
                    className="bg-slate-800/50 border-slate-600 text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Crypto Wallet Addresses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet Addresses (optional)
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCryptoAddress}
                className="h-7 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            {cryptoAddresses.map((crypto, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={crypto.address}
                  onChange={(e) => {
                    const updated = [...cryptoAddresses];
                    updated[index].address = e.target.value;
                    setCryptoAddresses(updated);
                  }}
                  placeholder="0x..."
                  className="flex-1 bg-slate-800/50 border-slate-600 text-white font-mono text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCryptoAddress(index)}
                  className="h-10 w-10 p-0 hover:bg-slate-800 text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
