export interface ModerationQueueItem {
  _id: string;
  complaintId: string | any;
  AI_flagged: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | any;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}
