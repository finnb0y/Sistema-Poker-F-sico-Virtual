# 🔄 System Reset Guide for Maintainers

This guide explains how to reset the Sistema de Poker Físico-Virtual to a clean state, removing all user data while preserving the system configuration and structure.

## 📋 Overview

The system reset functionality allows maintainers to:
- **Clear all user accounts** from the database
- **Remove all tournament data** and game states
- **Delete all session data** (log out all users)
- **Clear action history** and cached data
- **Preserve database structure** and configuration
- **Keep system ready-to-use** immediately after reset

⚠️ **WARNING**: This action is **IRREVERSIBLE**. All user data will be permanently deleted.

## 🎯 What Gets Reset

### ✓ Data That Will Be Deleted
- ✅ All user accounts (`poker_users` table)
- ✅ All user sessions (`poker_user_sessions` table)
- ✅ All tournament and game states (`poker_game_state` table)
- ✅ All action history (`poker_actions` table)
- ✅ All player registrations, tournament configurations, and cached data

### ✗ Data That Will Be Preserved
- ✅ Database structure (all tables, columns, indexes)
- ✅ Row Level Security (RLS) policies
- ✅ Database functions and stored procedures
- ✅ System configuration and environment variables
- ✅ Supabase project settings

## 🔧 Two Methods for Resetting

You can reset the system using either of these methods:

### Method 1: Using the TypeScript Script (Recommended)

This method provides an interactive CLI experience with confirmations and progress tracking.

#### Prerequisites
- Node.js 16+ installed
- npm packages installed (`npm install`)
- Environment variables configured (`.env` file or environment)

#### Steps

1. **Navigate to the project directory:**
   ```bash
   cd Sistema-Poker-Fisico-Virtual
   ```

2. **Ensure environment is configured:**
   ```bash
   npm run validate-env
   ```
   This will check if your `.env` file has the required Supabase credentials.

3. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

4. **Run the reset script:**
   ```bash
   npm run reset-system
   ```

5. **Review the current database statistics** displayed by the script

6. **Confirm the reset** by typing `RESET-SYSTEM` when prompted

7. **Wait for completion** - the script will:
   - Delete all user sessions
   - Clear all game actions
   - Remove all game states
   - Delete all user accounts
   - Verify the reset was successful
   - Display final statistics

#### Example Output

```
==================================================
Sistema de Poker - System Reset Utility
==================================================
✓ Environment variables loaded successfully
ℹ Supabase URL: https://xxxxx.supabase.co
✓ Connected to Supabase

ℹ Fetching current database statistics...
==================================================
Current Database Status
==================================================
Users:          25
Sessions:       45
Game States:    15
Actions:        1247

==================================================
⚠️  WARNING: IRREVERSIBLE ACTION  ⚠️
==================================================
⚠ This will permanently delete:
⚠   • All user accounts
⚠   • All tournament data
⚠   • All game states
⚠   • All session data
⚠   • All action history

ℹ The following will be preserved:
ℹ   • Database structure (tables, indexes)
ℹ   • Security policies (RLS)
ℹ   • Database functions

Type "RESET-SYSTEM" to confirm reset: RESET-SYSTEM

==================================================
Performing System Reset
==================================================
ℹ Deleting user sessions...
✓ User sessions cleared
ℹ Deleting game actions...
✓ Game actions cleared
ℹ Deleting game states...
✓ Game states cleared
ℹ Deleting user accounts...
✓ User accounts cleared

ℹ Verifying reset...
==================================================
Reset Complete - Final Database Status
==================================================
Users:          0 (was 25)
Sessions:       0 (was 45)
Game States:    0 (was 15)
Actions:        0 (was 1247)

==================================================
Summary
==================================================
✓ Total records deleted: 1332
✓ System has been reset to a clean state
✓ Database structure and configuration preserved
✓ System is ready for fresh use!
```

### Method 2: Using SQL Script Directly

This method executes SQL directly in the Supabase SQL Editor.

#### Prerequisites
- Access to Supabase Dashboard
- Admin/Owner permissions on the Supabase project

