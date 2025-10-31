# Quick Start Guide - Plataforma Géner.A

## 🚀 Choose Your Deployment

### For Local Development (Fastest)
```bash
cd C:\Users\badth\Desktop\genera-platform
npm run dev
```
**URL**: `http://localhost:3000`

---

### For Team Testing (Recommended) ⭐
Use **Railway.app** - Full file system support, persistent data, free tier

**Steps:**
1. Go to https://railway.app
2. Sign in with GitHub
3. Deploy `plataforma-genera` repo
4. Add environment variables (ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET)
5. Done! Share URL with team

**See**: `RAILWAY_DEPLOYMENT.md` for detailed guide

---

### For Production (Advanced)
Use **Vercel** with environment variable setup (or Railway for easier file system)

**See**: `DEPLOYMENT_GUIDE.md` for detailed guide

---

## 📋 Default Credentials

All environments use these default admin credentials:
- **Email**: `admin@genera.com`
- **Password**: `admin123`

⚠️ **Change these for production!**

---

## 🔑 Environment Variables Needed

For Vercel or Railway:
```
ADMIN_EMAIL=admin@genera.com
ADMIN_PASSWORD=admin123
JWT_SECRET=your-strong-random-string-here
```

Optional:
```
AUTH_DATABASE={"users":[...]...}  # For Vercel persistence
```

---

## ✨ Key Features

✅ **Elegant password management cards**
✅ **User registration & approval system**
✅ **Password generation & tracking**
✅ **Admin dashboard**
✅ **Security monitoring**
✅ **File-based database (local) or in-memory (cloud)**

---

## 📱 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: JSON file (local) or in-memory (cloud)
- **Authentication**: JWT tokens, bcrypt hashing
- **UI Components**: shadcn/ui

---

## 🎯 Common Tasks

### Generate a Password
1. Login as admin
2. Go to "Gestión de Usuarios"
3. Find approved user
4. Click "Generar Contraseña"

### Manage Passwords
1. Go to "Contraseñas" tab
2. See elegant password cards
3. Copy, show/hide, or regenerate passwords

### Approve New Users
1. Login as admin
2. Go to "Gestión de Usuarios"
3. Review pending users
4. Click "Aprobar"

---

## 📚 Documentation

- **Local Dev**: See this file
- **Vercel Deploy**: See `DEPLOYMENT_GUIDE.md`
- **Railway Deploy**: See `RAILWAY_DEPLOYMENT.md`
- **Security Features**: See `SECURITY_FEATURES.md`

---

## 🆘 Troubleshooting

### "Cannot find module" error
```bash
npm install
npm run dev
```

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Database not loading
- Check `data/auth.json` exists
- Or check Vercel/Railway logs

### Login not working
- Use correct credentials: `admin@genera.com` / `admin123`
- Check environment variables on Vercel/Railway
- Try refreshing browser

---

## 🚦 Deployment Comparison

| Aspect | Local | Railway ⭐ | Vercel |
|--------|-------|-----------|--------|
| Setup Time | 1 min | 2 min | 2 min |
| File System | ✅ | ✅ | ❌ |
| Team Access | ❌ | ✅ | ✅ |
| Data Persistence | ✅ | ✅ | ⚠️ |
| Free Tier | ✅ | ✅ | ✅ |
| Cost | Free | Free | Free |
| Best For | Development | Testing | Production |

---

## 🎓 Next Steps

1. **For testing with team**: Deploy to Railway (2 minutes)
2. **For feedback**: Share Railway URL with team
3. **For improvements**: Make changes locally, push to GitHub
4. **For production**: Use Vercel or Railway (permanent)

---

## 📞 Support

- Check the relevant deployment guide
- Review error logs on hosting platform
- Check `console.log` output in browser dev tools (F12)
- Review server logs on Railway/Vercel dashboard

---

**Ready? Start with Railway for instant team testing!** 🚀
