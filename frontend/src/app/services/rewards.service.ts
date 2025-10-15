import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reward } from '../models/reward.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RewardsService {
  private apiUrl = `${environment.apiUrl}/rewards`;

  constructor(private http: HttpClient) { }  getUserRewards(userId: string): Observable<{ success: boolean, reward: Reward }> {
    return this.http.get<{ success: boolean, reward: Reward }>(`${this.apiUrl}/user/${userId}`);
  }

  addPoints(userId: string, points: number): Observable<{ success: boolean, reward: Reward }> {
    return this.http.put<{ success: boolean, reward: Reward }>(`${this.apiUrl}/add-points/${userId}`, { points });
  }

  addBadge(userId: string, badge: string): Observable<{ success: boolean, reward: Reward }> {
    return this.http.put<{ success: boolean, reward: Reward }>(`${this.apiUrl}/add-badge/${userId}`, { badge });
  }

  addCertificate(userId: string, certificate: string): Observable<{ success: boolean, reward: Reward }> {
    return this.http.put<{ success: boolean, reward: Reward }>(`${this.apiUrl}/add-certificate/${userId}`, { certificate });
  }

  addCoupon(userId: string, code: string, value: string, expiresAt?: Date): Observable<{ success: boolean, reward: Reward }> {
    return this.http.put<{ success: boolean, reward: Reward }>(`${this.apiUrl}/add-coupon/${userId}`, { 
      code, 
      value,
      expiresAt 
    });
  }

  getLeaderboard(): Observable<{ success: boolean, users: User[] }> {
    return this.http.get<{ success: boolean, users: User[] }>(`${this.apiUrl}/leaderboard`);
  }
}
