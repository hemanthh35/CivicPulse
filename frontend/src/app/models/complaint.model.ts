export interface Complaint {
  _id: string;
  type: 'garbage' | 'road' | 'water' | 'lights' | 'other';
  description: string;
  mediaURL?: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'in-progress' | 'resolved';
  createdBy: string | any;
  assignedTo?: string | any;
  rewardEligible: boolean;
  resolutionProof?: {
    mediaURL: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
