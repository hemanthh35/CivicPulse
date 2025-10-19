import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { CsvService } from '../../../services/csv.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ModerationReport {
  _id: string;
  title: string;
  description: string;
  reportType: string;
  reason: string;
  severity: string;
  status: string;
  action: string;
  reportedBy?: any;
  reviewedBy?: any;
  reportedItemId?: any;
  moderatorNotes: string;
  createdAt: Date;
  reviewedAt?: Date;
  assignedTo?: any;
}

@Component({
  selector: 'app-moderation-panel',
  templateUrl: './moderation-panel.component.html',
  styleUrls: ['./moderation-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class ModerationPanelComponent implements OnInit, OnDestroy {
  reports: ModerationReport[] = [];
  loading = true;
  error = '';
  success = '';
  
  // Filters
  statusFilter = ''; // Show ALL reports by default
  priorityFilter = '';
  typeFilter = '';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  total = 0;
  
  // Stats
  stats: any = null;
  
  // Modals
  showDetailModal = false;
  showActionModal = false;
  showAssignModal = false;
  
  // Selected data
  selectedReport: ModerationReport | null = null;
  
  // Worker assignment
  availableWorkers: any[] = [];
  selectedWorkerId = '';
  
  // Forms
  actionForm: FormGroup;
  
  // Batch operations
  selectedReports: Set<string> = new Set();
  selectAll = false;
  
  // Expose Math to template
  Math = Math;
  
  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private csvService: CsvService,
    private fb: FormBuilder
  ) {
    this.actionForm = this.fb.group({
      action: ['', Validators.required],
      moderatorNotes: ['']
    });
  }

  ngOnInit(): void {
    this.loadReports();
    this.loadStats();
    this.loadAvailableWorkers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReports(): void {
    this.loading = true;
    this.error = '';
    
    const params: any = {
      page: this.currentPage,
      limit: this.limit
    };
    
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.priorityFilter) params.priority = this.priorityFilter;
    if (this.typeFilter) params.type = this.typeFilter;
    if (this.searchTerm) params.search = this.searchTerm;
    
    this.adminService.getModerationReports(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.reports = response.reports;
            this.total = response.pagination?.total || 0;
            this.totalPages = response.pagination?.pages || 1;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading reports:', error);
          this.error = 'Failed to load moderation reports';
          this.loading = false;
        }
      });
  }

  loadStats(): void {
    this.adminService.getModerationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.stats = response.stats;
          }
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  loadAvailableWorkers(): void {
    this.adminService.getAllUsers({ role: 'worker', limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.availableWorkers = response.users;
          }
        },
        error: (error) => {
          console.error('Error loading workers:', error);
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.selectedReports.clear();
    this.selectAll = false;
    this.loadReports();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.selectedReports.clear();
    this.selectAll = false;
    this.loadReports();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.selectedReports.clear();
      this.selectAll = false;
      this.loadReports();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.selectedReports.clear();
      this.selectAll = false;
      this.loadReports();
    }
  }

  // Batch Operations
  toggleReportSelect(reportId: string): void {
    if (this.selectedReports.has(reportId)) {
      this.selectedReports.delete(reportId);
    } else {
      this.selectedReports.add(reportId);
    }
    this.selectAll = this.selectedReports.size === this.reports.length;
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedReports.clear();
    } else {
      this.reports.forEach(r => this.selectedReports.add(r._id));
    }
  }

  // Modal Functions
  openDetailModal(report: ModerationReport): void {
    this.selectedReport = report;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedReport = null;
  }

  openActionModal(report: ModerationReport): void {
    this.selectedReport = report;
    this.actionForm.reset({ action: '', moderatorNotes: '' });
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedReport = null;
    this.actionForm.reset();
  }

  openAssignModal(report: ModerationReport): void {
    this.selectedReport = report;
    this.selectedWorkerId = '';
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedReport = null;
    this.selectedWorkerId = '';
  }

  assignToWorker(): void {
    if (!this.selectedReport || !this.selectedWorkerId) {
      this.error = 'Please select a worker';
      return;
    }
    
    this.adminService.updateComplaint(this.selectedReport._id, { 
      assignedTo: this.selectedWorkerId,
      status: 'in-progress' // Auto-set to in-progress when assigned
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Complaint assigned successfully';
          this.closeAssignModal();
          this.loadReports();
          this.loadStats();
        },
        error: (error) => {
          this.error = 'Failed to assign complaint';
          console.error('Assignment error:', error);
        }
      });
  }

  approveReport(): void {
    if (!this.selectedReport || this.actionForm.invalid) return;
    
    const formData = this.actionForm.value;
    
    this.adminService.approveModerationReport(this.selectedReport._id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Report approved successfully';
          this.closeActionModal();
          this.loadReports();
          this.loadStats();
        },
        error: (error) => {
          this.error = 'Failed to approve report';
        }
      });
  }

  rejectReport(): void {
    if (!this.selectedReport || !this.actionForm.get('moderatorNotes')?.value) {
      this.error = 'Please provide a reason for rejection';
      return;
    }
    
    const formData = this.actionForm.value;
    
    this.adminService.rejectModerationReport(this.selectedReport._id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Report rejected successfully';
          this.closeActionModal();
          this.loadReports();
          this.loadStats();
        },
        error: (error) => {
          this.error = 'Failed to reject report';
        }
      });
  }

  // Helper Methods
  getPriorityBadgeClass(priority: string): string {
    const classes: any = {
      'low': 'bg-success',
      'medium': 'bg-warning',
      'high': 'bg-danger'
    };
    return classes[priority?.toLowerCase()] || 'bg-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'pending': 'bg-warning',
      'in-progress': 'bg-info',
      'resolved': 'bg-success'
    };
    return classes[status?.toLowerCase()] || 'bg-secondary';
  }

  getPriorityIcon(priority: string): string {
    const icons: any = {
      'low': 'bi-exclamation-circle',
      'medium': 'bi-exclamation-triangle',
      'high': 'bi-exclamation-triangle-fill'
    };
    return icons[priority?.toLowerCase()] || 'bi-question-circle';
  }

  // Bulk Operations
  bulkApprove(): void {
    if (this.selectedReports.size === 0) {
      this.error = 'No reports selected';
      return;
    }

    if (!confirm(`Approve ${this.selectedReports.size} report(s)?`)) return;

    this.adminService.bulkApproveModerationReports(Array.from(this.selectedReports))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = `${this.selectedReports.size} report(s) approved successfully`;
          this.selectedReports.clear();
          this.selectAll = false;
          this.loadReports();
          this.loadStats();
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = 'Failed to approve reports: ' + (error.error?.message || 'Unknown error');
        }
      });
  }

  bulkReject(): void {
    if (this.selectedReports.size === 0) {
      this.error = 'No reports selected';
      return;
    }

    const reason = prompt('Enter reason for bulk rejection:');
    if (!reason) return;

    this.adminService.bulkRejectModerationReports(Array.from(this.selectedReports), { reason })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = `${this.selectedReports.size} report(s) rejected successfully`;
          this.selectedReports.clear();
          this.selectAll = false;
          this.loadReports();
          this.loadStats();
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = 'Failed to reject reports: ' + (error.error?.message || 'Unknown error');
        }
      });
  }

  exportToCSV(): void {
    if (this.reports.length === 0) {
      this.error = 'No reports to export';
      return;
    }
    this.csvService.exportModerationReports(this.reports);
    this.success = 'Reports exported successfully!';
    setTimeout(() => this.success = '', 3000);
  }
}
