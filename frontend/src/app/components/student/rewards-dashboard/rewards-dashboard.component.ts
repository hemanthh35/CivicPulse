import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { RewardsService } from '../../../services/rewards.service';
import { ComplaintsService } from '../../../services/complaints.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-rewards-dashboard',
  templateUrl: './rewards-dashboard.component.html',
  styleUrls: ['./rewards-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class RewardsDashboardComponent implements OnInit, OnDestroy {
  user: any;
  isLoading = true;
  error = '';
  
  // Stats
  stats = {
    totalPoints: 0,
    totalBadges: 0,
    leaderboardRank: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0
  };
  
  // Rewards data
  availableRewards: any[] = [];
  redeemHistory: any[] = [];
  badges: any[] = [];
  recentActivity: any[] = [];
  leaderboard: any[] = [];
  
  // Travel Flag
  travelFlag = false;
  updatingTravelFlag = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private rewardsService: RewardsService,
    private complaintsService: ComplaintsService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.travelFlag = this.user?.travelFlag || false;
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Load user stats
    this.loadUserStats();
    
    // Load available rewards
    this.loadAvailableRewards();
    
    // Load redeem history
    this.loadRedeemHistory();
    
    // Load leaderboard
    this.loadLeaderboard();
    
    // Load recent complaints activity
    this.loadRecentActivity();
  }

  loadUserStats(): void {
    // Load user reward data from Reward collection
    if (this.user?.id) {
      console.log('Loading rewards for user:', this.user.id);
      this.rewardsService.getUserRewards(this.user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Rewards response:', response);
            if (response.success && response.reward) {
              this.stats.totalPoints = response.reward.points || 0;
              this.stats.totalBadges = response.reward.badges?.length || 0;
              this.badges = response.reward.badges || [];
              console.log('Stats updated:', this.stats);
            } else {
              // No reward record yet
              this.stats.totalPoints = 0;
              this.stats.totalBadges = 0;
              this.badges = [];
              console.log('No reward record found, using defaults');
            }
          },
          error: (err) => {
            console.error('Error loading rewards:', err);
            // Fallback to defaults
            this.stats.totalPoints = 0;
            this.stats.totalBadges = 0;
            this.badges = [];
          }
        });
      
      // Load complaint stats
      this.complaintsService.getUserComplaints(this.user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const complaints = response.complaints || [];
            this.stats.totalComplaints = complaints.length;
            this.stats.resolvedComplaints = complaints.filter((c: any) => c.status === 'resolved').length;
            this.stats.pendingComplaints = complaints.filter((c: any) => c.status === 'pending').length;
          },
          error: (err) => console.error('Error loading complaints:', err)
        });
    }
  }

  loadAvailableRewards(): void {
    this.rewardsService.getAvailableRewards()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.availableRewards = response.rewards || [];
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading rewards:', err);
          this.isLoading = false;
        }
      });
  }

  loadRedeemHistory(): void {
    this.rewardsService.getUserRedeemHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.redeemHistory = response.history || [];
        },
        error: (err) => console.error('Error loading redeem history:', err)
      });
  }

  loadLeaderboard(): void {
    this.rewardsService.getLeaderboard({ limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.leaderboard = response.leaderboard || [];
          
          // Find current user's rank
          const userRank = this.leaderboard.findIndex((u: any) => u._id === this.user?.id);
          this.stats.leaderboardRank = userRank >= 0 ? userRank + 1 : 0;
        },
        error: (err) => console.error('Error loading leaderboard:', err)
      });
  }

  loadRecentActivity(): void {
    if (this.user?.id) {
      this.complaintsService.getUserComplaints(this.user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.recentActivity = (response.complaints || [])
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
          },
          error: (err) => console.error('Error loading activity:', err)
        });
    }
  }

  redeemReward(rewardId: string): void {
    if (!confirm('Are you sure you want to redeem this reward?')) return;
    
    this.rewardsService.redeemReward(rewardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          alert('Reward redeemed successfully! Check your email for details.');
          this.loadDashboardData();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to redeem reward';
        }
      });
  }

  toggleTravelFlag(): void {
    this.updatingTravelFlag = true;
    
    this.authService.updateProfile({ travelFlag: this.travelFlag })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.user = response.user;
          this.updatingTravelFlag = false;
          alert(`Travel flag ${this.travelFlag ? 'enabled' : 'disabled'} successfully!`);
        },
        error: (err) => {
          this.error = 'Failed to update travel flag';
          this.updatingTravelFlag = false;
          this.travelFlag = !this.travelFlag; // Revert
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'pending': 'bg-warning text-dark',
      'in-progress': 'bg-info',
      'resolved': 'bg-success',
      'redeemed': 'bg-success',
      'expired': 'bg-secondary'
    };
    return classes[status?.toLowerCase()] || 'bg-secondary';
  }

  getBadgeIcon(badgeName: string): string {
    const icons: any = {
      'First Report': 'bi-star-fill',
      'Resolved Master': 'bi-check-circle-fill',
      'Community Hero': 'bi-heart-fill',
      'Quick Reporter': 'bi-lightning-fill',
      'Quality Reporter': 'bi-gem'
    };
    return icons[badgeName] || 'bi-award-fill';
  }
}
