/**
 * ContactDetailsModal - View full contact details
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, Edit, Trash2, Star, MapPin, CheckCircle2, 
  Wallet, CreditCard, Phone, Copy, ExternalLink 
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Contact } from '../types';

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ContactDetailsModal({
  isOpen,
  onClose,
  contact,
  onEdit,
  onDelete,
}: ContactDetailsModalProps) {
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {getInitials(contact.name)}
                  </span>
                </div>
                {contact.isNedaPayUser && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Name and badges */}
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-2xl font-bold text-white">
                    {contact.name}
                  </DialogTitle>
                  {contact.favorite && (
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                {contact.nickname && (
                  <p className="text-slate-400 text-sm mt-1">"{contact.nickname}"</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {contact.country}
                  </Badge>
                  {contact.isNedaPayUser && (
                    <Badge className="text-xs bg-green-600/20 text-green-400 border-green-600/30">
                      NedaPay User
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Notes */}
          {contact.notes && (
            <Card className="p-4 bg-slate-800/60 border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
              <p className="text-slate-300 text-sm">{contact.notes}</p>
            </Card>
          )}

          {/* Crypto Addresses */}
          {contact.cryptoAddresses.length > 0 && (
            <Card className="p-4 bg-slate-800/60 border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Crypto Addresses</h3>
                <Badge variant="secondary" className="ml-auto">
                  {contact.cryptoAddresses.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {contact.cryptoAddresses.map((addr) => (
                  <div key={addr.id} className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {addr.label && (
                          <p className="text-xs text-slate-400 mb-1">{addr.label}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-white font-mono truncate">
                            {addr.address}
                          </code>
                          {addr.isPrimary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        {addr.ensName && (
                          <p className="text-xs text-purple-400 mt-1">{addr.ensName}</p>
                        )}
                        {addr.chainId && (
                          <p className="text-xs text-slate-500 mt-1">Chain ID: {addr.chainId}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(addr.address, 'Address')}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Bank Accounts */}
          {contact.bankAccounts.length > 0 && (
            <Card className="p-4 bg-slate-800/60 border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Bank Accounts</h3>
                <Badge variant="secondary" className="ml-auto">
                  {contact.bankAccounts.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {contact.bankAccounts.map((acc) => (
                  <div key={acc.id} className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {acc.label && (
                          <p className="text-xs text-slate-400 mb-1">{acc.label}</p>
                        )}
                        <p className="text-white font-medium">{acc.accountName}</p>
                        <p className="text-slate-300 text-sm mt-1">{acc.bankName}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <code className="text-sm text-slate-400">{acc.accountNumber}</code>
                          <Badge variant="outline" className="text-xs">{acc.currency}</Badge>
                          {acc.isPrimary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        {acc.bankCode && (
                          <p className="text-xs text-slate-500 mt-1">Bank Code: {acc.bankCode}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(acc.accountNumber, 'Account number')}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Phone Numbers */}
          {contact.phoneNumbers.length > 0 && (
            <Card className="p-4 bg-slate-800/60 border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-5 w-5 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Phone Numbers</h3>
                <Badge variant="secondary" className="ml-auto">
                  {contact.phoneNumbers.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {contact.phoneNumbers.map((phone) => (
                  <div key={phone.id} className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {phone.label && (
                          <p className="text-xs text-slate-400 mb-1">{phone.label}</p>
                        )}
                        <p className="text-white font-medium font-mono">{phone.phoneNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-slate-300 text-sm">{phone.provider}</p>
                          {phone.isPrimary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(phone.phoneNumber, 'Phone number')}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Linked User Info */}
          {contact.linkedUser && (
            <Card className="p-4 bg-green-900/10 border-green-600/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Linked NedaPay User</h3>
              </div>
              <div className="space-y-1">
                {contact.linkedUser.name && (
                  <p className="text-slate-300 text-sm">Name: {contact.linkedUser.name}</p>
                )}
                {contact.linkedUser.email && (
                  <p className="text-slate-300 text-sm">Email: {contact.linkedUser.email}</p>
                )}
                {contact.linkedUser.wallet && (
                  <p className="text-slate-300 text-sm font-mono truncate">
                    Wallet: {contact.linkedUser.wallet}
                  </p>
                )}
                <Badge className={contact.linkedUser.isActive ? 'bg-green-600' : 'bg-slate-600'}>
                  {contact.linkedUser.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </Card>
          )}

          <Separator className="bg-slate-700" />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onEdit}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Contact
            </Button>
            <Button
              onClick={onDelete}
              variant="outline"
              className="text-red-400 hover:text-red-300 border-red-600/30 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
