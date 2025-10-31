# Deploy to Railway.app (Recommended for Temporary Testing)

Railway.app is perfect for temporary team testing! It handles file systems properly and is easier than Vercel.

## Why Railway.app?

✅ **File system support** - Your database works perfectly  
✅ **Free tier available** - $5 monthly free credit  
✅ **Easy deployment** - Push to GitHub or use CLI  
✅ **Temporary hosting** - Perfect for team testing  
✅ **Better error logs** - Easier debugging  
✅ **No config needed** - Auto-detects Next.js  

---

## Option 1: Deploy via Web Dashboard (Easiest) ⚡

### Step 1: Create Railway Account
1. Go to **[railway.app](https://railway.app)**
2. Sign up with GitHub (recommended)
3. Authorize Railway to access your repositories

### Step 2: Create New Project
1. Click **"Create New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: **plataforma-genera**
4. Click **"Deploy"**

Railway will automatically:
- Detect it's a Next.js app
- Build your project
- Deploy it live

### Step 3: Configure Environment Variables
1. Go to your project on Railway
2. Click **"Variables"** tab
3. Add these variables:

```
ADMIN_EMAIL=admin@genera.com
ADMIN_PASSWORD=admin123
JWT_SECRET=your-super-secret-key-here
```

4. Click **"Deploy"** to redeploy with the new variables

### Step 4: Get Your Live URL
- Go to the **"Settings"** tab
- Find **"Domains"** section
- Your app is live at the provided Railway domain! 🎉

---

## Option 2: Deploy via CLI (Fastest for Developers)

### Step 1: Login to Railway
```bash
railway login
```

This opens a browser window. Authorize and you're logged in!

### Step 2: Initialize Railway Project
```bash
railway init
```

Select:
- `y` for "Create a new project"
- Enter project name: `plataforma-genera`
- Select **"Node.js"** as the environment

### Step 3: Set Environment Variables
```bash
railway variable set ADMIN_EMAIL admin@genera.com
railway variable set ADMIN_PASSWORD admin123
railway variable set JWT_SECRET your-super-secret-key-here
```

### Step 4: Deploy
```bash
railway up
```

Done! Your app is live! 🚀

To see your deployed app:
```bash
railway open
```

---

## Option 3: Automatic Deployment (Recommended)

Railway can auto-deploy every time you push to GitHub:

1. On Railway dashboard, click **"Settings"**
2. Find **"GitHub"** section
3. Enable **"Automatic Deployments"**
4. Now every `git push` deploys automatically!

---

## Testing Your Deployment

Once deployed, test it:

1. Open your Railway app URL
2. Navigate to `/login`
3. Login with:
   - **Email**: `admin@genera.com`
   - **Password**: `admin123`
4. You should see the admin dashboard! ✅

---

## Share with Your Team

Once live, share this link with your team:

```
https://your-railway-app-url.com
```

They can:
- Test the login system
- Create new users
- Generate passwords
- See the elegant password cards
- Approve/reject users

---

## Database Persistence

Unlike Vercel's serverless, **Railway keeps your file system persistent**! 

This means:
- ✅ User data survives app restarts
- ✅ Passwords stay saved
- ✅ No need for environment variable backups
- ✅ Everything works like local development

---

## Stop/Pause Deployment

When you're done testing:

1. Go to Railway dashboard
2. Click your project
3. Click **"Settings"**
4. Click **"Delete Project"** (optional)
5. Or just leave it - the free tier covers it

---

## Common Issues

### App won't start
**Solution**: Check Railway logs
- Click your project
- Click **"Deployments"**
- Click latest deployment
- View **"Logs"** tab

### Database not persisting
**Solution**: This shouldn't happen on Railway! File system is persistent.
- Check that your app is running
- Try creating a test user and refreshing

### Environment variables not working
**Solution**: Redeploy after adding variables
- Click **"Deployments"**
- Click the three dots on latest deployment
- Click **"Redeploy"**

---

## Advanced: Custom Domain (Optional)

1. Go to Railway project **"Settings"**
2. Find **"Domains"**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `app.yourcompany.com`)
5. Follow DNS setup instructions

---

## Comparison: Hosting Options

| Feature | Railway | Vercel | Local |
|---------|---------|--------|-------|
| File System | ✅ Yes | ❌ No | ✅ Yes |
| Setup Time | 2 min | 2 min | 1 min |
| Free Tier | ✅ Yes | ✅ Yes | ✅ Yes |
| Auto-deploy | ✅ Yes | ✅ Yes | ❌ No |
| Team Testing | ✅ Perfect | ⚠️ Needs config | ❌ Local only |
| Persistent Data | ✅ Yes | ⚠️ ENV backup | ✅ Yes |
| Cost (Month) | Free $5 | Free | Free |

---

## Next Steps

1. **Deploy to Railway** using one of the 3 options above
2. **Share URL** with your team
3. **Gather feedback** on the password management UI
4. **Make improvements** locally
5. **Push to GitHub** - Railway auto-deploys!

---

## Support

- Railway Docs: https://docs.railway.app
- Railway CLI: https://docs.railway.app/cli/install
- GitHub Issues: For any project-specific issues

---

**That's it! Your team can test your app in 2 minutes!** 🚀
