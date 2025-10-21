import { Star, Wallet, CreditCard, Phone, Edit, Trash2, Eye, MapPin, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Contact } from '../types';

interface ContactCardProps {
  contact: Contact;
  onView?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onToggleFavorite?: (contactId: string) => void;
  compact?: boolean;
}

export default function ContactCard({
  contact,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
  compact = false,
}: ContactCardProps) {
  const hasPaymentMethods = 
    contact.bankAccounts.length > 0 ||
    contact.phoneNumbers.length > 0 ||
    contact.cryptoAddresses.length > 0;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastUsed = (date?: Date | null) => {
    if (!date) return 'Never used';
    
    const now = new Date();
    const lastUsed = new Date(date);
    const diffInDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Used today';
    if (diffInDays === 1) return 'Used yesterday';
    if (diffInDays < 7) return `Used ${diffInDays} days ago`;
    if (diffInDays < 30) return `Used ${Math.floor(diffInDays / 7)} weeks ago`;
    return `Used ${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <Card className="group p-4 bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-200 hover:bg-slate-800/70 cursor-pointer !rounded-xl">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {getInitials(contact.name)}
            </span>
          </div>
          
          {contact.isNedaPayUser && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-800">
              <CheckCircle2 className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium text-sm truncate">
              {contact.name}
            </h3>
            {contact.favorite && (
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            {contact.email && (
              <p className="text-slate-400 text-xs truncate">{contact.email}</p>
            )}
            {contact.phoneNumber && !contact.email && (
              <p className="text-slate-400 text-xs truncate">{contact.phoneNumber}</p>
            )}
            {/* {contact.country && (
              <Badge variant="outline" className="text-xs h-5 px-1.5 border-slate-600 text-slate-400">
                {contact.country}
              </Badge>
            )} */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(contact.id);
              }}
              className="p-1.5 hover:bg-slate-700/50 rounded-md transition-colors"
            >
              <Star
                className={`h-4 w-4 ${
                  contact.favorite
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-500'
                }`}
              />
            </button>
          )}
          
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(contact);
              }}
              className="h-7 w-7 p-0 hover:bg-purple-500/10"
            >
              <Edit className="h-3.5 w-3.5 text-purple-400" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${contact.name}"?`)) {
                  onDelete(contact.id);
                }
              }}
              className="h-7 w-7 p-0 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
