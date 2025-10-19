import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintsService } from '../../../services/complaints.service';
import { ComplaintTimelineComponent } from '../../shared/complaint-timeline/complaint-timeline.component';

@Component({
  selector: 'app-assigned-complaints',
  templateUrl: './assigned-complaints.component.html',
  styleUrls: ['./assigned-complaints.component.scss'],
  standalone: true,
  imports: [CommonModule, ComplaintTimelineComponent]
})
export class AssignedComplaintsComponent implements OnInit {
  complaints: any[] = [];
  isLoading = true;
  selectedImageUrl = '';
  selectedComplaintTitle = '';
  selectedComplaint: any = null;
  selectedFile: File | null = null;
  isUploading = false;

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
    this.isUploading = true;
    
    if (status === 'resolved' && this.selectedFile) {
      // Handle file upload for resolution proof
      this.complaintsService.updateComplaintStatusWithProof(complaintId, status, this.selectedFile)
        .subscribe({
          next: () => {
            this.loadAssignedComplaints();
            this.selectedFile = null;
            this.isUploading = false;
            // Close modal if it's open
            const modal = document.getElementById('complaintModal');
            if (modal) {
              (modal as any).classList.remove('show');
              document.body.classList.remove('modal-open');
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) backdrop.remove();
            }
          },
          error: (error) => {
            console.error('Error updating status with proof:', error);
            this.isUploading = false;
          }
        });
    } else {
      // Regular status update without proof
      this.complaintsService.updateComplaintStatus(complaintId, status)
        .subscribe({
          next: () => {
            this.loadAssignedComplaints();
            this.isUploading = false;
          },
          error: (error) => {
            console.error('Error updating status:', error);
            this.isUploading = false;
          }
        });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      this.selectedFile = file;
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    // Reset file input
    const fileInput = document.getElementById('resolutionProof') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
