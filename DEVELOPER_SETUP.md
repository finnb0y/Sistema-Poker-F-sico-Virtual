# 🔧 Developer Setup Guide

This guide is for **developers and site maintainers** who need to set up and deploy the Sistema de Poker Físico-Virtual.

> **Note for End Users**: If you're just looking to play poker, you don't need this guide! Check out [USER_GUIDE.md](USER_GUIDE.md) instead.

## 🎯 Overview

This system requires a **managed Supabase backend** that should be configured once by developers/maintainers. End users don't need to perform any configuration.

## 📋 Prerequisites

- Node.js 16+ installed
- npm or yarn
- A Supabase account (free tier works fine)
- (Optional) Vercel account for deployment

## 🚀 Initial Setup for Developers

### 1. Clone the Repository

```bash
git clone https://github.com/finnb0y/Sistema-Poker-Fisico-Virtual.git
cd Sistema-Poker-Fisico-Virtual
npm install
```

### 2. Set Up Supabase (Required)

This system **requires** Supabase for:
- User authentication
- Real-time synchronization
- Multi-device support
- Database storage

#### 2.1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a free account (if you don't have one)
3. Create a new project
4. Choose a secure database password (save it!)
5. Select a region close to your users
6. Wait for the project to be provisioned (~2 minutes)

#### 2.2. Execute SQL Scripts

In your Supabase project, go to the **SQL Editor** and execute these scripts **in order**:

**First: Database Structure**
```sql
-- Copy and paste the entire content of: supabase-setup.sql
-- This creates the base tables for game state and actions
```

**Second: Authentication System**
```sql
-- Copy and paste the entire content of: supabase-auth-migration.sql
-- This adds user authentication and data isolation
```

After executing, verify the tables were created:
- `poker_game_state`
- `poker_actions`
- `poker_users`
- `poker_user_sessions`

#### 2.3. Get Your Credentials

1. In your Supabase project, go to **Settings** > **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (the long JWT token)

⚠️ **Important**: Use the **anon** key, NOT the service_role key (service_role should never be exposed to the frontend).

### 3. Configure Environment Variables

#### For Local Development

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Supabase credentials
nano .env  # or use your preferred editor
```

Your `.env` file should look like:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### For Production (Vercel)

The production deployment should use environment variables configured in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |

5. Click **Save**
6. Trigger a new deployment (or push to trigger automatic deployment)

### 4. Validate Configuration

```bash
# Run the validation script
npm run validate-env

# Expected output if configured correctly:
# ✅ Arquivo .env configurado com credenciais
# 🎉 Configuração parece estar correta!
# 🚀 Inicie o servidor com: npm run dev
```

### 5. Start Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:3000`

If properly configured, you should see:
```
✅ Supabase configurado - sincronização multi-dispositivo habilitada
🔗 Conectando ao projeto: https://your-project.supabase.co
```

## 🏗️ Build and Deploy

### Build for Production

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

### Deploy to Vercel

#### Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables (see section 3 above)
4. Vercel will automatically deploy on every push

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🔒 Security Considerations

### Authentication

The current implementation uses **custom authentication** with SHA-256 password hashing.

⚠️ **Security Warning**: SHA-256 is NOT secure for production password hashing. For production deployment, consider:

1. **Migrating to Supabase Auth** (recommended)
   - Built-in security features
   - Email verification
   - Password reset
   - OAuth providers (Google, GitHub, etc.)

2. **Implementing server-side hashing**
   - Use bcrypt, argon2, or PBKDF2
   - Never hash passwords client-side only

### Row Level Security (RLS)

The SQL scripts configure RLS policies to:
- Isolate each user's tournaments and game data
- Prevent unauthorized access to other users' data
- Allow players/dealers to access their assigned tables

**Verify RLS is enabled:**
```sql
-- Run this in Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'poker_%';
```

All tables should have `rowsecurity = true`.

