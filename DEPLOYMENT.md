# Deploying CivicPulse to Render

This guide will help you deploy the CivicPulse application to Render.com (free tier available).

## 📋 Prerequisites

- GitHub account with CivicPulse repository
- Render account (sign up at https://render.com)
- MongoDB Atlas account (for cloud database) - https://www.mongodb.com/cloud/atlas

---

## 🗄️ Step 1: Set Up MongoDB Atlas (Cloud Database)

### 1.1 Create MongoDB Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Click **"Build a Database"**
4. Choose **FREE** (M0 Sandbox tier)
5. Select your preferred cloud provider and region
6. Click **"Create"**

### 1.2 Create Database User
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Username: `civicpulse_user` (or your choice)
5. Password: Generate a secure password (save it!)
6. User Privileges: **Read and write to any database**
7. Click **"Add User"**

### 1.3 Whitelist IP Addresses
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### 1.4 Get Connection String
1. Go to **Database** → **Connect**
2. Choose **"Connect your application"**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://civicpulse_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name after `.net/`: `civicpulse`
   
   Final format:
   ```
   mongodb+srv://civicpulse_user:YourPassword@cluster0.xxxxx.mongodb.net/civicpulse?retryWrites=true&w=majority
   ```

---

## 🚀 Step 2: Deploy Backend to Render

### 2.1 Create Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select **"hemanthh35/CivicPulse"** repository
5. Click **"Connect"**

### 2.2 Configure Backend Service
Fill in the following:

- **Name:** `civicpulse-backend`
- **Region:** Choose closest to you (e.g., Oregon)
- **Branch:** `main`
- **Root Directory:** leave blank
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** `Free`

### 2.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1.4 |
| `JWT_SECRET` | Generate a random string (use: https://randomkeygen.com/) |
| `FRONTEND_URL` | (Leave blank for now, we'll update after frontend is deployed) |

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, note your backend URL: `https://civicpulse-backend.onrender.com`
4. Test health endpoint: `https://civicpulse-backend.onrender.com/api/test`

---

## 🎨 Step 3: Deploy Frontend to Render

### 3.1 Update Frontend Environment
Before deploying, update the backend API URL in your frontend:

1. Edit `frontend/src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://civicpulse-backend.onrender.com/api'
   };
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "Update production API URL"
   git push origin main
   ```

### 3.2 Create Static Site
1. Go to Render Dashboard
2. Click **"New +"** → **"Static Site"**
3. Select **"hemanthh35/CivicPulse"** repository
4. Click **"Connect"**

### 3.3 Configure Frontend Service
- **Name:** `civicpulse-frontend`
- **Branch:** `main`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist/civicpulse-frontend`

### 3.4 Deploy
1. Click **"Create Static Site"**
2. Wait for deployment (5-10 minutes)
3. Note your frontend URL: `https://civicpulse-frontend.onrender.com`

---

## 🔄 Step 4: Update CORS and Environment Variables

### 4.1 Update Backend FRONTEND_URL
1. Go to your backend service in Render
2. Go to **Environment** tab
3. Update `FRONTEND_URL` to: `https://civicpulse-frontend.onrender.com`
4. Click **"Save Changes"**
5. Service will auto-redeploy

### 4.2 Update Backend CORS (if needed)
If you haven't already, ensure your `backend/server.js` allows your frontend domain:

```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Test Backend
Visit: `https://civicpulse-backend.onrender.com/api/test`

Expected response:
```json
{
  "success": true,
  "message": "Backend is working!"
}
```

### 5.2 Test Frontend
1. Visit: `https://civicpulse-frontend.onrender.com`
2. Try registering a new user
3. Test reporting an issue
4. Check the About page

---

## 🎯 Alternative: Deploy Both as Single Service (Simpler)

If you prefer a single deployment:

### Option A: Serve Frontend from Backend

1. Build the frontend locally:
   ```bash
   cd frontend
   npm run build
   ```

2. The build output will be in `frontend/dist/civicpulse-frontend`

3. Your backend already serves static files in production (see `backend/server.js`)

4. Deploy only the backend to Render:
   - **Build Command:** `npm install && cd frontend && npm install && npm run build && cd ..`
   - **Start Command:** `npm start`
   - Set `NODE_ENV=production`

5. Access everything at: `https://civicpulse-backend.onrender.com`

---

## 📝 Important Notes

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours/month limit per service

### Custom Domain (Optional)
1. Go to your service → **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS records as instructed

### Environment Variables
Never commit `.env` files! Always set them in Render dashboard.

### Auto-Deploy
Render automatically deploys when you push to `main` branch.

---

## 🆘 Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify `MONGODB_URI` is correct
- Ensure `package.json` has correct start script

### Frontend shows API errors
- Verify `environment.ts` has correct backend URL
- Check CORS settings in backend
- Verify backend is running

### Database connection fails
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has correct permissions

### Build fails
- Check Node version compatibility
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Render Docs:** https://render.com/docs
- **Your Repository:** https://github.com/hemanthh35/CivicPulse

---

## 🎉 You're Done!

Your CivicPulse application is now live and accessible worldwide!

**Backend:** `https://civicpulse-backend.onrender.com`  
**Frontend:** `https://civicpulse-frontend.onrender.com`

Share the link and start making a difference in your community! 🌟
