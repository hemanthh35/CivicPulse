// Script to add coordinates to existing complaints
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Complaint = require('./models/complaint.model.js');

// Hyderabad area coordinates for different zones
const hyderabadZones = [
  { area: 'Hitech City', lat: 17.3610, lng: 78.4103 },
  { area: 'HITEC', lat: 17.3610, lng: 78.4103 },
  { area: 'Gachibowli', lat: 17.4409, lng: 78.4402 },
  { area: 'Madhapur', lat: 17.3629, lng: 78.4186 },
  { area: 'Kondapur', lat: 17.3947, lng: 78.3882 },
  { area: 'Jubilee Hills', lat: 17.3724, lng: 78.4123 },
  { area: 'Banjara Hills', lat: 17.3841, lng: 78.3970 },
  { area: 'Koramangala', lat: 17.3419, lng: 78.3871 },
  { area: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { area: 'Old City', lat: 17.3674, lng: 78.4754 },
  { area: 'Secunderabad', lat: 17.3697, lng: 78.4939 },
  { area: 'Kukatpally', lat: 17.4737, lng: 78.3830 },
  { area: 'Uppal', lat: 17.3676, lng: 78.5593 },
  { area: 'Mehdipatnam', lat: 17.3821, lng: 78.4789 },
  { area: 'Charminar', lat: 17.3626, lng: 78.4740 }
];

function getRandomCoordinates() {
  const zone = hyderabadZones[Math.floor(Math.random() * hyderabadZones.length)];
  
  // Add some random offset so not all complaints are at exact same point
  const latOffset = (Math.random() - 0.5) * 0.02; // ~1-2 km variation
  const lngOffset = (Math.random() - 0.5) * 0.02;
  
  return {
    lat: parseFloat((zone.lat + latOffset).toFixed(6)),
    lng: parseFloat((zone.lng + lngOffset).toFixed(6)),
    address: zone.area,
    city: 'Hyderabad',
    state: 'Telangana'
  };
}

async function migrateLocations() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse';
    console.log('Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    
    console.log('🔄 Starting location migration...');
    
    // Find all complaints without lat/lng coordinates
    const complaintsWithoutCoords = await Complaint.find({
      $or: [
        { 'location.lat': { $exists: false } },
        { 'location.lng': { $exists: false } }
      ]
    });
    
    console.log(`Found ${complaintsWithoutCoords.length} complaints without coordinates`);
    
    let updated = 0;
    
    for (const complaint of complaintsWithoutCoords) {
      const coords = getRandomCoordinates();
      
      // Preserve existing location data and add coordinates
      if (!complaint.location) {
        complaint.location = {};
      }
      
      complaint.location.lat = coords.lat;
      complaint.location.lng = coords.lng;
      
      // Keep or add address info
      if (!complaint.location.address) {
        complaint.location.address = coords.address;
      }
      if (!complaint.location.city) {
        complaint.location.city = coords.city;
      }
      if (!complaint.location.state) {
        complaint.location.state = coords.state;
      }
      
      await complaint.save();
      updated++;
      
      console.log(`✓ Updated: ${complaint.title} (${coords.lat}, ${coords.lng})`);
    }
    
    console.log(`\n✅ Migration complete! Updated ${updated} complaints with coordinates`);
    
    // Show summary
    const totalComplaints = await Complaint.countDocuments();
    const withCoords = await Complaint.countDocuments({
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`Total complaints: ${totalComplaints}`);
    console.log(`With coordinates: ${withCoords}`);
    console.log(`Without coordinates: ${totalComplaints - withCoords}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateLocations();
