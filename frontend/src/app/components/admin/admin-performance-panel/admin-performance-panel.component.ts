import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

interface WorkerPerformance {
  worker: {
    _id: string;
    name: string;
    email: string;
  };
  stats: {
    totalAssigned: number;
    pending: number;
    inProgress: number;
    resolved: number;
    completionRate: number;
    avgCompletionTime: number;
    recentResolved: number;
    workloadStatus: string;
    activeTasks: number;
  };
}

interface PerformanceSummary {
  totalWorkers: number;
  totalComplaints: number;
  totalResolved: number;
  avgCompletionRate: number;
  workloadDistribution: {
    light: number;
    moderate: number;
    heavy: number;
  };
}

@Component({
  selector: 'app-admin-performance-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-performance-panel.component.html',
  styleUrls: ['./admin-performance-panel.component.scss']
})
export class AdminPerformancePanelComponent implements OnInit {
  performanceData: WorkerPerformance[] = [];
  summary: PerformanceSummary | null = null;
  loading = true;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadPerformanceData();
  }

  loadPerformanceData(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getWorkerPerformance().subscribe({
      next: (response) => {
        if (response.success) {
          this.performanceData = response.data.workers;
          this.summary = response.data.summary;
        } else {
          this.error = 'Failed to load performance data';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Performance data error:', error);
        this.error = 'Failed to load performance data';
        this.loading = false;
      }
    });
  }

  getWorkloadBadgeClass(status: string): string {
    switch (status) {
      case 'light': return 'badge bg-success';
      case 'moderate': return 'badge bg-warning';
      case 'heavy': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getWorkloadText(status: string): string {
    switch (status) {
      case 'light': return 'Light';
      case 'moderate': return 'Moderate';
      case 'heavy': return 'Heavy';
      default: return 'Unknown';
    }
  }

  getCompletionRateClass(rate: number): string {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-danger';
  }

  refreshData(): void {
    this.loadPerformanceData();
  }
}