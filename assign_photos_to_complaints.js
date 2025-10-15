require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./backend/models/complaint.model');
const fs = require('fs');
const path = require('path');

async function assignPhotosToComplaints() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse');
    console.log('Connected to MongoDB');

    // Get all image files from uploads folder
    const uploadsDir = path.join(__dirname, 'backend', 'uploads');
    const imageFiles = fs.readdirSync(uploadsDir).filter(file => {
      return file.match(/\.(jpg|jpeg|png|gif)$/i);
    });

    console.log(`Found ${imageFiles.length} image files in uploads folder:`);
    imageFiles.forEach(file => console.log(`  - ${file}`));

    // Find complaints without photos
    const complaintsWithoutPhotos = await Complaint.find({ 
      $or: [
        { mediaURL: null },
        { mediaURL: { $exists: false } },
        { mediaURL: '' }
      ]
    });

    console.log(`Found ${complaintsWithoutPhotos.length} complaints without photos`);

    if (complaintsWithoutPhotos.length === 0) {
      console.log('All complaints already have photos!');
      return;
    }

    // Assign random photos to complaints
    for (let i = 0; i < complaintsWithoutPhotos.length; i++) {
      const complaint = complaintsWithoutPhotos[i];
      const imageIndex = i % imageFiles.length; // Cycle through images if more complaints than images
      const selectedImage = imageFiles[imageIndex];
      
      console.log(`Processing complaint ${i + 1}/${complaintsWithoutPhotos.length}`);
      console.log(`  - Complaint: ${complaint.title}`);
      console.log(`  - Selected image: ${selectedImage}`);
      
      // Set the photo field directly
      await Complaint.findByIdAndUpdate(complaint._id, {
        mediaURL: selectedImage
      });
      
      console.log(`  - Updated complaint ${complaint._id} with photo: ${selectedImage}`);
    }

    console.log('Photo assignment completed!');
    
    // Show updated counts
    const complaintsWithPhotos = await Complaint.find({ 
      photo: { $exists: true, $ne: null, $ne: '' }
    });
    console.log(`Now ${complaintsWithPhotos.length} complaints have photos`);
    
    // Debug: Show all complaints and their photo values
    const allComplaints = await Complaint.find({});
    console.log('\nAll complaints:');
    allComplaints.forEach(c => {
      console.log(`  - ${c.title}: photo = "${c.photo}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

assignPhotosToComplaints();