### Environment Variables

- ✅ **DO** store credentials in `.env` for local development
- ✅ **DO** use Vercel environment variables for production
- ✅ **DO** use the `anon` key (public key)
- ❌ **DON'T** commit `.env` to Git
- ❌ **DON'T** use `service_role` key in frontend code
- ❌ **DON'T** expose credentials in public repositories

## 🧪 Testing

### Run Test Environment

```bash
# Run all tests
npx tsx utils/pokerTestEnvironment.test.ts

# Run specific tests
npx tsx utils/sidePotLogic.test.ts
npx tsx utils/multipleAllInRounds.test.ts
```

### Test Multi-Device Sync

1. Start the dev server: `npm run dev`
2. Open the app in two different browsers or devices
3. Create a tournament in one browser
4. Verify it appears in the other browser

### Validate Build

```bash
# Build the app
npm run build

# Test the build locally
npm run preview
```

## 📁 Project Structure

```
├── components/          # React components
│   ├── Login.tsx       # Authentication UI
│   ├── PlayerDashboard.tsx
│   └── DealerControls.tsx
├── services/           # Business logic
│   ├── authService.ts  # User authentication
│   ├── supabaseClient.ts  # Supabase configuration
│   └── syncService.ts  # Real-time synchronization
├── utils/              # Poker game logic
├── docs/               # Technical documentation
├── scripts/            # Build and validation scripts
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
├── supabase-setup.sql  # Database schema
├── supabase-auth-migration.sql  # Auth tables
└── vite.config.ts      # Vite configuration
```

## 🔧 Configuration Files

### Required for Deployment

- `.env` - Local environment variables (git-ignored)
- `vercel.json` - Vercel deployment configuration
- `vite.config.ts` - Build configuration

### SQL Scripts

- `supabase-setup.sql` - Core database tables
- `supabase-auth-migration.sql` - Authentication and user isolation

### Documentation

- `README.md` - Project overview (user-focused after this PR)
- `USER_GUIDE.md` - End-user guide
- `DEVELOPER_SETUP.md` - This file
- `ENVIRONMENT_SETUP.md` - Detailed environment configuration

## 🐛 Troubleshooting

### Supabase Connection Issues

**Problem**: Console shows "Supabase não configurado"

**Solution**:
1. Verify `.env` file exists and has correct values
2. Restart the development server
3. Clear browser cache
4. Check Supabase project is active

### Build Failures

**Problem**: Build fails with environment variable errors

**Solution**:
1. Ensure environment variables are set in Vercel
2. Check variable names start with `VITE_`
3. Verify no extra spaces or quotes in values

### Real-time Not Working

**Problem**: Changes don't sync between devices

**Solution**:
1. Check Supabase Realtime is enabled for `poker_actions` table
2. Verify RLS policies are correctly configured
3. Check browser console for WebSocket errors
4. Ensure anon key has correct permissions

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Vercel Documentation](https://vercel.com/docs)
- [React Documentation](https://react.dev/)

## 🤝 Contributing

If you're contributing to the project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including multi-device sync)
5. Submit a pull request

### Development Workflow

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit: `git commit -m "Description of changes"`
4. Push: `git push origin feature/your-feature`
5. Open a pull request

## 💡 Tips for Maintainers

1. **Keep one production Supabase instance**: All users connect to the same backend
2. **Monitor usage**: Check Supabase dashboard for API usage and database size
3. **Regular backups**: Supabase provides automatic backups, but consider additional backups for critical data
4. **Update dependencies**: Regularly update npm packages and Supabase
5. **Monitor errors**: Set up error tracking (Sentry, LogRocket, etc.)

## ⚠️ Important Notes

- **End users should never see this documentation**
- **Only maintainers need Supabase access**
- **All configuration should be done once during setup**
- **Users access the live site with zero configuration**

---

For questions or issues, open a GitHub issue or contact the maintainers.
