export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'student' | 'worker' | 'admin';
  mobile?: string;
  location?: {
    lat: number;
    lng: number;
  };
  travelFlag?: boolean;
  points?: number;
  badges?: string[];
  twoFactorEnabled?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}
