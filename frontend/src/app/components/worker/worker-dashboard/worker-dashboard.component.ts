import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplaintsService } from '../../../services/complaints.service';

interface WorkerStats {
  totalAssigned: number;
  pending: number;
  inProgress: number;
  resolved: number;
  completionRate: string;
  recentAssignments: number;
  avgCompletionTime: string;
}

@Component({
  selector: 'app-worker-dashboard',
  templateUrl: './worker-dashboard.component.html',
  styleUrls: ['./worker-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class WorkerDashboardComponent implements OnInit {
  stats: WorkerStats | null = null;
  recentComplaints: any[] = [];
  analytics: any = null;
  loading = true;
  error = '';
  showAnalytics = false;

  constructor(private complaintsService: ComplaintsService) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentComplaints();
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.complaintsService.getWorkerAnalytics()
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.analytics = response.analytics;
          }
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
        }
      });
  }

  toggleAnalytics(): void {
    this.showAnalytics = !this.showAnalytics;
  }

  loadStats(): void {
    this.loading = true;
    this.complaintsService.getWorkerStats()
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.stats = response.stats;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading worker stats:', error);
          this.error = 'Failed to load statistics';
          this.loading = false;
        }
      });
  }

  loadRecentComplaints(): void {
    this.complaintsService.getWorkerComplaints()
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Get only the first 5 complaints for quick view
            this.recentComplaints = response.complaints.slice(0, 5);
          }
        },
        error: (error) => {
          console.error('Error loading complaints:', error);
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'pending': 'bg-warning',
      'in-progress': 'bg-info',
      'resolved': 'bg-success'
    };
    return classes[status?.toLowerCase()] || 'bg-secondary';
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: any = {
      'low': 'bg-success',
      'medium': 'bg-warning',
      'high': 'bg-danger'
    };
    return classes[priority?.toLowerCase()] || 'bg-secondary';
  }
}
