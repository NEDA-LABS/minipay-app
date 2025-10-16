# NedaPay Merchant Portal - Development Setup Guide

Complete guide for setting up the NedaPay merchant portal development environment.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Third-Party Services](#third-party-services)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (v20.x or higher)
  ```bash
  node --version  # Should be v20.x or higher
  ```

- **npm** (v10.x or higher) or **pnpm** (recommended)
  ```bash
  npm --version   # Should be v10.x or higher
  # OR
  pnpm --version
  ```

- **Git**
  ```bash
  git --version
  ```

- **PostgreSQL** (v14 or higher)
  ```bash
  psql --version  # Should be v14 or higher
  ```

### Optional but Recommended

- **Docker** (for running PostgreSQL and Redis locally)
- **VS Code** with recommended extensions:
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd NedaPay-merchant
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using pnpm (recommended for faster installs):
```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Then edit `.env` with your actual configuration values (see [Environment Setup](#environment-setup) for details).

### 4. Set Up Database

```bash
# Generate Prisma client
npm run postinstall

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## Environment Setup

### Database Configuration

#### PostgreSQL Setup

**Option 1: Local PostgreSQL**

1. Install PostgreSQL on your system
2. Create a new database:
   ```bash
   createdb nedapay
   ```
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/nedapay?schema=public"
   DIRECT_URL="postgresql://username:password@localhost:5432/nedapay?schema=public"
   ```

**Option 2: Docker PostgreSQL**

```bash
docker run --name nedapay-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=nedapay \
  -p 5432:5432 \
  -d postgres:14
```

**Option 3: Cloud PostgreSQL (Recommended for Production)**

Use services like:
- **Supabase** (includes PostgreSQL + additional features)
- **Neon** (serverless PostgreSQL)
- **Railway** (easy deployment)
- **Render** (free tier available)

### Redis/Upstash KV Setup

**Option 1: Upstash (Recommended)**

1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST API credentials
4. Update `.env`:
   ```env
   KV_REST_API_URL="https://your-instance.upstash.io"
   KV_REST_API_TOKEN="your-token"
   ```

**Option 2: Local Redis**

```bash
docker run --name nedapay-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

---

## Third-Party Services

### 1. Privy Authentication

1. Sign up at [privy.io](https://privy.io)
2. Create a new application
3. Configure allowed domains (add `localhost:3000` for development)
4. Copy your App ID and App Secret
5. Update `.env`:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID="your-app-id"
   PRIVY_APP_SECRET="your-app-secret"
   ```

### 2. Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Settings > API
4. Copy the Project URL and API keys
5. Update `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

### 3. Sumsub KYC/KYB

1. Sign up at [sumsub.com](https://sumsub.com)
2. Create a new application
3. Navigate to Settings > App Tokens
4. Generate API credentials
5. Set up webhook endpoint
6. Update `.env`:
   ```env
   SUMSUB_APP_TOKEN="your-app-token"
   SUMSUB_SECRET_KEY="your-secret-key"
   SUMSUB_BASE_URL="https://api.sumsub.com"
   SUMSUB_WEBHOOK_SECRET="your-webhook-secret"
   ```

### 4. Blockchain RPC Providers

**Recommended Providers:**
- **Coinbase Developer Platform** (for Base network)
- **Alchemy** (multi-chain support)
- **Infura** (multi-chain support)
- **QuickNode** (high performance)

**Free Public RPCs (for development only):**

Update `.env` with your RPC endpoints:
```env
NEXT_PUBLIC_COINBASE_BASE_RPC="https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY"
NEXT_PUBLIC_POLYGON_RPC="https://polygon-rpc.com"
NEXT_PUBLIC_ARBITRUM_RPC="https://arb1.arbitrum.io/rpc"
# ... add other networks as needed
```

### 5. Smart Contract Deployment

If you need to deploy your own smart contracts:

1. Navigate to the `contracts/` directory
2. Install dependencies:
   ```bash
   cd contracts
   npm install
   ```
3. Configure deployment settings
4. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network base
   ```
5. Update `.env` with deployed contract addresses:
   ```env
   NEXT_PUBLIC_FACTORY_ADDRESS="0x..."
   ```

### 6. Across Protocol Integration

1. Sign up for Across Protocol integrator ID
2. Update `.env`:
   ```env
   NEXT_PUBLIC_ACROSS_INTEGRATOR_ID="0x..."
   ```

---

## Database Setup

### Prisma Migrations

**Create a new migration:**
```bash
npx prisma migrate dev --name your_migration_name
```

**Apply migrations:**
```bash
npx prisma migrate deploy
```

**Reset database (⚠️ WARNING: Deletes all data):**
```bash
npx prisma migrate reset
```

### Prisma Studio

View and edit your database with Prisma Studio:
```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555`

### Database Seeding

Create a seed file at `prisma/seed.ts` and run:
```bash
npx prisma db seed
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Features:
- Hot module replacement
- Turbopack for faster builds
- Error overlay
- Available at `http://localhost:3000`

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Linting

```bash
npm run lint
```

### Force Build (for Netlify/CI)

```bash
npm run force-build
```

---

## Development Workflow

### Key Technologies

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Privy
- **Blockchain:** Wagmi 2.14.16, Viem 2.31.4, Ethers.js 5.8.0
- **State Management:** React 19 hooks, TanStack Query
- **UI Components:** Radix UI, shadcn/ui
- **Charts:** Recharts, Chart.js

### Supported Blockchain Networks

- Base Mainnet (Primary)
- Arbitrum One
- Polygon Mainnet
- Optimism
- BNB Smart Chain
- Scroll Mainnet
- Celo Mainnet
- Lisk Mainnet

### Supported Stablecoins

**Global:**
- USDC, USDT, EURC

**Regional:**
- cNGN (Nigeria)
- ZARP (South Africa)
- IDRX (Indonesia)
- CADC (Canada)
- BRL (Brazil)
- TRYB (Turkey)
- NZDD (New Zealand)
- MXNe (Mexico)

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error:** `Can't reach database server`

**Solution:**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify credentials
- Test connection: `psql -h localhost -U username -d nedapay`

#### 2. Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npx prisma generate
```

#### 3. Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### 4. Environment Variables Not Loading

**Error:** `process.env.VARIABLE_NAME is undefined`

**Solution:**
- Ensure `.env` file exists in root directory
- Restart the development server
- Check variable names (must start with `NEXT_PUBLIC_` for client-side)
- Verify no syntax errors in `.env` file

#### 5. Wallet Connection Issues

**Error:** Wallet not connecting or network mismatch

**Solution:**
- Check RPC endpoints are valid
- Ensure wallet is on correct network
- Clear browser cache and cookies
- Check Privy configuration

#### 6. Build Errors

**Error:** Build fails with TypeScript errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

#### 7. Memory Issues During Development

**Error:** `JavaScript heap out of memory`

**Solution:**
The project already includes memory optimization in `package.json`:
```json
"dev": "NODE_OPTIONS='--max-old-space-size=1024' next dev --turbopack"
```

If you still face issues, increase the value:
```bash
NODE_OPTIONS='--max-old-space-size=2048' npm run dev
```

### Getting Help

- **Documentation:** Check `TECHNICAL_OVERVIEW.md` and `ARCHITECTURE.md`
- **Issues:** Create an issue in the repository
- **Logs:** Check browser console and terminal output
- **Prisma Issues:** Run `npx prisma validate` to check schema

---

## Security Best Practices

### Environment Variables

- ✅ **DO:** Keep `.env` file in `.gitignore`
- ✅ **DO:** Use different values for development and production
- ✅ **DO:** Rotate secrets regularly
- ❌ **DON'T:** Commit `.env` file to version control
- ❌ **DON'T:** Share secrets in chat or email
- ❌ **DON'T:** Use production credentials in development

### API Keys

- Store sensitive keys server-side only
- Use `NEXT_PUBLIC_` prefix only for truly public values
- Implement rate limiting (already configured with Upstash)
- Monitor API usage

### Database

- Use strong passwords
- Enable SSL for production databases
- Regular backups
- Implement proper access controls

---

## Additional Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Privy Documentation](https://docs.privy.io)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Related Files

- `README.md` - Project overview and features
- `TECHNICAL_OVERVIEW.md` - Technical architecture details
- `ARCHITECTURE.md` - System architecture diagrams
- `TODO.md` - Development roadmap

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run linting: `npm run lint`
4. Test thoroughly
5. Commit: `git commit -m "feat: your feature description"`
6. Push: `git push origin feature/your-feature`
7. Create a Pull Request

---

## License

[Add your license information here]

---

## Support

For questions or issues:
- Email: [your-email@example.com]
- Discord: [your-discord-link]
- GitHub Issues: [repository-issues-url]

---

**Happy Coding! 🚀**
