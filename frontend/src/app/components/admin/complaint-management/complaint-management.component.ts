import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintsService } from '../../../services/complaints.service';

@Component({
  selector: 'app-complaint-management',
  templateUrl: './complaint-management.component.html',
  styleUrls: ['./complaint-management.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ComplaintManagementComponent implements OnInit {
  complaints: any[] = [];
  isLoading = true;

  constructor(private complaintsService: ComplaintsService) { }

  ngOnInit(): void {
    this.loadComplaints();
  }

  loadComplaints(): void {
    this.complaintsService.getAllComplaints()
      .subscribe({
        next: (response) => {
          this.complaints = response.complaints;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading complaints:', error);
          this.isLoading = false;
        }
      });
  }

  assignComplaint(complaintId: string, workerId: string): void {
    this.complaintsService.assignComplaint(complaintId, workerId)
      .subscribe({
        next: () => {
          this.loadComplaints();
        },
        error: (error) => {
          console.error('Error assigning complaint:', error);
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'assigned': return 'bg-info';
      case 'in-progress': return 'bg-primary';
      case 'resolved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
