# Admin Dashboard Setup Guide

This guide explains the new admin dashboard features and how to set up the database for bank withdrawal controls.

## 🎯 Features Added

### 1. **Password Protection**
- Admin dashboard now requires password authentication
- Password stored securely in `.env` file
- Session-based authentication with 24-hour cookie

### 2. **Bank Withdrawal Controls**
- Control bank transfers for Payramp/Paycrest by currency
- Toggle bank withdrawals on/off for:
  - 🇹🇿 Tanzania (TZS)
  - 🇰🇪 Kenya (KES)
  - 🇺🇬 Uganda (UGX)
  - 🇳🇬 Nigeria (NGN)
  - 🇬🇭 Ghana (GHS)

### 3. **Platform Controls**
- Maintenance mode toggle
- New user registration control

### 4. **Organized Dashboard**
The admin dashboard is now organized into clear tabs:
- **Offramp Transactions** - Monitor payment transactions
- **Broadcast Notifications** - Send push notifications to users
- **User Onboarding · IDRXCO** - Manage IDRX onboarding
- **Referrals Analytics** - Track referral performance
- **System Settings** - Configure platform features (NEW)

---

## 🚀 Setup Instructions

### Step 1: Set Admin Password

Add the following to your `.env` file:

```bash
# Admin dashboard password (use a strong password)
# Generate a strong password: openssl rand -base64 32
ADMIN_PASSWORD="your-strong-admin-password"
```

**Generate a strong password:**
```bash
openssl rand -base64 32
```

### Step 2: Run Database Migration

The new `AdminSettings` model needs to be added to your database.

```bash
# Generate the migration
npx prisma migrate dev --name add_admin_settings

# Or if you prefer to push directly (for development)
npx prisma db push
```

### Step 3: Restart Your Application

```bash
# If using npm
npm run dev

# If using yarn
yarn dev
```

---

## 📊 Database Schema

The new `AdminSettings` model:

```prisma
model AdminSettings {
  id                    String   @id @default(uuid())
  
  // Payramp/Paycrest Bank Withdrawal Controls
  allowBankWithdrawals  Json     @default("{\"TZS\": false, \"KES\": true, \"UGX\": true, \"NGN\": true, \"GHS\": true}")
  
  // Additional feature flags
  maintenanceMode       Boolean  @default(false)
  allowNewRegistrations Boolean  @default(true)
  
  // Metadata
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  lastModifiedBy        String?
  
  @@map("admin_settings")
}
```

---

## 🔐 How It Works

### Password Authentication Flow

1. User visits `/admin/dashboard`
2. System checks for `admin-authenticated` cookie
3. If not authenticated, password dialog appears
4. User enters password
5. Password verified against `ADMIN_PASSWORD` env variable
6. Secure HTTP-only cookie set for 24 hours
7. User gains access to admin dashboard

### Bank Withdrawal Control Flow

1. Admin toggles bank withdrawal setting in System Settings tab
2. Setting saved to database via `/api/admin/settings`
3. When user initiates withdrawal:
   - Frontend calls `/api/admin/settings/bank-withdrawals?currency=TZS`
   - API returns whether banks are allowed for that currency
   - If disabled, only mobile money options shown
   - If enabled, both banks and mobile money shown

---

## 🎨 Admin Dashboard Structure

```
/admin/dashboard
├── Offramp Transactions
│   └── View and monitor all offramp transactions
├── Broadcast Notifications
│   └── Send push notifications to users
├── User Onboarding · IDRXCO
│   ├── Onboarding Form
│   └── Onboarding Status
├── Referrals Analytics
│   └── Track referral performance and influencer stats
└── System Settings (NEW)
    ├── Bank Withdrawal Controls
    │   ├── Tanzania (TZS) - Toggle bank transfers
    │   ├── Kenya (KES) - Toggle bank transfers
    │   ├── Uganda (UGX) - Toggle bank transfers
    │   ├── Nigeria (NGN) - Toggle bank transfers
    │   └── Ghana (GHS) - Toggle bank transfers
    └── Platform Controls
        ├── Maintenance Mode
        └── New Registrations
```

---

## 🔧 API Endpoints

### Admin Settings

**GET** `/api/admin/settings`
- Retrieve current admin settings
- Requires authentication

**PUT** `/api/admin/settings`
- Update admin settings
- Requires authentication
- Body:
  ```json
  {
    "allowBankWithdrawals": {
      "TZS": false,
      "KES": true,
      "UGX": true,
      "NGN": true,
      "GHS": true
    },
    "maintenanceMode": false,
    "allowNewRegistrations": true,
    "modifiedBy": "admin"
  }
  ```

**GET** `/api/admin/settings/bank-withdrawals?currency=TZS`
- Check if bank withdrawals are allowed for a currency
- Public endpoint (used by offramp flow)
- Response:
  ```json
  {
    "currency": "TZS",
    "allowBankWithdrawals": false
  }
  ```

### Password Verification

**POST** `/api/admin/verify-password`
- Verify admin password
- Body:
  ```json
  {
    "password": "your-password"
  }
  ```

**GET** `/api/admin/verify-password`
- Check authentication status
- Returns:
  ```json
  {
    "authenticated": true
  }
  ```

---

## 🎯 Usage Examples

### Disabling Bank Withdrawals for Tanzania

1. Navigate to `/admin/dashboard`
2. Enter admin password
3. Click on **System Settings** tab
4. Find **Tanzania (TZS)** in Bank Withdrawal Controls
5. Toggle switch to OFF (gray)
6. Click **Save Changes**

Now when users try to withdraw to Tanzania, they will only see mobile money options (M-Pesa, Tigo Pesa, etc.) and bank options will be hidden.

### Enabling Bank Withdrawals for Kenya

1. Navigate to **System Settings** tab
2. Find **Kenya (KES)** in Bank Withdrawal Controls
3. Toggle switch to ON (blue)
4. Click **Save Changes**

Now users can withdraw to both mobile money and bank accounts in Kenya.

---

## 🔒 Security Considerations

1. **Password Storage**: Admin password stored in `.env` file (never committed to git)
2. **HTTP-Only Cookies**: Authentication cookie is HTTP-only and secure in production
3. **Server-Side Validation**: All password verification happens server-side
4. **Session Expiry**: Authentication expires after 24 hours
5. **API Protection**: Settings modification requires authentication

---

## 🐛 Troubleshooting

### "ADMIN_PASSWORD not set" Error
- Make sure you've added `ADMIN_PASSWORD` to your `.env` file
- Restart your development server after adding the variable

### Password Dialog Not Appearing
- Clear your browser cookies for localhost
- Check browser console for errors

### Settings Not Saving
- Check browser console for API errors
- Verify database migration ran successfully
- Check Prisma Client is up to date: `npx prisma generate`

### Bank Withdrawals Still Showing After Disabling
- Clear browser cache
- Verify settings saved successfully in admin panel
- Check API response: `/api/admin/settings/bank-withdrawals?currency=TZS`

---

## 📝 Future Enhancements

Potential features to add:
- Multi-admin user management
- Audit log for settings changes
- Email notifications for critical changes
- Role-based access control (RBAC)
- Two-factor authentication (2FA)
- Settings history/rollback
- Bulk currency configuration

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check server logs
4. Verify database schema is up to date

---

**Last Updated**: October 2025
**Version**: 1.0.0
