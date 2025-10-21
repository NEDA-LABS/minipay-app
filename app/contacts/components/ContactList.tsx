import ContactCard from './ContactCard';
import type { Contact } from '../types';

interface ContactListProps {
  contacts: Contact[];
  onViewContact?: (contact: Contact) => void;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contactId: string) => void;
  onToggleFavorite?: (contactId: string) => void;
}

export default function ContactList({
  contacts,
  onViewContact,
  onEditContact,
  onDeleteContact,
  onToggleFavorite,
}: ContactListProps) {
  // Sort contacts: favorites first, then by last used, then by name
  const sortedContacts = [...contacts].sort((a, b) => {
    // Favorites first
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    
    // Then by last used
    const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    if (bLastUsed !== aLastUsed) return bLastUsed - aLastUsed;
    
    // Finally by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-2">
      {sortedContacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onView={onViewContact}
          onEdit={onEditContact}
          onDelete={onDeleteContact}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
