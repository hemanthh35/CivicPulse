import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RewardsService } from '../../../services/rewards.service';
import { AuthService } from '../../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  leaderboard: any[] = [];
  isLoading = true;
  error = '';
  currentUser: any;
  
  private destroy$ = new Subject<void>();

  constructor(
    private rewardsService: RewardsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadLeaderboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLeaderboard(): void {
    this.isLoading = true;
    this.rewardsService.getLeaderboard({ limit: 50 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.leaderboard = response.leaderboard || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load leaderboard';
          console.error('Leaderboard error:', err);
          this.isLoading = false;
        }
      });
  }

  isCurrentUser(userId: string): boolean {
    return this.currentUser?.id === userId;
  }

  getRankClass(index: number): string {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
  }

  getRankIcon(index: number): string {
    if (index === 0) return 'bi-trophy-fill text-warning';
    if (index === 1) return 'bi-trophy-fill text-secondary';
    if (index === 2) return 'bi-trophy-fill text-danger';
    return 'bi-award';
  }
}