#### Steps

1. **Open your Supabase project dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your poker system project

2. **Navigate to SQL Editor**
   - In the left sidebar, click on "SQL Editor"

3. **Open the reset script**
   - Locate the file `reset-system.sql` in your project repository
   - Copy the entire contents of the file

4. **Paste into SQL Editor**
   - Create a new query in the SQL Editor
   - Paste the copied SQL script

5. **Review the warning comments** at the top of the script

6. **Execute the script**
   - Click "Run" or press `Ctrl+Enter`
   - Wait for execution to complete

7. **Verify the reset**
   - The script will output messages showing what was deleted
   - You can run the verification query at the bottom of the script to confirm

## 🔍 Verification After Reset

After running either reset method, you can verify the system is clean:

### Using Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Check each table:
   - `poker_users` → should have 0 rows
   - `poker_user_sessions` → should have 0 rows
   - `poker_game_state` → should have 0 rows
   - `poker_actions` → should have 0 rows

### Using SQL Query

Run this query in the SQL Editor:

```sql
SELECT 
    'poker_users' as table_name, 
    COUNT(*) as record_count 
FROM poker_users
UNION ALL
SELECT 
    'poker_user_sessions' as table_name, 
    COUNT(*) as record_count 
FROM poker_user_sessions
UNION ALL
SELECT 
    'poker_game_state' as table_name, 
    COUNT(*) as record_count 
FROM poker_game_state
UNION ALL
SELECT 
    'poker_actions' as table_name, 
    COUNT(*) as record_count 
FROM poker_actions;
```

All counts should be `0`.

### Testing the System

After reset, test that the system works:

1. **Access the application** in your browser
2. **Create a new account** (should succeed)
3. **Create a tournament** (should succeed)
4. **Add players** and generate codes (should work)
5. **Test access with codes** (should work)

## 🚨 Important Notes

### Before Resetting

- ⚠️ **Backup important data** if you need to preserve anything
- ⚠️ **Notify users** that the system will be reset (if applicable)
- ⚠️ **Schedule during off-hours** to minimize disruption
- ⚠️ **Test in a development environment** first if possible

### After Resetting

- ✅ System is immediately ready for fresh use
- ✅ No additional configuration needed
- ✅ All functionality works as expected
- ✅ Users can create new accounts and tournaments

### Security Considerations

- 🔐 The reset script requires valid Supabase credentials
- 🔐 Only maintainers with environment access can run the script
- 🔐 The SQL script requires Supabase admin access
- 🔐 Row Level Security policies remain active after reset

## 🆘 Troubleshooting

### Script Fails with "Missing environment variables"

**Solution**: Ensure your `.env` file exists and contains:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Run `npm run validate-env` to check your configuration.

### Script Fails with "Permission denied"

**Solution**: The anon key has limited permissions by design. Use the SQL script method instead, which runs with admin privileges in Supabase.

### Some Tables Still Have Data

**Solution**: 
1. Check if there are foreign key constraints preventing deletion
2. Use the SQL script method which handles cascade deletions properly
3. Manually delete data using Supabase Table Editor as last resort

### System Not Working After Reset

**Solution**:
1. Verify all tables are empty using the verification query
2. Check that RLS policies are still in place (they should be)
3. Test with a fresh browser session (clear cache if needed)
4. Check browser console for any errors

## 📞 Support

If you encounter issues with the reset process:

1. Check the [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) guide
2. Verify your Supabase configuration
3. Review the SQL scripts for any errors
4. Check Supabase logs in the dashboard

## 🔗 Related Documentation

- [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) - Development environment setup
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Production deployment guide
- [USER_GUIDE.md](./USER_GUIDE.md) - End user guide
- `supabase-setup.sql` - Initial database setup script
- `supabase-auth-migration.sql` - Authentication system setup
- `reset-system.sql` - SQL reset script
- `scripts/reset-system.ts` - TypeScript reset script

---

**Last Updated**: 2026-01-01  
**Maintained By**: Sistema de Poker Development Team
