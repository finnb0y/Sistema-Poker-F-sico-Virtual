# Club System Implementation - Setup Guide

## Quick Start

### Prerequisites
1. Supabase account and project
2. Node.js and npm installed
3. Environment variables configured

### Database Setup

Execute the SQL migrations in this order:

```bash
# 1. Base tables
supabase-setup.sql

# 2. Authentication system
supabase-auth-migration.sql

# 3. Clubs system
supabase-clubs-migration.sql
```

### Environment Variables
Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build and Run

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Testing the Club System

### 1. Test Owner Flow

#### Create a Club Owner Account
1. Navigate to the app
2. Click "Modo Administrativo"
3. Click "Criar Conta"
4. Enter username and password
5. Login automatically redirected

#### Create a Club
1. After login, click "VOLTAR" to go back
2. Click "ENTRAR EM UM CLUBE"
3. Click "+ Criar Novo Clube"
4. Enter club name and description
5. Click "CRIAR"

#### Manage Clubs
1. Click "Modo Administrativo" and login
2. Click "GERENCIAMENTO"
3. Navigate to "Clubes" tab
4. View your clubs and statistics
5. Click "ATIVAR" to set active club

#### Create Tournament in Club
1. In "Torneios" tab
2. Click "Novo Torneio"
3. Configure tournament settings
4. Tournament automatically associated with active club

### 2. Test Manager Flow

#### Create a Manager (As Owner)
Note: Manager creation is currently done through code-based approach or directly in database.

To create via database:
```sql
-- Get club_id from your club
SELECT id FROM poker_clubs WHERE owner_user_id = 'your_user_id';

-- Create manager (password 'test123' hashed with SHA-256)
INSERT INTO poker_club_managers (club_id, username, password_hash)
VALUES ('club_id', 'manager1', 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae');
```

#### Login as Manager
1. Navigate to app
2. Click "ENTRAR EM UM CLUBE"
3. Search and select your club
4. Click "Entrar como Gerente"
5. Enter manager credentials
6. Access limited management interface

### 3. Test Player Flow

#### Create Tournament and Players (As Owner/Manager)
1. Login as owner or manager
2. Create a tournament in active club
3. Register players in "Jogadores" tab
4. Note player access codes

#### Join as Player
1. Open app in new browser/incognito
2. Click "ENTRAR EM UM CLUBE"
3. Search and select club
4. Enter player access code
5. Access player dashboard

### 4. Test Club Features

#### Club Selection
- [ ] Search clubs by name
- [ ] View club list
- [ ] Select club shows club banner

#### Club Code Entry
- [ ] Banner displays correctly
- [ ] Profile photo shows
- [ ] "Entrar como Gerente" button works
- [ ] Valid code grants access
- [ ] Invalid code shows error

#### Manager Permissions
- [ ] Can create tournaments
- [ ] Can register players
- [ ] Cannot access "Clubes" tab
- [ ] Cannot modify club settings
- [ ] "Permissões Limitadas" badge shows

#### Club Management (Owner Only)
- [ ] View all clubs
- [ ] See tournament count per club
- [ ] See tables count per club
- [ ] Activate/deactivate clubs
- [ ] New tournaments auto-associate to active club

## Troubleshooting

### "Sistema não está configurado"
- Check environment variables
- Verify Supabase project is running
- Ensure SQL migrations completed

### "Código não encontrado"
- Verify player/dealer was registered
- Check code hasn't expired
- Ensure tournament is active

### Manager login fails
- Verify manager exists in database
- Check password hash is correct
- Ensure club_id matches

### Club not showing in list
- Check user_id matches owner
- Verify RLS policies applied
- Check clubs table has data

## Performance Notes

### Database Queries
- Club search uses ILIKE with limit 20
- State loads clubs from DB only when missing
- Manager sessions cached in localStorage

### Optimization Tips
1. Use database indexes (already in migration)
2. Enable query caching in Supabase
3. Consider CDN for profile photos/banners
4. Implement pagination for large club lists

## Security Checklist

Before production deployment:

- [ ] Replace SHA-256 with bcrypt/argon2
- [ ] Implement rate limiting on login
- [ ] Add CSRF protection
- [ ] Enable audit logging
- [ ] Review RLS policies
- [ ] Implement password recovery
- [ ] Add session timeout logic
- [ ] Enable 2FA for club owners
- [ ] Scan dependencies for vulnerabilities
- [ ] Configure proper CORS policies

## Known Limitations

1. **Password Security**: SHA-256 used (development only)
2. **Photo Upload**: URLs only, no actual upload implemented
3. **Manager Creation**: No UI for owner to create managers
4. **Permissions**: Manager permissions not granular
5. **Club Deletion**: Cascades to all tournaments (no confirmation UI)
6. **Search**: No pagination, limited to 20 results
7. **Banner Display**: No image validation/fallback

## Next Steps

### Immediate Improvements
1. Add manager creation UI for owners
2. Implement image upload service
3. Add confirmation dialogs for deletions
4. Implement search pagination
5. Add image validation and fallbacks

### Future Enhancements
1. Club invitations via email
2. Granular manager permissions
3. Club analytics dashboard
4. Club themes/branding
5. Multi-language support
6. Club member roles
7. Tournament templates per club
8. Club rankings and leaderboards

## Support

For issues or questions:
1. Check CLUBE_SYSTEM.md for detailed documentation
2. Review DEVELOPER_SETUP.md for development setup
3. Consult USER_GUIDE.md for user instructions
4. Check GitHub issues

## License

MIT License - See LICENSE file for details
