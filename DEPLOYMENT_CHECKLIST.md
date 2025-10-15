# 🚀 Quick Render Deployment Checklist

## Before You Start
- [ ] GitHub repository is up to date
- [ ] Code is tested locally and working
- [ ] MongoDB Atlas account created

---

## 🗄️ MongoDB Atlas Setup (5 minutes)
- [ ] Create free cluster at https://www.mongodb.com/cloud/atlas
- [ ] Create database user with password
- [ ] Whitelist all IPs (0.0.0.0/0)
- [ ] Copy connection string
- [ ] Replace `<password>` with actual password
- [ ] Add database name: `/civicpulse`
- [ ] Save connection string for later

**Example:**
```
mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/civicpulse?retryWrites=true&w=majority
```

---

## 🌐 Render Backend Deployment (10 minutes)

### 1. Create Web Service
- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub → Select "hemanthh35/CivicPulse"

### 2. Configure Service
```
Name:           civicpulse-backend
Region:         Oregon (or closest to you)
Branch:         main
Runtime:        Node
Build Command:  npm install
Start Command:  npm start
Plan:           Free
```

### 3. Add Environment Variables
```
NODE_ENV     = production
PORT         = 5000
MONGODB_URI  = [Your MongoDB Atlas connection string]
JWT_SECRET   = [Random string from randomkeygen.com]
FRONTEND_URL = [Leave blank for now]
```

### 4. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Copy backend URL: `https://civicpulse-backend.onrender.com`
- [ ] Test: Visit `https://civicpulse-backend.onrender.com/api/test`

---

## 🎨 Render Frontend Deployment (10 minutes)

### 1. Update Environment File Locally
- [ ] Edit `frontend/src/environments/environment.ts`
- [ ] Change `apiUrl` to your backend URL + `/api`
- [ ] Commit and push to GitHub

**Example:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://civicpulse-backend.onrender.com/api'
};
```

### 2. Create Static Site
- [ ] Go to Render Dashboard
- [ ] Click "New +" → "Static Site"
- [ ] Select "hemanthh35/CivicPulse"

### 3. Configure Static Site
```
Name:             civicpulse-frontend
Branch:           main
Root Directory:   frontend
Build Command:    npm install && npm run build
Publish Directory: dist/civicpulse-frontend
```

### 4. Deploy
- [ ] Click "Create Static Site"
- [ ] Wait for deployment
- [ ] Copy frontend URL: `https://civicpulse-frontend.onrender.com`

---

## 🔄 Final Configuration (2 minutes)

### Update Backend CORS
- [ ] Go to backend service in Render
- [ ] Environment tab
- [ ] Edit `FRONTEND_URL` → Add your frontend URL
- [ ] Save (will trigger redeploy)

---

## ✅ Testing (5 minutes)

### Backend
- [ ] Visit: `https://civicpulse-backend.onrender.com/api/test`
- [ ] Should return: `{"success": true, "message": "Backend is working!"}`

### Frontend
- [ ] Visit: `https://civicpulse-frontend.onrender.com`
- [ ] Home page loads
- [ ] About page works
- [ ] Can register a user
- [ ] Can login
- [ ] Can report an issue

---

## 🎯 Alternative: Single Service Deployment (Simpler!)

### If you want everything on one URL:

**Build Command:**
```bash
npm install && cd frontend && npm install && npm run build && cd ..
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
```
NODE_ENV    = production
PORT        = 5000
MONGODB_URI = [Your MongoDB connection string]
JWT_SECRET  = [Random secure string]
```

**Result:** Everything runs at `https://civicpulse-backend.onrender.com`

---

## 📝 Notes

### Free Tier Info
- ⏰ Service spins down after 15 min inactivity
- 🐌 First request after spin-down takes ~30-60 seconds
- 💰 750 hours/month free per service

### Auto-Deploy
- ✅ Pushes to `main` branch auto-deploy
- 🔄 Takes 5-10 minutes per deployment
- 📊 Check logs in Render dashboard

### Troubleshooting
- 🔍 Check Render logs for errors
- 🔗 Verify all URLs are correct
- 🔑 Ensure environment variables are set
- 📊 Test MongoDB connection string

---

## ✨ Your Live URLs

After deployment, you'll have:

**Backend API:**  
`https://civicpulse-backend.onrender.com`

**Frontend App:**  
`https://civicpulse-frontend.onrender.com`

**Health Check:**  
`https://civicpulse-backend.onrender.com/api/test`

---

## 🎉 Done!

Your CivicPulse app is now live on the internet!

**Next Steps:**
- Share the link with users
- Add custom domain (optional)
- Monitor logs for issues
- Scale to paid plan if needed

Need help? Check `DEPLOYMENT.md` for detailed guide.
