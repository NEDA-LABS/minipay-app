/**
 * Contact Management System - Type Definitions
 * Comprehensive type system for contact entities and operations
 */

export interface Contact {
  id: string;
  userId: string;                       // Contact owner
  linkedUserId?: string | null;         // Optional link to NedaPay user
  linkedUser?: LinkedUserInfo | null;   // Populated linked user data
  name: string;
  nickname?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  country: string;                      // ISO country code
  notes?: string | null;
  isNedaPayUser: boolean;               // Quick flag for linked users
  favorite: boolean;
  lastUsed?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  bankAccounts: ContactBankAccount[];
  phoneNumbers: ContactPhoneNumber[];
  cryptoAddresses: ContactCryptoAddress[];
}

export interface LinkedUserInfo {
  id: string;
  name?: string | null;
  email?: string | null;
  wallet?: string | null;
  isActive: boolean;
}

export interface ContactBankAccount {
  id: string;
  contactId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string | null;
  branch?: string | null;
  accountType?: string | null;
  swiftCode?: string | null;
  currency: string;
  isPrimary: boolean;
  isVerified: boolean;
  label?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactPhoneNumber {
  id: string;
  contactId: string;
  phoneNumber: string;                  // E.164 format
  provider: string;                     // MNO name
  country: string;                      // ISO country code
  isPrimary: boolean;
  isVerified: boolean;
  label?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactCryptoAddress {
  id: string;
  contactId: string;
  address: string;                      // Wallet address
  ensName?: string | null;              // ENS name if available
  chainId?: number | null;              // Preferred chain
  isPrimary: boolean;
  isVerified: boolean;
  label?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============ DTOs (Data Transfer Objects) ============

export interface CreateContactData {
  name: string;
  nickname?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  notes?: string;
  favorite?: boolean;
  linkedUserId?: string | null;
  isNedaPayUser?: boolean;
  bankAccounts?: CreateBankAccountData[];
  phoneNumbers?: CreatePhoneNumberData[];
  cryptoAddresses?: CreateCryptoAddressData[];
}

export interface UpdateContactData extends Partial<CreateContactData> {
  // All fields inherited from CreateContactData
}

export interface CreateBankAccountData {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  branch?: string;
  accountType?: string;
  swiftCode?: string;
  currency?: string;
  isPrimary?: boolean;
  label?: string;
}

export interface CreatePhoneNumberData {
  phoneNumber: string;
  provider: string;
  country: string;
  isPrimary?: boolean;
  label?: string;
}

export interface CreateCryptoAddressData {
  address: string;
  ensName?: string;
  chainId?: number;
  isPrimary?: boolean;
  label?: string;
}

// ============ API Response Types ============

export interface ContactsResponse {
  success: boolean;
  contacts: Contact[];
  total: number;
  hasMore: boolean;
}

export interface ContactResponse {
  success: boolean;
  contact: Contact;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface UserSearchResponse {
  success: boolean;
  user: LinkedUserInfo | null;
  message: string;
}

// ============ Filter & Query Types ============

export interface ContactFilters {
  search?: string;
  country?: string;
  favorite?: boolean;
  isNedaPayUser?: boolean;
  limit?: number;
  offset?: number;
}

export interface PaymentMethodFilter {
  type: 'bank' | 'phone' | 'crypto';
  country?: string;
}

// ============ Form Types ============

export interface ContactFormStep {
  id: number;
  title: string;
  completed: boolean;
}

export interface ContactFormState {
  currentStep: number;
  formData: Partial<CreateContactData>;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

// ============ Component Props Types ============

export interface ContactSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: Contact, paymentMethod?: PaymentMethodDetails) => void;
  type?: 'bank' | 'phone' | 'crypto' | 'all';
  country?: string;
  title?: string;
}

export interface PaymentMethodDetails {
  type: 'bank' | 'phone' | 'crypto';
  data: ContactBankAccount | ContactPhoneNumber | ContactCryptoAddress;
}

export interface ContactCardProps {
  contact: Contact;
  onSelect?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onToggleFavorite?: (contactId: string) => void;
  compact?: boolean;
}

export interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contact: Contact) => void;
  editContact?: Contact | null;
  prefillData?: Partial<CreateContactData>;
}

// ============ Utility Types ============

export type PaymentMethodType = 'bank' | 'phone' | 'crypto';

export type ContactSortField = 'name' | 'createdAt' | 'lastUsed' | 'favorite';

export type SortDirection = 'asc' | 'desc';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}
