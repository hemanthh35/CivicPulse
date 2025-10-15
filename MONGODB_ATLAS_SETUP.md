# MongoDB Atlas Setup Guide

## 🚨 CRITICAL: Fix IP Whitelist Issue

Your app is deployed successfully but **database operations are timing out** because Render's IP addresses aren't whitelisted in MongoDB Atlas.

### Step-by-Step Fix:

### 1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com
   - Login with your credentials

### 2. **Navigate to Network Access**
   - Click on **"Network Access"** in the left sidebar (under "Security")
   - You'll see your current IP whitelist

### 3. **Add IP Address**
   - Click the **"ADD IP ADDRESS"** button (green button on the right)
   
### 4. **Allow Access from Anywhere** (Recommended for Render)
   - In the popup, click **"ALLOW ACCESS FROM ANYWHERE"**
   - This will add `0.0.0.0/0` (all IPs)
   - Add a comment: "Render deployment access"
   - Click **"Confirm"**

   **OR** (More Secure Option):
   - Add specific Render IP ranges (changes periodically)
   - Better for production: Use MongoDB Atlas's built-in "Cloud Provider" option

### 5. **Wait for Changes to Apply**
   - MongoDB Atlas takes 1-2 minutes to apply the changes
   - You'll see a "Pending" status that will change to active

### 6. **Verify in Render**
   - Go to your Render dashboard: https://dashboard.render.com
   - Click on your "civicpulse" service
   - Check the logs - you should see "Connected to MongoDB" instead of timeout errors

---

## Environment Variables Setup in Render

### Add MongoDB URI to Render:

1. **Go to Render Dashboard**
   - https://dashboard.render.com
   - Click on your **"civicpulse"** service

2. **Navigate to Environment Variables**
   - Click **"Environment"** in the left sidebar
   - Scroll to "Environment Variables"

3. **Add MONGODB_URI** (if not already added)
   - Click **"Add Environment Variable"**
   - Key: `MONGODB_URI`
   - Value: `mongodb+srv://23eg107e37_db_user:D9vvxhOO3eQSAXkv@cluster0.m5vgxsi.mongodb.net/civicpulse?retryWrites=true&w=majority&appName=Cluster0`
   - Click **"Save Changes"**

4. **Redeploy** (if needed)
   - Click **"Manual Deploy"** > **"Deploy latest commit"**

---

## Image Upload Configuration

### Current Setup ✅
- **Multer** is configured for local file uploads
- **Storage**: Files saved to `backend/uploads/` directory
- **URL Pattern**: `/uploads/filename.jpg`
- **File Limit**: 5MB per image, max 5 images per complaint
- **Allowed Types**: Only image files (image/*)

### ⚠️ IMPORTANT: Render Storage Limitation

**Render's free tier has EPHEMERAL storage:**
- Files uploaded to the server will be **deleted** when the service restarts
- Service restarts happen after 15 minutes of inactivity
- Files are NOT persistent across deployments

### Solution: Use Cloud Storage (Recommended)

#### Option 1: Cloudinary (Free Tier Available)
1. Sign up at https://cloudinary.com
2. Get your credentials:
   - Cloud Name
   - API Key
   - API Secret
3. Add to Render environment variables
4. Update code to use Cloudinary SDK

#### Option 2: AWS S3 (Free Tier - 12 months)
- 5GB storage free for first year

#### Option 3: Firebase Storage (Free Tier)
- 5GB storage, 1GB/day transfer free

---

## Testing Image Upload Locally

### Test that image upload works:

1. **Start your backend locally**:
   ```bash
   cd backend
   node server.js
   ```

2. **Start your frontend locally**:
   ```bash
   cd frontend
   npm start
   ```

3. **Register/Login and Report an Issue**:
   - Go to http://localhost:4200
   - Login or Register
   - Click "Report Issue"
   - Fill the form and **upload 1-2 images**
   - Submit

4. **Check if images are saved**:
   - Look in `backend/uploads/` folder
   - Images should be there with timestamp filenames
   - Access via: http://localhost:5000/uploads/[filename]

---

## Current Database Issues Summary

### Issue 1: IP Whitelist ❌
**Error**: `Operation 'users.findOne()' buffering timed out after 10000ms`

**Cause**: Render servers can't connect to MongoDB Atlas

**Fix**: Add `0.0.0.0/0` to MongoDB Atlas Network Access (see Step 1-5 above)

---

### Issue 2: Image Storage on Render ⚠️
**Status**: Works but files are temporary

**Limitation**: Uploaded images will be deleted after service restarts (15 min inactivity)

**Recommendation**: 
- For development/testing: Current setup is fine
- For production: Migrate to Cloudinary or S3

---

## Quick Checklist

- [ ] MongoDB Atlas: Add `0.0.0.0/0` to IP whitelist
- [ ] Render: Verify MONGODB_URI environment variable is set
- [ ] Wait 2-3 minutes for MongoDB changes to apply
- [ ] Refresh your deployed app and try registering
- [ ] Check Render logs for "Connected to MongoDB" message
- [ ] Test image upload locally first
- [ ] Consider cloud storage for production (Cloudinary recommended)

---

## Expected Results After Fix

✅ **Registration should work**
✅ **Login should work**
✅ **Database queries should complete in < 500ms**
✅ **"Connected to MongoDB" in Render logs**
✅ **Image upload works (but files are temporary on Render)**

---

## Need Help?

If you still see timeout errors after whitelisting IPs:
1. Check MongoDB Atlas cluster is running (not paused)
2. Verify connection string has correct password
3. Test connection locally first
4. Check Render logs for specific error messages
