export interface Comment {
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  createdAt: Date;
}

export interface Complaint {
  _id: string;
  type: 'garbage' | 'road' | 'water' | 'lights' | 'other' | string;
  title?: string;
  description: string;
  mediaURL?: string;
  mediaURLs?: string[];
  location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  priority?: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved';
  createdBy: string | any;
  assignedTo?: string | any;
  rewardEligible: boolean;
  resolutionProof?: {
    mediaURL: string;
    timestamp: Date;
  };
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
  };
  comments?: Comment[];
  statusHistory?: any[];
  assignmentHistory?: any[];
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
