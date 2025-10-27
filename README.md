# CivicPulse - Community Complaint Management System

A modern web application for citizens to report civic issues and for municipal workers to resolve them efficiently.

## 🚀 Features

- **Citizen Portal**: Report issues with photos, location, and description
- **Worker Dashboard**: View assigned complaints and update status
- **Admin Panel**: Manage users, complaints, and system settings
- **Real-time Updates**: Get notifications on complaint status changes
- **Leaderboard**: Recognition for active citizens and workers
- **Rewards System**: Badges and points for community engagement
- **AI-Powered**: Gemini AI for auto-filling complaint details from images

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Gmail account for email notifications (or other SMTP service)
- Google Gemini API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hemanthh35/CivicPulse.git
   cd CivicPulse
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your actual credentials (see Configuration section below)

5. **Run the application**
   ```bash
   # Start backend (from root)
   npm start

   # Start frontend (in another terminal)
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5000

## ⚙️ Configuration

Create a `.env` file in the root directory with the following:

```env
NODE_ENV=production
PORT=5000

# MongoDB Connection
MONGODB_URI=your-mongodb-connection-string

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRE=7d

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=CivicPulse <your-email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:4200

# Gemini AI (optional)
GEMINI_API_KEY=your-gemini-api-key
```

### Getting API Keys

**MongoDB Atlas:**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string from "Connect" button

**Gmail App Password:**
1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → 2-Step Verification → App Passwords
3. Generate app password for "Mail"

**Gemini API:**
1. Visit https://ai.google.dev/
2. Get API key from Google AI Studio

## 🔒 Security Notes

- ⚠️ **Never commit `.env` file to Git**
- ⚠️ **Never share your API keys or passwords**
- ⚠️ **Use strong, unique passwords in production**
- ⚠️ **Keep dependencies updated** (`npm audit fix`)

## 📁 Project Structure

```
CivicPulse/
├── backend/
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── middlewares/   # Auth & validation
│   └── server.js      # Express app
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── components/  # Angular components
│       │   ├── services/    # HTTP services
│       │   └── guards/      # Route guards
│       └── environments/    # Environment configs
└── .env.example       # Environment template
```

## 👥 User Roles

- **Citizen**: Report complaints, track status, earn rewards
- **Student**: Same as citizen + leaderboard ranking
- **Worker**: View and resolve assigned complaints
- **Admin**: Full system access and management

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (Email)
- Multer (File uploads)

**Frontend:**
- Angular 17+
- Bootstrap 5
- Chart.js (Analytics)
- Leaflet (Maps)

## 📝 License

MIT License - feel free to use for educational purposes

## 👨‍💻 Author

Developed as part of academic project
