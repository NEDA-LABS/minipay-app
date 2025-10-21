# Contact Management System - Implementation Plan

## Executive Summary

This document outlines the comprehensive plan for implementing a contact management system in the NedaPay merchant portal. The system will enable users to save and reuse recipient details for token transfers and fiat withdrawals.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Database Architecture](#2-database-architecture)
3. [API Design](#3-api-design)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Integration Points](#5-integration-points)
6. [Security & Validation](#6-security--validation)
7. [Implementation Phases](#7-implementation-phases)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. System Overview

### 1.1 Purpose
Enable users to create, manage, and use saved contacts for:
- Cryptocurrency transfers (wallet addresses)
- Fiat withdrawals (bank accounts and phone numbers via PayRamp)
- Quick autofill functionality in transaction forms

### 1.2 Core Features
- ✅ Create contacts with multiple payment methods
- ✅ Associate multiple bank accounts and phone numbers per contact
- ✅ Search and filter contacts
- ✅ Autofill transaction forms from saved contacts
- ✅ Edit and delete contacts
- ✅ Contact validation and verification
- ✅ Mark favorites for quick access
- ✅ Track last used for recency sorting

### 1.3 Design Principles (SOLID)
- **S**ingle Responsibility: Each component handles one specific aspect
- **O**pen/Closed: Extensible for new payment method types
- **L**iskov Substitution: Payment methods are interchangeable
- **I**nterface Segregation: Focused interfaces for each concern
- **D**ependency Inversion: Depend on abstractions, not concrete implementations

---

## 2. Database Architecture

### 2.1 Entity Relationship Diagram

```
User (1) ──────< (N) Contact [as owner]
  ↑                    │
  │                    ├──< (N) ContactBankAccount
  │                    ├──< (N) ContactPhoneNumber
  │                    └──< (N) ContactCryptoAddress
  │
  └── (0..1) linkedUser (optional recipient)
```

**Key Relationships:**
- **userId** → Contact owner (who created the contact) - REQUIRED
- **linkedUserId** → Optional link to NedaPay user being saved as contact
- One User can own many Contacts
- One User can be linked to many Contacts (saved by other users)
- Contact can exist without linkedUserId (external recipients)

### 2.2 Database Schema Changes

Add to `prisma/schema.prisma`:

```prisma
model Contact {
  id                String                 @id @default(uuid())
  userId            String                 // Contact owner (who created this contact)
  user              User                   @relation("OwnedContacts", fields: [userId], references: [id], onDelete: Cascade)
  
  // Optional link to existing NedaPay user (recipient)
  linkedUserId      String?                // If recipient is a NedaPay user
  linkedUser        User?                  @relation("LinkedContacts", fields: [linkedUserId], references: [id], onDelete: SetNull)
  
  // Basic Information
  name              String                 // Display name
  nickname          String?                // Optional nickname
  country           String                 // ISO country code (TZ, KE, etc)
  notes             String?                // User notes
  isNedaPayUser     Boolean                @default(false) // Quick flag for linked users
  
  // Relations
  bankAccounts      ContactBankAccount[]
  phoneNumbers      ContactPhoneNumber[]
  cryptoAddresses   ContactCryptoAddress[]
  
  // Metadata
  favorite          Boolean                @default(false)
  lastUsed          DateTime?
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  
  @@index([userId])
  @@index([userId, name])
  @@index([userId, favorite])
  @@index([userId, lastUsed])
  @@index([linkedUserId])
}

model ContactBankAccount {
  id                String    @id @default(uuid())
  contactId         String
  contact           Contact   @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  accountNumber     String
  accountName       String    // Account holder name
  bankName          String    // Institution name
  bankCode          String?   // Bank identifier
  branch            String?   // Branch name
  accountType       String?   // checking, savings, etc
  swiftCode         String?   // For international
  currency          String    @default("TZS")
  
  isPrimary         Boolean   @default(false)
  isVerified        Boolean   @default(false)
  label             String?   // User label
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([contactId])
  @@index([contactId, isPrimary])
}

model ContactPhoneNumber {
  id                String    @id @default(uuid())
  contactId         String
  contact           Contact   @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  phoneNumber       String    // E.164 format (+255...)
  provider          String    // MNO name
  country           String    // ISO country code
  
  isPrimary         Boolean   @default(false)
  isVerified        Boolean   @default(false)
  label             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([contactId])
  @@index([contactId, isPrimary])
}

model ContactCryptoAddress {
  id                String    @id @default(uuid())
  contactId         String
  contact           Contact   @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  address           String    // Wallet address
  ensName           String?   // ENS name if available
  chainId           Int?      // Preferred chain
  
  isPrimary         Boolean   @default(false)
  isVerified        Boolean   @default(false)
  label             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([contactId])
  @@index([contactId, isPrimary])
  @@index([address])
}
```

Update User model:
```prisma
model User {
  // ... existing fields
  
  // Contacts owned by this user (contacts they created)
  ownedContacts     Contact[]  @relation("OwnedContacts")
  
  // Contacts that link to this user (other users saved this user as a contact)
  linkedAsContact   Contact[]  @relation("LinkedContacts")
}
```

### 2.3 Linked vs Unlinked Contacts

#### Unlinked Contacts (External Recipients)
- `linkedUserId` = NULL
- `isNedaPayUser` = false
- Used for external recipients without NedaPay accounts
- Require manual entry of payment details

**Use Cases:**
- Sending to personal bank accounts
- Mobile money to non-users
- External wallet addresses
- Vendors without platform accounts

#### Linked Contacts (NedaPay Users)
- `linkedUserId` = valid User ID
- `isNedaPayUser` = true
- Can auto-populate verified data from linked User
- Enable platform-optimized transfers

**Benefits:**
- Auto-verify wallet addresses from User.wallet
- Show KYC/KYB verification status
- Enable cheaper in-platform transfers
- Real-time recipient status (active/inactive)
- Auto-update if recipient changes wallet

**Implementation:**
```typescript
// When creating contact for existing user
const existingUser = await prisma.user.findUnique({
  where: { wallet: cryptoAddress }
});

const contact = await prisma.contact.create({
  data: {
    userId: currentUser.id,
    linkedUserId: existingUser?.id, // Link if found
    isNedaPayUser: !!existingUser,
    name: existingUser?.name || manualName,
    // ...
  }
});
```

### 2.4 Migration Command

```bash
# Create migration
npx prisma migrate dev --name add_contact_system

# Apply to production
npx prisma migrate deploy
```

---

## 3. API Design

### 3.1 REST API Endpoints

**Base URL**: `/api/contacts`

#### Contact CRUD Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List all user contacts (with filters) |
| GET | `/api/contacts/:id` | Get single contact with details |
| POST | `/api/contacts` | Create new contact |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |
| POST | `/api/contacts/:id/favorite` | Toggle favorite status |

#### Payment Method Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contacts/:id/bank-accounts` | Add bank account |
| PUT | `/api/contacts/:id/bank-accounts/:accId` | Update bank account |
| DELETE | `/api/contacts/:id/bank-accounts/:accId` | Remove bank account |
| POST | `/api/contacts/:id/bank-accounts/:accId/primary` | Set as primary |
| POST | `/api/contacts/:id/phone-numbers` | Add phone number |
| PUT | `/api/contacts/:id/phone-numbers/:phoneId` | Update phone |
| DELETE | `/api/contacts/:id/phone-numbers/:phoneId` | Remove phone |
| POST | `/api/contacts/:id/phone-numbers/:phoneId/primary` | Set as primary |
| POST | `/api/contacts/:id/crypto-addresses` | Add crypto address |
| PUT | `/api/contacts/:id/crypto-addresses/:addrId` | Update address |
| DELETE | `/api/contacts/:id/crypto-addresses/:addrId` | Remove address |
| POST | `/api/contacts/:id/crypto-addresses/:addrId/primary` | Set as primary |
| POST | `/api/contacts/search-user` | Search for existing NedaPay user to link |

### 3.2 Request/Response Examples

#### POST `/api/contacts` - Create Contact

**Request:**
```json
{
  "name": "John Doe",
  "country": "TZ",
  "notes": "Business partner",
  "bankAccounts": [{
    "accountNumber": "1234567890",
    "accountName": "John Doe",
    "bankName": "CRDB Bank",
    "currency": "TZS",
    "isPrimary": true
  }],
  "phoneNumbers": [{
    "phoneNumber": "+255712345678",
    "provider": "Vodacom",
    "country": "TZ",
    "isPrimary": true
  }]
}
```

**Response:**
```json
{
  "success": true,
  "contact": {
    "id": "uuid",
    "name": "John Doe",
    "country": "TZ",
    "bankAccounts": [...],
    "phoneNumbers": [...]
  }
}
```

#### GET `/api/contacts?search=john&favorite=true`

**Response:**
```json
{
  "success": true,
  "contacts": [...],
  "total": 5,
  "hasMore": false
}
```

#### POST `/api/contacts/search-user` - Search for NedaPay User

**Request:**
```json
{
  "query": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "type": "wallet"  // or "email", "privyUserId"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "wallet": "0x742d35...",
    "isVerified": true,
    "isActive": true
  },
  "message": "NedaPay user found"
}
```

**Use Case:** Before creating a contact with crypto address, check if the wallet belongs to an existing NedaPay user to enable linking.

### 3.3 API Directory Structure

```
app/api/contacts/
├── route.ts                          # GET, POST
├── search-user/
│   └── route.ts                      # POST (search for existing NedaPay user)
├── [id]/
│   ├── route.ts                      # GET, PUT, DELETE
│   ├── favorite/route.ts             # POST
│   ├── bank-accounts/
│   │   ├── route.ts                  # POST
│   │   └── [accountId]/
│   │       ├── route.ts          # PUT, DELETE
│   │       └── primary/route.ts      # POST
│   ├── phone-numbers/
│   │   ├── route.ts                  # POST
│   │   └── [phoneId]/
│   │       ├── route.ts          # PUT, DELETE
│   │       └── primary/route.ts      # POST
│   └── crypto-addresses/
│       ├── route.ts                  # POST
│       └── [addressId]/
│           ├── route.ts          # PUT, DELETE
│           └── primary/route.ts      # POST
└── validate/route.ts                 # POST
```

---

## 4. Frontend Architecture

### 4.1 Component Tree

```
ContactManagement/
├── ContactList/
│   ├── ContactList.tsx               # Main list
│   ├── ContactCard.tsx               # Individual card
│   ├── ContactListSkeleton.tsx       # Loading
│   └── EmptyContactList.tsx          # Empty state
├── ContactForm/
│   ├── ContactFormModal.tsx          # Wrapper
│   ├── BasicInfoStep.tsx             # Step 1
│   ├── PaymentMethodsStep.tsx        # Step 2-3
│   └── ReviewStep.tsx                # Step 4
├── ContactDetails/
│   ├── ContactDetailsModal.tsx       # Full view
│   ├── PaymentMethodList.tsx         # Methods display
│   └── ContactActions.tsx            # Edit/Delete/Favorite
└── ContactSelector/
    ├── ContactSelectorModal.tsx      # Reusable selector
    ├── ContactSearchInput.tsx        # Search
    └── ContactFilterTabs.tsx         # Filters
```

### 4.2 TypeScript Interfaces

```typescript
// types/contact.ts

export interface Contact {
  id: string;
  userId: string;                       // Contact owner
  linkedUserId?: string | null;         // Optional link to NedaPay user
  linkedUser?: User | null;             // Populated linked user data
  name: string;
  nickname?: string;
  country: string;
  notes?: string;
  isNedaPayUser: boolean;               // Quick flag for linked users
  favorite: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  bankAccounts: ContactBankAccount[];
  phoneNumbers: ContactPhoneNumber[];
  cryptoAddresses: ContactCryptoAddress[];
}

export interface ContactBankAccount {
  id: string;
  contactId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  currency: string;
  isPrimary: boolean;
  isVerified: boolean;
  label?: string;
}

export interface ContactPhoneNumber {
  id: string;
  contactId: string;
  phoneNumber: string;
  provider: string;
  country: string;
  isPrimary: boolean;
  isVerified: boolean;
  label?: string;
}

export interface ContactCryptoAddress {
  id: string;
  contactId: string;
  address: string;
  ensName?: string;
  chainId?: number;
  isPrimary: boolean;
  isVerified: boolean;
  label?: string;
}
```

### 4.3 Custom Hooks

```typescript
// hooks/useContacts.ts
export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchContacts = async (filters?: ContactFilters) => { ... };
  const createContact = async (data: CreateContactData) => { ... };
  const updateContact = async (id: string, data: UpdateContactData) => { ... };
  const deleteContact = async (id: string) => { ... };
  
  return { contacts, loading, fetchContacts, createContact, updateContact, deleteContact };
};

// hooks/useContactAutofill.ts
export const useContactAutofill = () => {
  const autofillFromContact = (
    contact: Contact,
    paymentMethodId: string,
    formSetters: FormSetters
  ) => { ... };
  
  return { autofillFromContact };
};
```

---

## 5. Integration Points

### 5.1 Wallet Modal Integration

**File**: `app/components/(wallet)/WalletEmbedded.tsx`

Add "Contacts" tab to existing wallet modal:

```tsx
// Add import
import { Users } from 'lucide-react';
import ContactQuickAccess from '@/components/contacts/ContactQuickAccess';

// Add to TabsList (line ~527)
<TabsTrigger value="contacts">
  <Users className="h-4 w-4 mr-1" />
  Contacts
</TabsTrigger>

// Add TabsContent (after receive tab)
<TabsContent value="contacts" className="p-4">
  <ContactQuickAccess
    type="crypto"
    onSelect={(address) => {
      setSendToResolved(address);
      setActiveTab('send');
    }}
  />
</TabsContent>

// In Send tab, add contact selector button
<div className="flex justify-between items-center mb-2">
  <Label>Recipient</Label>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setShowContactSelector(true)}
  >
    Choose from Contacts
  </Button>
</div>
```

### 5.2 PayRamp Integration

**File**: `app/ramps/payramp/OffRampForm.tsx`

Add contact selector in Step 2 (account details):

```tsx
// Import
import ContactSelector from '@/components/contacts/ContactSelector';

// Add button above account input (around line 580)
<div className="flex justify-between mb-2">
  <label>Account Details</label>
  <button
    type="button"
    onClick={() => setShowContactSelector(true)}
    className="text-purple-400 text-xs"
  >
    Choose from Contacts
  </button>
</div>

// Add modal
{showContactSelector && (
  <ContactSelector
    type={fiat === 'TZS' ? 'phone' : 'bank'}
    country={fiat}
    onSelect={(contact, method) => {
      if (method.type === 'bank') {
        setAccountIdentifier(method.accountNumber);
        setAccountName(method.accountName);
        setInstitution(method.bankName);
      } else {
        setAccountIdentifier(method.phoneNumber);
        setInstitution(method.provider);
      }
      setShowContactSelector(false);
    }}
    onClose={() => setShowContactSelector(false)}
  />
)}
```

### 5.3 Dashboard Navigation

Add to main navigation menu:

```tsx
{
  name: 'Contacts',
  href: '/dashboard/contacts',
  icon: Users,
  description: 'Manage saved recipients'
}
```

---

## 6. Security & Validation

### 6.1 Authentication Middleware

```typescript
// middleware/contactAuth.ts
export async function verifyContactOwnership(
  userId: string,
  contactId: string
): Promise<boolean> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { userId: true }
  });
  
  return contact?.userId === userId;
}
```

### 6.2 Input Validation (Zod Schema)

```typescript
// utils/validation/contactSchemas.ts
import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(2).max(100),
  nickname: z.string().max(50).optional(),
  country: z.string().length(2),
  notes: z.string().max(500).optional(),
  linkedUserId: z.string().uuid().optional().nullable(),  // Optional link to User
  isNedaPayUser: z.boolean().default(false),
  
  bankAccounts: z.array(z.object({
    accountNumber: z.string().regex(/^\d+$/),
    accountName: z.string().min(3),
    bankName: z.string().min(2),
    currency: z.string().length(3)
  })).optional(),
  
  phoneNumbers: z.array(z.object({
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
    provider: z.string().min(2),
    country: z.string().length(2)
  })).optional(),
  
  cryptoAddresses: z.array(z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainId: z.number().int().positive().optional()
  })).optional()
});
```

### 6.3 Rate Limiting

Apply rate limits to prevent abuse:
- Contact creation: 20/hour per user
- Contact updates: 50/hour per user
- Contact queries: 200/hour per user

### 6.4 Data Protection

- No logging of sensitive data (account numbers, phone numbers)
- HTTPS only for all API calls
- User can only access their own contacts
- Soft delete option for compliance

---

## 7. Implementation Phases

### Phase 1: Database & API (Week 1-2)

**Tasks:**
- [ ] Create Prisma schema models
- [ ] Run database migrations
- [ ] Implement API routes (CRUD)
- [ ] Add authentication middleware
- [ ] Write API tests
- [ ] Document API endpoints

**Deliverables:**
- Working REST API
- API documentation
- Unit tests (>80% coverage)

### Phase 2: Core UI Components (Week 3-4)

**Tasks:**
- [ ] Build ContactForm component
- [ ] Build ContactList component
- [ ] Build ContactCard component
- [ ] Create TypeScript interfaces
- [ ] Implement custom hooks
- [ ] Add loading/error states
- [ ] Mobile responsive design

**Deliverables:**
- Standalone contact management page
- Reusable components
- Component storybook

### Phase 3: Integration (Week 5)

**Tasks:**
- [ ] Integrate with Wallet modal
- [ ] Integrate with PayRamp form
- [ ] Add dashboard navigation
- [ ] Implement autofill logic
- [ ] Add success/error toasts
- [ ] User testing & feedback

**Deliverables:**
- Fully integrated contact system
- Working autofill in all forms
- User documentation

### Phase 4: Polish & Deploy (Week 6)

**Tasks:**
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Cross-browser testing
- [ ] Security audit
- [ ] Bug fixes
- [ ] Production deployment
- [ ] Monitor & iterate

**Deliverables:**
- Production-ready feature
- Performance metrics
- Security audit report

---

## 8. Testing Strategy

### 8.1 Unit Tests

**API Layer:**
```typescript
// __tests__/api/contacts.test.ts
describe('Contact API', () => {
  it('should create contact with valid data', async () => { ... });
  it('should reject invalid phone number format', async () => { ... });
  it('should prevent access to other users contacts', async () => { ... });
});
```

**Components:**
```typescript
// __tests__/components/ContactForm.test.tsx
describe('ContactForm', () => {
  it('should validate required fields', () => { ... });
  it('should submit form with valid data', () => { ... });
  it('should display error messages', () => { ... });
});
```

### 8.2 Integration Tests

- Complete flow: Create contact → Use in transaction
- Autofill accuracy tests
- Multiple payment methods handling

### 8.3 E2E Tests (Playwright)

```typescript
test('user can create and use contact', async ({ page }) => {
  await page.goto('/dashboard/contacts');
  await page.click('text=New Contact');
  await page.fill('[name="name"]', 'Test Contact');
  // ... complete form
  await page.click('text=Save');
  
  // Use in transaction
  await page.goto('/wallet');
  await page.click('text=Send');
  await page.click('text=Choose from Contacts');
  await page.click('text=Test Contact');
  
  // Verify autofill
  const address = await page.inputValue('[name="recipient"]');
  expect(address).toBeTruthy();
});
```

### 8.4 Acceptance Criteria

✅ User can create contact with minimum fields (name, country)  
✅ User can add multiple bank accounts to one contact  
✅ User can search contacts by name  
✅ Wallet send form autofills from contact  
✅ PayRamp form autofills from contact  
✅ Contact data persists after refresh  
✅ Only contact owner can view/edit contact  
✅ Mobile responsive on all screens  

---

## 9. Success Metrics

### 9.1 Performance Metrics
- Contact list load time: < 500ms
- Contact creation: < 1s
- Autofill response: < 100ms

### 9.2 User Adoption Metrics
- % of users creating contacts (target: >40%)
- Average contacts per user (target: >3)
- % of transactions using contacts (target: >60%)
- Contact re-use rate (target: >70%)

### 9.3 Error Rate Metrics
- API error rate: < 1%
- Form validation error rate: < 5%
- Failed autofill rate: < 2%

---

## 10. Future Enhancements

### Phase 2 Features (Post-Launch)
- Contact import/export (CSV)
- Contact sharing between users (with permissions)
- Contact groups/categories
- Duplicate contact detection
- Contact merge functionality
- Transaction history per contact
- Contact verification badges
- Bulk operations (delete, export)
- Contact backup/restore

### Advanced Features
- Smart suggestions based on transaction history
- ML-based duplicate detection
- Integration with external contact sources
- Contact sync across devices
- Advanced search (fuzzy matching)
- Contact analytics dashboard

---

## Appendix

### A. File Structure

```
app/
├── api/contacts/                     # API routes
├── dashboard/contacts/               # Contact management page
├── components/contacts/              # Contact components
├── hooks/                            # Custom hooks
│   ├── useContacts.ts
│   └── useContactAutofill.ts
├── types/contact.ts                  # TypeScript types
└── utils/
    ├── validation/contactSchemas.ts  # Zod schemas
    └── contactHelpers.ts             # Utility functions

prisma/
└── schema.prisma                     # Database schema

docs/
└── CONTACT_SYSTEM_IMPLEMENTATION_PLAN.md
```

### B. Dependencies

**New packages to install:**
```json
{
  "libphonenumber-js": "^1.10.51",  // Phone number validation
  "country-list": "^2.3.0",          // Country data
  "react-phone-number-input": "^3.3.7" // Phone input component
}
```

### C. Environment Variables

```env
# No new environment variables required
# Uses existing DATABASE_URL and authentication
```

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building a robust contact management system. The phased approach ensures steady progress with testable milestones. Following SOLID principles and security best practices will result in a maintainable, scalable feature that significantly improves user experience.

**Next Steps:**
1. Review and approve this plan
2. Create GitHub issues for Phase 1 tasks
3. Set up project board for tracking
4. Begin database schema implementation

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-21  
**Author:** Cascade AI  
**Status:** Ready for Review
