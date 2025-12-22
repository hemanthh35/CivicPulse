require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI environment variable is not set!');
    process.exit(1);
}

// Users to create
const users = [
    {
        name: 'Hemanth Admin',
        email: 'nadukulahemanth3@gmail.com',
        password: '123456',
        role: 'admin',
        mobile: '9999999999'
    },
    {
        name: 'Student User',
        email: '23eg107e37@anurag.edu.in',
        password: '123456',
        role: 'citizen',
        mobile: '8888888888'
    },
    {
        name: 'Ram Worker',
        email: 'ram@gmail.com',
        password: '123456',
        role: 'worker',
        mobile: '7777777777',
        specializations: ['Roads & Infrastructure', 'Water & Sanitation', 'Garbage & Waste']
    },
    {
        name: 'Hemanth Worker',
        email: 'nadukulahemanth5@gmail.com',
        password: '123456',
        role: 'worker',
        mobile: '6666666666',
        specializations: ['Electricity', 'Public Safety', 'Parks & Environment']
    }
];

async function seedUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Delete all existing users
        const deleteResult = await User.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing users`);

        // Create new users
        console.log('\n📝 Creating new users...\n');

        for (const userData of users) {
            const user = new User(userData);
            await user.save();
            console.log(`✅ Created ${userData.role}: ${userData.email}`);
        }

        console.log('\n========================================');
        console.log('✅ All users created successfully!');
        console.log('========================================\n');
        console.log('Login Credentials (Password: 123456 for all):');
        console.log('');
        console.log('👑 ADMIN:   nadukulahemanth3@gmail.com');
        console.log('👤 CITIZEN: 23eg107e37@anurag.edu.in');
        console.log('🔧 WORKER:  ram@gmail.com');
        console.log('🔧 WORKER:  nadukulahemanth5@gmail.com');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
        process.exit(1);
    }
}

seedUsers();
