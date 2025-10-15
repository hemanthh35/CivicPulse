# CivicPulse 🏙️

A modern MEAN stack application for civic issue reporting and management. Empowering communities through technology by connecting citizens with their local government to create cleaner, safer, and better neighborhoods.

## 🚀 Features

### 1. **Authentication & User Management**
   - JWT-based secure authentication
   - **4 User Roles:**
     - **Citizens:** Report issues and track progress
     - **Students:** Report issues, earn rewards, compete on leaderboards
     - **Workers:** Manage assigned tasks and resolve issues
     - **Admins:** Oversee platform operations and moderation
   - Profile management with role-based access control

### 2. **Smart Issue Reporting**
   - Photo/video upload with issue reports
   - Auto-detect GPS location
   - Categorized issue types
   - Real-time status tracking (Pending → In Progress → Resolved)

### 3. **Student Engagement & Gamification**
   - Travel mode for remote reporting
   - Verification queue system
   - Points and rewards system
   - Competitive leaderboard
   - Achievement badges

### 4. **Municipal Worker Panel**
   - View and manage assigned complaints
   - Update issue status in real-time
   - Upload resolution proof photos
   - Efficient task management

### 5. **Admin Dashboard**
   - Google Maps integration for geographic visualization
   - Advanced filtering and search
   - Assign complaints to workers
   - Content moderation panel
   - Analytics and reporting

## 🛠️ Tech Stack

- **MongoDB** - NoSQL database
- **Express.js** - Backend framework
- **Angular 16** - Frontend framework
- **Node.js** - Runtime environment
- **JWT** - Authentication
- **Multer** - File upload handling
- **Bootstrap 5** - UI styling

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/hemanthh35/CivicPulse.git
cd CivicPulse
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Configure environment variables
Copy the example environment file and update with your values:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/civicpulse

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (Generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:4200
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 6. Run the application

**Option A: Run both servers separately**
```bash
# Terminal 1 - Backend
npm start
# or for development with auto-reload
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**Option B: Quick start** (if you have nodemon installed)
```bash
npm run dev
```

### 7. Access the application
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/test

## 📁 Project Structure

```
CivicPulse/
├── backend/
│   ├── controllers/          # Request handlers
│   ├── models/              # MongoDB schemas
│   │   ├── user.model.js
│   │   ├── complaint.model.js
│   │   ├── reward.model.js
│   │   └── moderation.model.js
│   ├── middlewares/         # Auth & validation
│   │   └── auth.middleware.js
│   ├── routes/              # API routes
│   │   ├── auth.routes.js
│   │   ├── complaints.routes.js
│   │   ├── rewards.routes.js
│   │   └── moderation.routes.js
│   ├── uploads/             # User uploaded files
│   └── server.js            # Entry point
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Angular components
│   │   │   ├── services/    # API services
│   │   │   ├── guards/      # Route guards
│   │   │   ├── interceptors/ # HTTP interceptors
│   │   │   └── models/      # TypeScript interfaces
│   │   ├── assets/          # Static assets
│   │   └── environments/    # Environment configs
│   ├── angular.json
│   └── package.json
├── .env.example             # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🎯 Usage

### For Citizens/Students:
1. Register/Login to your account
2. Navigate to "Report Issue"
3. Upload photo, add location, and describe the issue
4. Track your report status in "My Issues"
5. (Students) Earn points and check the leaderboard

### For Workers:
1. Login with worker credentials
2. View assigned complaints
3. Update status as you work on issues
4. Upload proof when resolved

### For Admins:
1. Access admin dashboard
2. Moderate new reports
3. Assign complaints to workers
4. View analytics and statistics

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- HTTP-only cookies option
- Input validation and sanitization
- CORS protection
- Environment variable protection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- **Hemanth** - [hemanthh35](https://github.com/hemanthh35)

## 🙏 Acknowledgments

- Built as part of MEAN Stack Lab coursework
- Inspired by civic engagement platforms
- Thanks to all contributors

## 📧 Support

For support, email [your-email@example.com] or open an issue in the repository.

---

**Made with ❤️ for communities**

