# 🔄 Quick Reference: System Reset

## Fast Reset Command

```bash
npm run reset-system
```

## What It Does

- ✅ Clears all user accounts
- ✅ Removes all tournaments
- ✅ Deletes all game states
- ✅ Clears all sessions
- ✅ **Preserves** database structure
- ✅ System ready immediately after

## Before Running

1. ✅ Ensure `.env` is configured
2. ✅ Run `npm install` if needed
3. ⚠️ **Backup any important data**
4. ⚠️ Notify users if system is live

## Alternative: SQL Method

1. Open Supabase SQL Editor
2. Run `reset-system.sql`
3. Verify completion

## Verification

Check tables are empty:
- `poker_users`: 0 rows
- `poker_user_sessions`: 0 rows  
- `poker_game_state`: 0 rows
- `poker_actions`: 0 rows

## Full Documentation

See [SYSTEM_RESET_GUIDE.md](./SYSTEM_RESET_GUIDE.md) for complete instructions, troubleshooting, and details.

---

⚠️ **WARNING: Irreversible action. All data will be permanently deleted.**
