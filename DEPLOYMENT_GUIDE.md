# Deployment Guide - Plataforma Géner.A

## Local Development

Your application uses a **file-based JSON database** stored in `data/auth.json`.

```bash
npm run dev
```

Everything works automatically. User data is saved to the file system.

**Default Admin Credentials:**
- Email: `admin@genera.com`
- Password: `admin123`

---

## Vercel Deployment

Your application now has **built-in Vercel compatibility** with NO external databases needed!

### How It Works on Vercel

1. **First Request**: Database starts in-memory (empty)
2. **User Logins**: Admin credentials from environment variables are used
3. **New Users**: All data is stored in memory during the current session
4. **Persistent Data** (Optional): Set `AUTH_DATABASE` environment variable

### Step 1: Deploy to Vercel

1. Push your code to GitHub (already done ✅)
2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New Project"**
4. Select your GitHub repository: `plataforma-genera`
5. Click **"Deploy"**

### Step 2: Configure Environment Variables

After deployment, set these environment variables in Vercel:

**Navigate to:** Project Settings → Environment Variables

Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `ADMIN_EMAIL` | `admin@genera.com` | ✅ Yes |
| `ADMIN_PASSWORD` | `admin123` | ✅ Yes |
| `JWT_SECRET` | `your-secure-random-string-here` | ✅ Yes |
| `AUTH_DATABASE` | (leave empty initially) | ❌ No |

**Example JWT_SECRET:** (generate a new one)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIn0SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Or use an online generator: https://www.uuidgenerator.net/

### Step 3: Redeploy

After setting environment variables:
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Select **"Redeploy"**

### Step 4: Test Login

Your app is now live! Test it:

- **URL**: Your Vercel deployment URL (e.g., `https://plataforma-genera.vercel.app`)
- **Email**: `admin@genera.com`
- **Password**: `admin123`

---

## Persistent Data on Vercel

### Option A: Session-Only (Current)
- User data exists only during the current session
- When a request ends, data is lost
- Admin login always works (from environment variables)
- Perfect for testing and development

### Option B: Persistent Data (Recommended)

To keep data between requests on Vercel, use the `AUTH_DATABASE` environment variable:

#### How to Enable Persistence:

1. **Export your database** from local development:
   ```bash
   # This will output your current database
   cat data/auth.json
   ```

2. **Convert to single-line JSON** (remove newlines):
   ```json
   {"users":[...],"passwords":[...],"generatedPasswordHistory":[...]}
   ```

3. **Add to Vercel Environment Variables**:
   - Go to Vercel Settings → Environment Variables
   - Add variable: `AUTH_DATABASE`
   - Paste your JSON string as the value
   - Redeploy

Now your database will **persist across all requests** on Vercel!

#### Backup Database:
After making changes on Vercel, you can export it:
```bash
# In Vercel logs or from a helper endpoint, you can see the exported database
# Manually copy the AUTH_DATABASE value to backup
```

---

## Comparison

| Feature | Local | Vercel (Session) | Vercel (Persistent) |
|---------|-------|------------------|---------------------|
| File-based DB | ✅ Yes | ❌ No | ❌ No |
| In-memory DB | ✅ Yes | ✅ Yes | ✅ Yes |
| Persistence | ✅ Always | ❌ No | ✅ Via ENV |
| Setup Time | 1 min | 5 min | 10 min |
| Cost | Free | Free | Free |
| External Service | ❌ No | ❌ No | ❌ No |

---

## Troubleshooting

### "Invalid credentials" on Vercel
**Solution**: Check that `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in Vercel environment variables.

### Data disappears after restart
**Solution**: This is normal for session-only mode. Set `AUTH_DATABASE` environment variable for persistence.

### Can't see generated passwords on Vercel
**Solution**: Ensure you're accessing the correct Vercel URL and that the app is redeployed after env var changes.

---

## Best Practices

1. ✅ **Change default credentials** for production
2. ✅ **Use strong JWT_SECRET** (32+ characters)
3. ✅ **Backup AUTH_DATABASE** regularly
4. ✅ **Monitor user registrations** in the admin panel
5. ✅ **Test locally first** before deploying changes

---

## Security Notes

- All user passwords are hashed with bcrypt
- JWT tokens expire after 24 hours
- Admin panel is protected with authentication
- No sensitive data in environment variables (except when using AUTH_DATABASE)

---

## Support

For issues or questions:
1. Check your Vercel deployment logs
2. Verify environment variables are set correctly
3. Test locally to isolate issues
4. Review the code in `lib/auth-db.ts` for database logic

---

**Your database is fully under your control - no external services needed!** 🎉
