import { Users, Plus, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyContactListProps {
  onCreateContact: () => void;
}

export default function EmptyContactList({ onCreateContact }: EmptyContactListProps) {
  return (
    <div className="text-center py-12">
      {/* Icon */}
      <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-purple-400" />
      </div>

      {/* Heading */}
      <h3 className="text-lg font-semibold text-white mb-2">
        No Contacts Yet
      </h3>
      
      {/* Description */}
      <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
        Create your first contact to save recipient details for quick transactions
      </p>

      {/* CTA Button */}
      <Button
        onClick={onCreateContact}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Your First Contact
      </Button>
    </div>
  );
}
