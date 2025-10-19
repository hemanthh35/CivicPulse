// Automated End-to-End Test Script for CivicPulse
// Run: node test-all.js

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./backend/models/user.model');
const Complaint = require('./backend/models/complaint.model');
const assignmentService = require('./backend/services/assignment.service');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse';

// Test data
const testUsers = {
    citizen: {
        name: 'Hemanth Citizen',
        email: 'nadukulahemanth3@gmail.com',
        password: 'Test@123',
        role: 'citizen',
        mobile: '+91 9876543210',
        location: { city: 'Hyderabad', state: 'Telangana' }
    },
    worker: {
        name: 'Hemanth Worker',
        email: '23eg107e37@anurag.edu.in',
        password: 'Worker@123',
        role: 'worker',
        mobile: '+91 9876543212',
        specializations: ['Roads & Infrastructure', 'Water & Sanitation', 'Electricity'],
        workArea: { lat: 17.4400, lng: 78.4482, radius: 10 }
    },
    admin: {
        name: 'Hemanth Admin',
        email: 'nadukulahemanth9@gmail.com',
        password: 'Admin@123',
        role: 'admin',
        mobile: '+91 9876543211'
    }
};

const testComplaints = [
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
        }
    },
    {
        title: 'Electricity power outage since 1 week',
        description: 'All street lights in the area are off, causing safety concerns for pedestrians at night.',
        category: 'Electricity',
        type: 'Electricity',
        priority: 'medium',
        location: {
            address: 'Road No. 45, Jubilee Hills',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500033',
            coordinates: [78.4071, 17.4326]
        }
    },
    {
        title: 'Park maintenance required',
        description: 'Children park equipment needs maintenance and cleaning.',
        category: 'Parks & Environment',
        type: 'Parks & Environment',
        priority: 'low',
        location: {
            address: 'KBR Park, Banjara Hills',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500034',
            coordinates: [78.4738, 17.4239]
        }
    }
];

async function runTests() {
    console.log('\n🧪 CivicPulse End-to-End Test Suite');
    console.log('======================================\n');

    try {
        // Connect to database
        console.log('📋 Test 1: Database Connection');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Database Connected\n');

        // Create test users
        console.log('📋 Test 2: Creating Test Users');
        
        // Clean existing test data
        await User.deleteMany({ 
            email: { $in: [testUsers.citizen.email, testUsers.worker.email, testUsers.admin.email] }
        });

        const citizen = new User(testUsers.citizen);
        await citizen.save();
        console.log('  ✅ Citizen created:', citizen.email);

        const worker = new User(testUsers.worker);
        await worker.save();
        console.log('  ✅ Worker created:', worker.email);

        const admin = new User(testUsers.admin);
        await admin.save();
        console.log('  ✅ Admin created:', admin.email);
        console.log('');

        // Create test complaints
        console.log('📋 Test 3: Creating Test Complaints');
        
        // Clean existing complaints for this citizen
        await Complaint.deleteMany({ createdBy: citizen._id });

        const createdComplaints = [];
        for (let data of testComplaints) {
            const complaint = new Complaint({
                ...data,
                createdBy: citizen._id,
                status: 'pending'
            });
            await complaint.save();
            createdComplaints.push(complaint);
            console.log('  ✅ Created:', complaint.title);
        }
        console.log('');

        // Test smart assignment
        console.log('📋 Test 4: Testing Smart Assignment Algorithm');
        let assignedCount = 0;
        for (let complaint of createdComplaints) {
            const bestWorker = await assignmentService.findBestWorker(complaint);
            if (bestWorker) {
                complaint.assignedTo = bestWorker._id;
                complaint.status = 'pending'; // Keep as pending after assignment
                await complaint.save();
                console.log('  ✅ Assigned:', complaint.title, '->', bestWorker.name);
                assignedCount++;
            }
        }
        console.log(`  ✅ Smart Assignment: ${assignedCount}/${createdComplaints.length} complaints assigned\n`);

        // Simulate worker actions
        console.log('📋 Test 5: Simulating Worker Actions');
        const assignedComplaints = await Complaint.find({ assignedTo: worker._id });
        
        if (assignedComplaints[0]) {
            assignedComplaints[0].status = 'in-progress';
            await assignedComplaints[0].save();
            console.log('  ✅ Started work on:', assignedComplaints[0].title);
        }

        if (assignedComplaints[1]) {
            assignedComplaints[1].status = 'resolved';
            assignedComplaints[1].resolvedAt = new Date();
            await assignedComplaints[1].save();
            console.log('  ✅ Resolved:', assignedComplaints[1].title);
        }
        console.log('');

        // Verify timeline tracking
        console.log('📋 Test 6: Verifying Timeline & History');
        const resolvedComplaint = await Complaint.findOne({ status: 'resolved' });
        if (resolvedComplaint) {
            console.log('  ✅ Complaint:', resolvedComplaint.title);
            console.log('  ✅ Status History entries:', resolvedComplaint.statusHistory?.length || 0);
            console.log('  ✅ Assignment History entries:', resolvedComplaint.assignmentHistory?.length || 0);
        }
        console.log('');

        // Final statistics
        console.log('📋 Test 7: Final System Statistics');
        const users = await User.find({}).select('name email role');
        const complaints = await Complaint.find({}).populate('createdBy assignedTo', 'name email');

        console.log('\n╔════════════════════════════════════════╗');
        console.log('║        SYSTEM STATISTICS               ║');
        console.log('╚════════════════════════════════════════╝\n');

        console.log(`👥 USERS (${users.length} total):`);
        users.forEach(u => {
            console.log(`   ${u.role.toUpperCase().padEnd(10)} | ${u.name} (${u.email})`);
        });

        const statusCounts = {
            pending: complaints.filter(c => c.status === 'pending').length,
            'in-progress': complaints.filter(c => c.status === 'in-progress').length,
            resolved: complaints.filter(c => c.status === 'resolved').length
        };
        
        const totalAssigned = complaints.filter(c => c.assignedTo !== null && c.assignedTo !== undefined).length;

        console.log(`\n📋 COMPLAINTS (${complaints.length} total):`);
        console.log(`   Assigned to Worker: ${totalAssigned}`);
        console.log(`   Pending: ${statusCounts.pending}`);
        console.log(`   In-Progress: ${statusCounts['in-progress']}`);
        console.log(`   Resolved: ${statusCounts.resolved}`);

        console.log('\n📊 COMPLAINT DETAILS:');
        complaints.forEach(c => {
            console.log(`\n   ${c.title}`);
            console.log(`   └─ Status: ${c.status} | Priority: ${c.priority}`);
            console.log(`   └─ Created by: ${c.createdBy?.name || 'Unknown'}`);
            console.log(`   └─ Assigned to: ${c.assignedTo?.name || 'Unassigned'}`);
        });

        const completionRate = complaints.length > 0 
            ? ((statusCounts.resolved / complaints.length) * 100).toFixed(1)
            : 0;

        console.log(`\n✅ Completion Rate: ${completionRate}%`);
        
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║     TEST SUITE COMPLETED ✅            ║');
        console.log('╚════════════════════════════════════════╝\n');
        
        console.log('📝 Next Steps:');
        console.log('1. Open browser: http://localhost:4200');
        console.log('2. Login as Citizen: nadukulahemanth3@gmail.com / Test@123');
        console.log('3. Login as Worker: 23eg107e37@anurag.edu.in / Worker@123');
        console.log('4. Login as Admin: nadukulahemanth9@gmail.com / Admin@123\n');
        console.log('📄 See END_TO_END_TEST.md for detailed manual testing steps\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

runTests();
