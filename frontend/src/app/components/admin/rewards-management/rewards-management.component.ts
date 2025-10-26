import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { RewardsService } from '../../../services/rewards.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-rewards-management',
  templateUrl: './rewards-management.component.html',
  styleUrls: ['./rewards-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class RewardsManagementComponent implements OnInit, OnDestroy {
  loading = false;
  error = '';
  success = '';
  
  // Stats
  stats = {
    totalStudents: 0,
    totalPoints: 0,
    totalBadges: 0,
    totalRedemptions: 0,
    avgPointsPerStudent: 0
  };
  
  // Students list
  students: any[] = [];
  selectedStudent: any = null;
  
  // Rewards
  availableRewards: any[] = [];
  redemptionHistory: any[] = [];
  
  // Modals
  showAddPointsModal = false;
  showAddBadgeModal = false;
  showCreateRewardModal = false;
  
  // Forms
  pointsForm: FormGroup;
  badgeForm: FormGroup;
  rewardForm: FormGroup;
  
  // Filters
  searchTerm = '';
  filterRole = 'student';
  
  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private rewardsService: RewardsService,
    private fb: FormBuilder
  ) {
    this.pointsForm = this.fb.group({
      points: ['', [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required]
    });
    
    this.badgeForm = this.fb.group({
      badgeName: ['', Validators.required],
      description: ['']
    });
    
    this.rewardForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      pointsRequired: ['', [Validators.required, Validators.min(1)]],
      category: ['gift-card', Validators.required],
      available: [true]
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    this.loading = true;
    this.loadStudents();
    this.loadStats();
    this.loadRewards();
    this.loadRedemptionHistory();
  }

  loadStudents(): void {
    this.adminService.getAllUsers({ role: 'student', search: this.searchTerm })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.students = response.users || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load students';
          this.loading = false;
        }
      });
  }

  loadStats(): void {
    this.adminService.getRewardsStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.stats = response.stats;
          }
        },
        error: (err) => {
          console.error('Failed to load rewards stats:', err);
          // Fallback: calculate from loaded students
          const totalPoints = this.students.reduce((sum, s) => sum + (s.points || 0), 0);
          const totalBadges = this.students.reduce((sum, s) => sum + (s.badges?.length || 0), 0);
          const studentCount = this.students.length;
          
          this.stats = {
            totalStudents: studentCount,
            totalPoints: totalPoints,
            totalBadges: totalBadges,
            totalRedemptions: 0,
            avgPointsPerStudent: studentCount > 0 ? Math.round(totalPoints / studentCount) : 0
          };
        }
      });
  }

  loadRewards(): void {
    this.rewardsService.getAvailableRewards()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.availableRewards = response.rewards || [];
        },
        error: (err) => console.error('Rewards error:', err)
      });
  }

  loadRedemptionHistory(): void {
    // TODO: Create admin endpoint for all redemption history
    this.redemptionHistory = [];
  }

  // Add Points Modal
  openAddPointsModal(student: any): void {
    this.selectedStudent = student;
    this.pointsForm.reset();
    this.showAddPointsModal = true;
  }

  closeAddPointsModal(): void {
    this.showAddPointsModal = false;
    this.selectedStudent = null;
  }

  submitAddPoints(): void {
    if (this.pointsForm.invalid || !this.selectedStudent) return;
    
    const { points, reason } = this.pointsForm.value;
    
    this.adminService.addPoints(this.selectedStudent._id, points, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.success = response.message;
            this.closeAddPointsModal();
            this.loadDashboard();
            setTimeout(() => this.success = '', 3000);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to add points';
          setTimeout(() => this.error = '', 3000);
        }
      });
  }

  // Add Badge Modal
  openAddBadgeModal(student: any): void {
    this.selectedStudent = student;
    this.badgeForm.reset();
    this.showAddBadgeModal = true;
  }

  closeAddBadgeModal(): void {
    this.showAddBadgeModal = false;
    this.selectedStudent = null;
  }

  submitAddBadge(): void {
    if (this.badgeForm.invalid || !this.selectedStudent) {
      console.error('Form invalid or no student selected');
      console.error('badgeForm.invalid:', this.badgeForm.invalid);
      console.error('badgeForm.value:', this.badgeForm.value);
      console.error('selectedStudent:', this.selectedStudent);
      return;
    }
    
    const { badgeName, description } = this.badgeForm.value;
    
    console.log('Submitting badge:', { userId: this.selectedStudent._id, badgeName, description });
    
    this.adminService.addBadge(this.selectedStudent._id, badgeName, description)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.success = response.message;
            this.closeAddBadgeModal();
            this.loadDashboard();
            setTimeout(() => this.success = '', 3000);
          }
        },
        error: (err) => {
          console.error('Badge add error:', err);
          this.error = err.error?.message || 'Failed to add badge';
          setTimeout(() => this.error = '', 3000);
        }
      });
  }

  // Create Reward Modal
  openCreateRewardModal(): void {
    this.rewardForm.reset({ category: 'gift-card', available: true });
    this.showCreateRewardModal = true;
  }

  closeCreateRewardModal(): void {
    this.showCreateRewardModal = false;
  }

  submitCreateReward(): void {
    if (this.rewardForm.invalid) return;
    
    const rewardData = this.rewardForm.value;
    
    this.adminService.createReward(rewardData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.success = response.message;
            this.closeCreateRewardModal();
            this.loadRewards();
            setTimeout(() => this.success = '', 3000);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create reward';
          setTimeout(() => this.error = '', 3000);
        }
      });
  }

  // Search & Filter
  onSearch(): void {
    this.loadStudents();
  }

  // Helper methods
  getStatusBadgeClass(status: string): string {
    return status === 'active' ? 'bg-success' : 'bg-secondary';
  }

  exportCSV(): void {
    const csv = this.students.map(s => 
      `${s.name},${s.email},${s.points || 0},${s.badges?.length || 0}`
    ).join('\n');
    
    const blob = new Blob([`Name,Email,Points,Badges\n${csv}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_rewards.csv';
    a.click();
  }
}
