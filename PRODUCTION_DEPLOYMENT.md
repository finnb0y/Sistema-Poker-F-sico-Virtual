# 🚀 Production Deployment Guide

This guide is for **system maintainers** who need to deploy the Sistema de Poker Físico-Virtual to production.

> **Important**: This is a one-time setup. Once configured, all end users can access the system without any configuration.

## 📋 Prerequisites

- Vercel account (or other hosting provider)
- Supabase account with a configured project
- GitHub repository access

## 🎯 Deployment Steps

### 1. Configure Supabase (One-Time Setup)

If you haven't already set up Supabase, follow these steps:

#### 1.1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a free account
3. Click "New Project"
4. Choose a name and secure database password
5. Select a region close to your users
6. Wait for provisioning (~2 minutes)

#### 1.2. Execute SQL Scripts

In your Supabase project:

1. Go to **SQL Editor**
2. Execute the scripts in this order:

**First: Base Database Structure**
```sql
-- Copy and paste the entire content of: supabase-setup.sql
-- This creates poker_game_state and poker_actions tables
```

**Second: Authentication System**
```sql
-- Copy and paste the entire content of: supabase-auth-migration.sql
-- This creates poker_users and poker_user_sessions tables
```

3. Verify tables were created:
   - Go to **Table Editor**
   - You should see: `poker_game_state`, `poker_actions`, `poker_users`, `poker_user_sessions`

#### 1.3. Get Credentials

1. In Supabase, go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (the JWT token under "Project API keys")

⚠️ **Important**: Use the **anon** key, NOT the service_role key!

### 2. Deploy to Vercel

#### 2.1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Log in and click "Add New..." > "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration

#### 2.2. Configure Environment Variables

**Critical Step**: Before deploying, configure these environment variables:

1. In Vercel, go to your project's **Settings** > **Environment Variables**
2. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |

3. Click "Save"

⚠️ **Critical**: Make sure to select all three environments (Production, Preview, Development) for each variable.

#### 2.3. Deploy

1. Click "Deploy"
2. Vercel will:
   - Install dependencies
   - Build the project with your environment variables
   - Deploy to production
3. Wait for deployment to complete (~2-3 minutes)

#### 2.4. Verify Deployment

1. Open the production URL provided by Vercel
2. Check browser console (F12):
   - Should see: `✅ Backend configurado - sistema pronto para uso`
   - Should NOT see: `❌ ERRO: Backend não configurado`
3. Test admin login:
   - Click "Modo Administrativo"
   - Create a test account
   - Verify you can log in

### 3. Post-Deployment Configuration

#### 3.1. Enable Automatic Deployments

Vercel automatically deploys when you push to GitHub:

1. Go to your project's **Settings** > **Git**
2. Verify "Automatically deploy" is enabled
3. Every push to main branch = automatic deployment

#### 3.2. Configure Custom Domain (Optional)

1. Go to **Settings** > **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

### 4. Monitoring and Maintenance

#### 4.1. Monitor Supabase Usage

1. In Supabase, go to **Settings** > **Billing**
2. Check your usage:
   - Database size
   - API requests
   - Bandwidth
3. Free tier limits:
   - 500 MB database
   - 2 GB bandwidth
   - 50 MB file storage

#### 4.2. Monitor Vercel Deployments

1. Go to **Deployments** in Vercel
2. Check recent deployments for errors
3. View logs if issues occur

#### 4.3. Database Backups

Supabase provides automatic backups:
- Go to **Database** > **Backups**
- Free tier: 7 daily backups
- Consider additional backup strategy for critical data

### 5. Troubleshooting

#### Issue: Users see "Sistema não configurado"

**Cause**: Environment variables not set in Vercel

**Solution**:
1. Go to Vercel Settings > Environment Variables
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Trigger a new deployment (Deployments > ... > Redeploy)

#### Issue: Authentication not working

**Cause**: SQL scripts not executed or RLS policies incorrect

**Solution**:
1. Check Supabase Table Editor for all tables
2. Verify RLS is enabled on all poker_* tables
3. Re-run SQL scripts if tables are missing

#### Issue: Real-time sync not working

**Cause**: Realtime not enabled for tables

**Solution**:
1. In Supabase, go to **Database** > **Replication**
2. Verify `poker_actions` table has replication enabled
3. Or run this SQL:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE poker_actions;
   ```

### 6. Security Checklist

Before going live, verify:

- [ ] Using **anon** key, not service_role key
- [ ] RLS (Row Level Security) enabled on all tables
- [ ] SQL scripts executed correctly
- [ ] Environment variables set in Vercel (not in code)
- [ ] `.env` file is git-ignored (not committed)
- [ ] Custom domain has SSL certificate
- [ ] Supabase database password is strong and stored securely

### 7. Scaling Considerations

As your user base grows:

#### Database Scaling
- Free tier: Up to 500 MB database
- Pro tier ($25/month): 8 GB + auto-scaling
- Monitor usage in Supabase dashboard

#### Vercel Scaling
- Free tier: Unlimited deployments, 100 GB bandwidth/month
- Pro tier ($20/month): Advanced analytics, more bandwidth
- Vercel automatically scales serverless functions

#### Real-time Connections
- Free tier: 200 concurrent connections
- Pro tier: 500 concurrent connections
- Monitor in Supabase > Settings > Database

### 8. User Communication

After deployment, inform users:

1. **Share the URL**: Provide the production URL (e.g., poker.yourdomain.com)
2. **Explain access**: 
   - Players/dealers: Use access codes
   - Organizers: Create account via "Modo Administrativo"
3. **Emphasize simplicity**: No installation or configuration needed
4. **Provide support**: Share USER_GUIDE.md link

### 9. Continuous Deployment

Your setup now supports continuous deployment:

1. **Make changes**: Edit code locally
2. **Commit**: `git commit -m "Your changes"`
3. **Push**: `git push origin main`
4. **Automatic deploy**: Vercel deploys automatically
5. **Live in ~2 minutes**: Changes are live

### 10. Documentation for Users

Share these guides with your users:

- **USER_GUIDE.md** - For all users (players, dealers, organizers)
- Production URL - Where to access the system
- Support contact - How to get help

### 11. Rollback Procedure

If a deployment has issues:

1. Go to Vercel **Deployments**
2. Find the last working deployment
3. Click "..." > "Promote to Production"
4. Previous version is instantly restored

## ✅ Deployment Checklist

Use this checklist for each deployment:

### Initial Setup (One-Time)
- [ ] Supabase project created
- [ ] SQL scripts executed (supabase-setup.sql)
- [ ] SQL scripts executed (supabase-auth-migration.sql)
- [ ] Supabase credentials obtained
- [ ] Vercel account created
- [ ] Repository connected to Vercel

### Every Deployment
- [ ] Environment variables configured in Vercel
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] Changes tested in development
- [ ] Deployment successful
- [ ] Production URL accessible
- [ ] Admin login works
- [ ] Test user can access with code
- [ ] Real-time sync working
- [ ] Browser console shows no errors

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs (Settings > Logs)
3. Verify environment variables
4. Review this guide
5. Check DEVELOPER_SETUP.md for detailed configuration

## 🎉 Success!

Once deployed, your poker system is live and accessible to all users without any configuration on their part!

Users simply:
1. Visit the URL
2. Create an account (organizers) or use access code (players/dealers)
3. Start playing!

---

**Maintainer Notes**: Keep this guide updated when making infrastructure changes. Document any custom configurations specific to your deployment.
