import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { CsvService } from '../../../services/csv.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Complaint {
  _id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  location?: any;
  createdBy?: any;
  assignedTo?: any;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-complaint-management',
  templateUrl: './complaint-management.component.html',
  styleUrls: ['./complaint-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class ComplaintManagementComponent implements OnInit, OnDestroy {
  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];
  loading = true;
  error = '';
  success = '';
  
  // Filters
  searchTerm = '';
  statusFilter = '';
  priorityFilter = '';
  typeFilter = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  total = 0;
  
  // Sorting
  sortBy = 'createdAt';
  sortOrder = 'desc';
  
  // Modals
  showDetailModal = false;
  showAssignModal = false;
  showUpdateStatusModal = false;
  showImageModal = false;
  
  // Selected data
  selectedComplaint: Complaint | null = null;
  selectedImageUrl: string = '';
  availableWorkers: any[] = [];
  
  // Forms
  updateStatusForm: FormGroup;
  assignForm: FormGroup;
  
  // Batch operations
  selectedComplaints: Set<string> = new Set();
  selectAll = false;
  
  // Expose Math to template
  Math = Math;
  
  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private csvService: CsvService,
    private fb: FormBuilder
  ) {
    this.updateStatusForm = this.fb.group({
      status: ['', Validators.required],
      priority: ['', Validators.required],
      notes: ['']
    });
    
    this.assignForm = this.fb.group({
      assignedTo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadComplaints();
    this.loadAvailableWorkers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadComplaints(): void {
    this.loading = true;
    this.error = '';
    
    const params: any = {
      page: this.currentPage,
      limit: this.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
    
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.priorityFilter) params.priority = this.priorityFilter;
    if (this.typeFilter) params.type = this.typeFilter;
    if (this.searchTerm) params.search = this.searchTerm;
    
    this.adminService.getAllComplaints(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.complaints = response.complaints;
            this.filteredComplaints = response.complaints;
            this.total = response.pagination?.total || 0;
            this.totalPages = response.pagination?.pages || 1;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading complaints:', error);
          this.error = 'Failed to load complaints';
          this.loading = false;
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
    this.selectedComplaints.clear();
    this.selectAll = false;
    this.loadComplaints();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.selectedComplaints.clear();
    this.selectAll = false;
    this.loadComplaints();
  }

  onSortChange(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.currentPage = 1;
    this.loadComplaints();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.selectedComplaints.clear();
      this.selectAll = false;
      this.loadComplaints();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.selectedComplaints.clear();
      this.selectAll = false;
      this.loadComplaints();
    }
  }

  // Batch Operations
  toggleComplaintSelect(complaintId: string): void {
    if (this.selectedComplaints.has(complaintId)) {
      this.selectedComplaints.delete(complaintId);
    } else {
      this.selectedComplaints.add(complaintId);
    }
    this.selectAll = this.selectedComplaints.size === this.complaints.length;
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedComplaints.clear();
    } else {
      this.complaints.forEach(c => this.selectedComplaints.add(c._id));
    }
  }

  bulkUpdateStatus(status: string): void {
    if (this.selectedComplaints.size === 0) {
      this.error = 'Please select at least one complaint';
      return;
    }

    this.selectedComplaints.forEach(complaintId => {
      this.adminService.updateComplaint(complaintId, { status })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.success = `${this.selectedComplaints.size} complaints updated`;
            this.selectedComplaints.clear();
            this.selectAll = false;
            this.loadComplaints();
          },
          error: (error) => {
            this.error = 'Failed to update complaints';
          }
        });
    });
  }

  // Modal Functions
  openDetailModal(complaint: Complaint): void {
    this.selectedComplaint = complaint;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedComplaint = null;
  }

  openAssignModal(complaint: Complaint): void {
    this.selectedComplaint = complaint;
    this.assignForm.reset();
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedComplaint = null;
    this.assignForm.reset();
  }

  assignComplaint(): void {
    if (!this.selectedComplaint || this.assignForm.invalid) return;
    
    const { assignedTo } = this.assignForm.value;
    
    this.adminService.updateComplaint(this.selectedComplaint._id, { assignedTo })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Complaint assigned successfully';
          this.closeAssignModal();
          this.loadComplaints();
        },
        error: (error) => {
          this.error = 'Failed to assign complaint';
        }
      });
  }

  openUpdateStatusModal(complaint: Complaint): void {
    this.selectedComplaint = complaint;
    this.updateStatusForm.patchValue({
      status: complaint.status,
      priority: complaint.priority,
      notes: ''
    });
    this.showUpdateStatusModal = true;
  }

  closeUpdateStatusModal(): void {
    this.showUpdateStatusModal = false;
    this.selectedComplaint = null;
    this.updateStatusForm.reset();
  }

  updateStatus(): void {
    if (!this.selectedComplaint || this.updateStatusForm.invalid) return;
    
    const updateData = this.updateStatusForm.value;
    
    this.adminService.updateComplaint(this.selectedComplaint._id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Complaint updated successfully';
          this.closeUpdateStatusModal();
          this.loadComplaints();
        },
        error: (error) => {
          this.error = 'Failed to update complaint';
        }
      });
  }

  deleteComplaint(complaint: Complaint): void {
    if (!confirm(`Are you sure you want to delete this complaint: "${complaint.title}"?`)) return;
    
    this.adminService.deleteComplaint(complaint._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Complaint deleted successfully';
          this.loadComplaints();
        },
        error: (error) => {
          this.error = 'Failed to delete complaint';
        }
      });
  }

  // Helper Methods
  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'pending': 'bg-warning',
      'in-progress': 'bg-info',
      'in progress': 'bg-info',
      'resolved': 'bg-success',
      'rejected': 'bg-danger'
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

  getStatusIcon(status: string): string {
    const icons: any = {
      'pending': 'bi-clock',
      'in-progress': 'bi-hourglass-split',
      'in progress': 'bi-hourglass-split',
      'resolved': 'bi-check-circle',
      'rejected': 'bi-x-circle'
    };
    return icons[status?.toLowerCase()] || 'bi-question-circle';
  }

  // Image Handling Methods
  getImageUrl(mediaURL: string): string {
    if (!mediaURL) return 'assets/placeholder-image.png';
    
    // If it's already a full URL, return as is
    if (mediaURL.startsWith('http://') || mediaURL.startsWith('https://')) {
      return mediaURL;
    }
    
    // Otherwise, construct the URL with the backend server
    const baseUrl = 'http://localhost:5000';
    // Remove leading slash if present to avoid double slashes
    const cleanPath = mediaURL.startsWith('/') ? mediaURL : `/${mediaURL}`;
    return `${baseUrl}${cleanPath}`;
  }

  onImageError(event: any): void {
    // Set a placeholder image on error
    event.target.src = 'assets/placeholder-image.png';
    event.target.alt = 'Image not available';
  }

  openImageModal(imageUrl: string): void {
    this.selectedImageUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImageUrl = '';
  }

  exportToCSV(): void {
    if (this.complaints.length === 0) {
      this.error = 'No complaints to export';
      return;
    }
    this.csvService.exportComplaints(this.complaints);
    this.success = 'Complaints exported successfully!';
    setTimeout(() => this.success = '', 3000);
  }
}
