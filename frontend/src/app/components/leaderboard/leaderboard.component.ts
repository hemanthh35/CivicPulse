import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface LeaderboardUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  count: number;
  rank: number;
}

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LeaderboardComponent implements OnInit {
  topCitizens: LeaderboardUser[] = [];
  topWorkers: LeaderboardUser[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading leaderboard from:', `${environment.apiUrl}/leaderboard`);
    
    this.http.get<any>(`${environment.apiUrl}/leaderboard`)
      .subscribe({
        next: (response) => {
          console.log('Leaderboard response:', response);
          
          if (response.success) {
            this.topCitizens = (response.topCitizens || []).map((user: any, index: number) => ({
              ...user,
              rank: index + 1
            }));
            this.topWorkers = (response.topWorkers || []).map((user: any, index: number) => ({
              ...user,
              rank: index + 1
            }));
            
            console.log('Citizens:', this.topCitizens.length);
            console.log('Workers:', this.topWorkers.length);
          } else {
            this.errorMessage = response.message || 'Failed to load leaderboard';
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Leaderboard error:', error);
          this.errorMessage = error.error?.message || 'Failed to load leaderboard';
          this.isLoading = false;
        }
      });
  }

  getRankBadgeClass(rank: number): string {
    switch (rank) {
      case 1: return 'badge-gold';
      case 2: return 'badge-silver';
      case 3: return 'badge-bronze';
      default: return 'badge-default';
    }
  }

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1: return 'bi-trophy-fill';
      case 2: return 'bi-award-fill';
      case 3: return 'bi-star-fill';
      default: return 'bi-hash';
    }
  }
}
