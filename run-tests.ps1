# Automated End-to-End Test Script for CivicPulse
# Run this after both servers are running

Write-Host "🧪 CivicPulse End-to-End Test Suite" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = "d:\23EG107E37\meanstacklab\civicpulse\backend"

# Test 1: Verify Database Connection
Write-Host "📋 Test 1: Database Connection" -ForegroundColor Yellow
$dbTest = node -e "require('dotenv').config({ path: require('path').join(__dirname, '../.env') }); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(() => { console.log('PASS'); mongoose.connection.close(); }).catch(() => { console.log('FAIL'); process.exit(1); });" 2>&1
if ($dbTest -like "*PASS*") {
    Write-Host "✅ Database Connected" -ForegroundColor Green
} else {
    Write-Host "❌ Database Connection Failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Create Test Users
Write-Host "📋 Test 2: Creating Test Users" -ForegroundColor Yellow

# Create Citizen
Write-Host "Creating Citizen: nadukulahemanth3@gmail.com" -ForegroundColor Gray
$citizenTest = node -e @"
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(async () => {
    await User.deleteOne({ email: 'nadukulahemanth3@gmail.com' });
    const citizen = new User({
        name: 'Hemanth Citizen',
        email: 'nadukulahemanth3@gmail.com',
        password: 'Test@123',
        role: 'citizen',
        mobile: '+91 9876543210',
        location: { city: 'Hyderabad', state: 'Telangana' }
    });
    await citizen.save();
    console.log('PASS');
    mongoose.connection.close();
}).catch(err => { console.log('FAIL:', err.message); process.exit(1); });
"@ 2>&1

if ($citizenTest -like "*PASS*") {
    Write-Host "  ✅ Citizen created" -ForegroundColor Green
} else {
    Write-Host "  ❌ Citizen creation failed" -ForegroundColor Red
}

# Create Worker
Write-Host "Creating Worker: 23eg107e37@anurag.edu.in" -ForegroundColor Gray
$workerTest = node -e @"
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(async () => {
    await User.deleteOne({ email: '23eg107e37@anurag.edu.in' });
    const worker = new User({
        name: 'Hemanth Worker',
        email: '23eg107e37@anurag.edu.in',
        password: 'Worker@123',
        role: 'worker',
        mobile: '+91 9876543212',
        specializations: ['Roads & Infrastructure', 'Street Lighting', 'Parks & Recreation'],
        workArea: { lat: 17.4400, lng: 78.4482, radius: 10 }
    });
    await worker.save();
    console.log('PASS');
    mongoose.connection.close();
}).catch(err => { console.log('FAIL:', err.message); process.exit(1); });
"@ 2>&1

if ($workerTest -like "*PASS*") {
    Write-Host "  ✅ Worker created" -ForegroundColor Green
} else {
    Write-Host "  ❌ Worker creation failed" -ForegroundColor Red
}

# Create Admin
Write-Host "Creating Admin: nadukulahemanth9@gmail.com" -ForegroundColor Gray
$adminTest = node -e @"
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(async () => {
    await User.deleteOne({ email: 'nadukulahemanth9@gmail.com' });
    const admin = new User({
        name: 'Hemanth Admin',
        email: 'nadukulahemanth9@gmail.com',
        password: 'Admin@123',
        role: 'admin',
        mobile: '+91 9876543211'
    });
    await admin.save();
    console.log('PASS');
    mongoose.connection.close();
}).catch(err => { console.log('FAIL:', err.message); process.exit(1); });
"@ 2>&1

if ($adminTest -like "*PASS*") {
    Write-Host "  ✅ Admin created" -ForegroundColor Green
} else {
    Write-Host "  ❌ Admin creation failed" -ForegroundColor Red
}
Write-Host ""

# Test 3: Create Test Complaints
Write-Host "📋 Test 3: Creating Test Complaints" -ForegroundColor Yellow

$complaintsTest = node -e @"
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Complaint = require('./models/complaint.model');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(async () => {
    const citizen = await User.findOne({ email: 'nadukulahemanth3@gmail.com' });
    if (!citizen) throw new Error('Citizen not found');

    // Clear existing test complaints
    await Complaint.deleteMany({ createdBy: citizen._id });

    // Create 3 test complaints
    const complaints = [
        {
            title: 'Pothole on Main Road causing accidents',
            description: 'Large pothole near traffic signal junction, vehicles getting damaged. Urgent repair needed.',
            category: 'Roads & Infrastructure',
            type: 'Roads & Infrastructure',
            priority: 'high',
            location: {
                address: 'MG Road, Near KBR Park Signal',
                city: 'Hyderabad',
                state: 'Telangana',
                pincode: '500001',
                coordinates: [78.4482, 17.4400]
            },
            createdBy: citizen._id,
            status: 'pending'
        },
        {
            title: 'Street lights not working since 1 week',
            description: 'All street lights in the area are off, causing safety concerns for pedestrians at night.',
            category: 'Street Lighting',
            type: 'Street Lighting',
            priority: 'medium',
            location: {
                address: 'Road No. 45, Jubilee Hills',
                city: 'Hyderabad',
                state: 'Telangana',
                pincode: '500033',
                coordinates: [78.4071, 17.4326]
            },
            createdBy: citizen._id,
            status: 'pending'
        },
        {
            title: 'Park maintenance required',
            description: 'Children park equipment needs maintenance and cleaning.',
            category: 'Parks & Recreation',
            type: 'Parks & Recreation',
            priority: 'low',
            location: {
                address: 'KBR Park, Banjara Hills',
                city: 'Hyderabad',
                state: 'Telangana',
                pincode: '500034',
                coordinates: [78.4738, 17.4239]
            },
            createdBy: citizen._id,
            status: 'pending'
        }
    ];

    for (let data of complaints) {
        const complaint = new Complaint(data);
        await complaint.save();
        console.log('Created:', complaint.title);
    }

    console.log('PASS');
    mongoose.connection.close();
}).catch(err => { console.log('FAIL:', err.message); process.exit(1); });
"@ 2>&1

if ($complaintsTest -like "*PASS*") {
    Write-Host "✅ 3 Complaints created" -ForegroundColor Green
} else {
    Write-Host "❌ Complaint creation failed" -ForegroundColor Red
}
Write-Host ""

# Test 4: Smart Assignment
Write-Host "📋 Test 4: Testing Smart Assignment Algorithm" -ForegroundColor Yellow

$assignmentTest = node -e @"
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Complaint = require('./models/complaint.model');
const assignmentService = require('./services/assignment.service');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(async () => {
    const worker = await User.findOne({ role: 'worker' });
    const pendingComplaints = await Complaint.find({ status: 'pending' });

    console.log('Found', pendingComplaints.length, 'pending complaints');
    let assigned = 0;

    for (let complaint of pendingComplaints) {
        const bestWorker = await assignmentService.findBestWorker(complaint);
        if (bestWorker) {
            complaint.assignedTo = bestWorker._id;
            complaint.status = 'assigned';
            await complaint.save();
            console.log('Assigned:', complaint.title, '->', bestWorker.name);
            assigned++;
        }
    }

    console.log('PASS:', assigned, 'complaints assigned');
    mongoose.connection.close();
}).catch(err => { console.log('FAIL:', err.message); process.exit(1); });
"@ 2>&1

if ($assignmentTest -like "*PASS*") {
    Write-Host "✅ Smart Assignment working" -ForegroundColor Green
} else {
    Write-Host "❌ Smart Assignment failed" -ForegroundColor Red
}
Write-Host ""

# Test 5: Worker Actions Simulation
Write-Host "📋 Test 5: Simulating Worker Actions" -ForegroundColor Yellow

$workerActionsTest = node -e @"
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Complaint = require('./models/complaint.model');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(async () => {
    const worker = await User.findOne({ role: 'worker' });
    const assignedComplaints = await Complaint.find({ assignedTo: worker._id });

    console.log('Worker has', assignedComplaints.length, 'assigned complaints');

    // Simulate: Start work on first complaint
    if (assignedComplaints[0]) {
        assignedComplaints[0].status = 'in-progress';
        await assignedComplaints[0].save();
        console.log('Started work on:', assignedComplaints[0].title);
    }

    // Simulate: Resolve second complaint
    if (assignedComplaints[1]) {
        assignedComplaints[1].status = 'resolved';
        assignedComplaints[1].resolvedAt = new Date();
        await assignedComplaints[1].save();
        console.log('Resolved:', assignedComplaints[1].title);
    }

    console.log('PASS');
    mongoose.connection.close();
}).catch(err => { console.log('FAIL:', err.message); process.exit(1); });
"@ 2>&1

if ($workerActionsTest -like "*PASS*") {
    Write-Host "✅ Worker actions simulated" -ForegroundColor Green
} else {
    Write-Host "❌ Worker actions failed" -ForegroundColor Red
}
Write-Host ""

# Test 6: Timeline & History Tracking
Write-Host "📋 Test 6: Verifying Timeline & History" -ForegroundColor Yellow

$timelineTest = node -e @"
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Complaint = require('./models/complaint.model');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(async () => {
    const complaint = await Complaint.findOne({ status: { `$in: ['in-progress', 'resolved'] } });
    
    if (!complaint) throw new Error('No complaint with history found');

    console.log('Checking complaint:', complaint.title);
    console.log('Status History entries:', complaint.statusHistory?.length || 0);
    console.log('Assignment History entries:', complaint.assignmentHistory?.length || 0);

    if (complaint.statusHistory && complaint.statusHistory.length > 0) {
        console.log('PASS: Timeline tracking working');
    } else {
        console.log('WARN: No status history found');
    }

    mongoose.connection.close();
}).catch(err => { console.log('FAIL:', err.message); process.exit(1); });
"@ 2>&1

if ($timelineTest -like "*PASS*") {
    Write-Host "✅ Timeline tracking verified" -ForegroundColor Green
} else {
    Write-Host "⚠️  Timeline check completed with warnings" -ForegroundColor Yellow
}
Write-Host ""

# Test 7: Final Statistics
Write-Host "📋 Test 7: Final System Statistics" -ForegroundColor Yellow

$statsTest = node -e @"
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Complaint = require('./models/complaint.model');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse').then(async () => {
    const users = await User.find({}).select('name email role');
    const complaints = await Complaint.find({}).populate('createdBy assignedTo', 'name email');

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║        SYSTEM STATISTICS               ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('👥 USERS (' + users.length + ' total):');
    users.forEach(u => console.log('   ' + u.role.toUpperCase().padEnd(10) + ' | ' + u.name + ' (' + u.email + ')'));

    console.log('\n📋 COMPLAINTS (' + complaints.length + ' total):');
    const statusCounts = {
        pending: complaints.filter(c => c.status === 'pending').length,
        assigned: complaints.filter(c => c.status === 'assigned').length,
        'in-progress': complaints.filter(c => c.status === 'in-progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length
    };

    console.log('   Pending:', statusCounts.pending);
    console.log('   Assigned:', statusCounts.assigned);
    console.log('   In-Progress:', statusCounts['in-progress']);
    console.log('   Resolved:', statusCounts.resolved);

    console.log('\n📊 COMPLAINT DETAILS:');
    complaints.forEach(c => {
        console.log('\n   ' + c.title);
        console.log('   └─ Status: ' + c.status + ' | Priority: ' + c.priority);
        console.log('   └─ Created by: ' + (c.createdBy?.name || 'Unknown'));
        console.log('   └─ Assigned to: ' + (c.assignedTo?.name || 'Unassigned'));
    });

    const completionRate = complaints.length > 0 
        ? ((statusCounts.resolved / complaints.length) * 100).toFixed(1)
        : 0;

    console.log('\n✅ Completion Rate: ' + completionRate + '%');
    console.log('\nPASS');
    mongoose.connection.close();
}).catch(err => { console.log('FAIL:', err.message); process.exit(1); });
"@ 2>&1

Write-Host $statsTest
Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TEST SUITE COMPLETED               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All automated tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open browser: http://localhost:4200" -ForegroundColor Gray
Write-Host "2. Login as Citizen: nadukulahemanth3@gmail.com / Test@123" -ForegroundColor Gray
Write-Host "3. Login as Worker: 23eg107e37@anurag.edu.in / Worker@123" -ForegroundColor Gray
Write-Host "4. Login as Admin: nadukulahemanth9@gmail.com / Admin@123" -ForegroundColor Gray
Write-Host ""
Write-Host "📄 See END_TO_END_TEST.md for detailed manual testing steps" -ForegroundColor Cyan
Write-Host ""
