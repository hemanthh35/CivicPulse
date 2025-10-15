import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintsService } from '../../../services/complaints.service';

@Component({
  selector: 'app-assigned-complaints',
  templateUrl: './assigned-complaints.component.html',
  styleUrls: ['./assigned-complaints.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AssignedComplaintsComponent implements OnInit {
  complaints: any[] = [];
  isLoading = true;
  selectedImageUrl = '';
  selectedComplaintTitle = '';
  selectedComplaint: any = null;

  constructor(private complaintsService: ComplaintsService) { }

  ngOnInit(): void {
    this.loadAssignedComplaints();
  }

  loadAssignedComplaints(): void {
    console.log('🔍 Loading worker complaints...');
    this.complaintsService.getWorkerComplaints()
      .subscribe({
        next: (response) => {
          console.log('✅ Worker complaints response:', response);
          this.complaints = response.complaints;
          this.isLoading = false;
          console.log('📋 Total complaints:', this.complaints.length);
        },
        error: (error) => {
          console.error('❌ Error loading assigned complaints:', error);
          console.error('Error details:', error.error);
          this.isLoading = false;
        }
      });
  }

  updateStatus(complaintId: string, status: string): void {
    this.complaintsService.updateComplaintStatus(complaintId, status)
      .subscribe({
        next: () => {
          this.loadAssignedComplaints();
        },
        error: (error) => {
          console.error('Error updating status:', error);
        }
      });
  }

  getImageUrl(photoPath: string): string {
    if (!photoPath) {
      return '';
    }
    
    // If it's already a full URL, return as is
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
    
    // Construct the full URL with the backend base URL
    return `http://localhost:5000/${cleanPath}`;
  }

  openImageModal(photoPath: string, title: string): void {
    this.selectedImageUrl = this.getImageUrl(photoPath);
    this.selectedComplaintTitle = title;
    
    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-danger';
      case 'medium':
        return 'bg-warning';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  viewComplaintDetails(complaint: any): void {
    this.selectedComplaint = complaint;
    
    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
  }

  onImageError(event: any): void {
    // You can add additional error handling here
    event.target.style.display = 'none';
  }

  onImageLoad(event: any): void {
    // Image loaded successfully
  }

  onModalImageError(event: any): void {
    // Hide the failed image
    event.target.style.display = 'none';
    
    // Show error message by replacing the image with a placeholder
    const parent = event.target.parentElement;
    if (parent) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'text-center p-5 bg-light rounded';
      errorDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
        <p class="text-muted">Failed to load image</p>
      `;
      parent.appendChild(errorDiv);
    }
  }
}
