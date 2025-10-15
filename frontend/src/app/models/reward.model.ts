export interface Reward {
  _id: string;
  userId: string;
  points: number;
  badges: string[];
  certificates: string[];
  coupons: {
    code: string;
    value: string;
    expiresAt?: Date;
    redeemed: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
