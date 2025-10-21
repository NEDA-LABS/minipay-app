'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

// Import components
import ContactList from './components/ContactList';
import ContactFormModal from './components/ContactFormModal';
import ContactDetailsModal from './components/ContactDetailsModal';
import EmptyContactList from './components/EmptyContactList';

// Import types and hooks
import type { Contact } from './types';
import { useContacts } from './hooks/useContacts';

const ContactsPage = () => {
  const { authenticated, user, login } = usePrivy();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Custom hook for contact operations
  const {
    contacts,
    isLoading,
    fetchContacts,
    deleteContact,
    toggleFavorite,
  } = useContacts();

  // Fetch contacts on mount
  useEffect(() => {
    if (authenticated && user) {
      fetchContacts();
    }
  }, [authenticated, user, fetchContacts]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handlers
  const handleCreateContact = () => {
    setEditingContact(null);
    setShowFormModal(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowFormModal(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailsModal(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(contactId);
        toast.success('Contact deleted successfully');
      } catch (error) {
        toast.error('Failed to delete contact');
      }
    }
  };

  const handleToggleFavorite = async (contactId: string) => {
    try {
      await toggleFavorite(contactId);
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleFormSuccess = (contact: Contact) => {
    setShowFormModal(false);
    setEditingContact(null);
    fetchContacts(); // Refresh list
    toast.success(editingContact ? 'Contact updated!' : 'Contact created!');
  };

  // Loading/Auth state
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Header />
        <Card className="p-8 bg-slate-800/80 border-slate-700 mx-auto max-w-md">
          <CardContent className="text-center">
            <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
            <p className="text-slate-300 mb-6">Please login to view your contacts</p>
            <Button onClick={login} className="bg-gradient-to-r from-purple-600 to-blue-600">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Main Card - Dashboard Tab Style */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-900/90 border-slate-700 backdrop-blur-sm !rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-purple-400" />
                  <CardTitle className="text-white text-xl">My Contacts</CardTitle>
                </div>
                <Button
                  onClick={handleCreateContact}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                {contacts.length} saved {contacts.length === 1 ? 'contact' : 'contacts'}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600 text-white"
                />
              </div>

              {/* Contact List */}
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  searchQuery ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No contacts found</p>
                      <Button
                        variant="link"
                        onClick={() => setSearchQuery('')}
                        className="text-purple-400 mt-2"
                      >
                        Clear search
                      </Button>
                    </div>
                  ) : (
                    <EmptyContactList onCreateContact={handleCreateContact} />
                  )
                ) : (
                  <ContactList
                    contacts={filteredContacts}
                    onViewContact={handleViewContact}
                    onEditContact={handleEditContact}
                    onDeleteContact={handleDeleteContact}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {showFormModal && (
          <ContactFormModal
            isOpen={showFormModal}
            onClose={() => {
              setShowFormModal(false);
              setEditingContact(null);
            }}
            onSuccess={handleFormSuccess}
            editContact={editingContact}
          />
        )}

        {showDetailsModal && selectedContact && (
          <ContactDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedContact(null);
            }}
            contact={selectedContact}
            onEdit={() => {
              setShowDetailsModal(false);
              handleEditContact(selectedContact);
            }}
            onDelete={() => {
              setShowDetailsModal(false);
              handleDeleteContact(selectedContact.id);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
