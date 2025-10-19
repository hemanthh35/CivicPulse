const User = require('../models/user.model');
const Complaint = require('../models/complaint.model');

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Get worker scores based on multiple factors
 */
async function getWorkerScores(complaint, workers) {
  const scores = await Promise.all(workers.map(async (worker) => {
    let score = 0;
    const factors = {};

    // Factor 1: Workload (40% weight) - Lower workload = higher score
    const activeComplaints = await Complaint.countDocuments({
      assignedTo: worker._id,
      status: { $in: ['pending', 'in-progress'] }
    });
    const workloadScore = Math.max(0, 100 - (activeComplaints * 10));
    score += workloadScore * 0.4;
    factors.workload = { active: activeComplaints, score: workloadScore };

    // Factor 2: Location proximity (30% weight) - Closer = higher score
    if (worker.workArea?.lat && worker.workArea?.lng && 
        complaint.location?.lat && complaint.location?.lng) {
      const distance = calculateDistance(
        worker.workArea.lat,
        worker.workArea.lng,
        complaint.location.lat,
        complaint.location.lng
      );
      
      const maxDistance = worker.workArea.radius || 10;
      const locationScore = distance <= maxDistance 
        ? Math.max(0, 100 - (distance / maxDistance * 100))
        : 0;
      
      score += locationScore * 0.3;
      factors.location = { distance: distance.toFixed(2), score: locationScore };
    } else {
      // No location data, neutral score
      score += 50 * 0.3;
      factors.location = { distance: 'N/A', score: 50 };
    }

    // Factor 3: Specialization match (20% weight)
    if (worker.specializations && worker.specializations.length > 0) {
      const hasMatch = worker.specializations.includes(complaint.type);
      const specializationScore = hasMatch ? 100 : 30;
      score += specializationScore * 0.2;
      factors.specialization = { match: hasMatch, score: specializationScore };
    } else {
      // No specialization, slight penalty
      score += 40 * 0.2;
      factors.specialization = { match: false, score: 40 };
    }

    // Factor 4: Performance history (10% weight)
    const totalResolved = await Complaint.countDocuments({
      assignedTo: worker._id,
      status: 'resolved'
    });
    const totalAssigned = await Complaint.countDocuments({
      assignedTo: worker._id
    });
    
    const completionRate = totalAssigned > 0 
      ? (totalResolved / totalAssigned) * 100 
      : 50;
    
    score += completionRate * 0.1;
    factors.performance = { 
      resolved: totalResolved, 
      total: totalAssigned, 
      rate: completionRate.toFixed(1) 
    };

    return {
      worker,
      score: Math.round(score),
      factors
    };
  }));

  // Sort by score (highest first)
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Find the best worker for a complaint using smart assignment
 */
async function findBestWorker(complaint) {
  try {
    // Get all active workers
    const workers = await User.find({ 
      role: 'worker',
      isActive: true 
    });

    if (workers.length === 0) {
      return null;
    }

    // Get worker scores
    const scoredWorkers = await getWorkerScores(complaint, workers);

    // Return the top worker
    return scoredWorkers[0];
  } catch (error) {
    console.error('Smart assignment error:', error);
    return null;
  }
}

/**
 * Get assignment recommendations for a complaint
 */
async function getAssignmentRecommendations(complaintId, limit = 5) {
  try {
    const complaint = await Complaint.findById(complaintId);
    
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const workers = await User.find({ 
      role: 'worker',
      isActive: true 
    });

    if (workers.length === 0) {
      return [];
    }

    const scoredWorkers = await getWorkerScores(complaint, workers);

    // Return top N recommendations
    return scoredWorkers.slice(0, limit).map(sw => ({
      worker: {
        _id: sw.worker._id,
        name: sw.worker.name,
        email: sw.worker.email,
        specializations: sw.worker.specializations || [],
        workArea: sw.worker.workArea
      },
      score: sw.score,
      factors: sw.factors,
      recommendation: sw.score >= 70 ? 'Excellent match' : 
                     sw.score >= 50 ? 'Good match' : 
                     'Fair match'
    }));
  } catch (error) {
    console.error('Get recommendations error:', error);
    throw error;
  }
}

module.exports = {
  findBestWorker,
  getAssignmentRecommendations,
  calculateDistance
};
