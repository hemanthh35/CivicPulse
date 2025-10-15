import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplaintsService } from '../../../services/complaints.service';
import { AuthService } from '../../../services/auth.service';
import { Complaint } from '../../../models/complaint.model';

@Component({
  selector: 'app-my-complaints',
  templateUrl: './my-complaints.component.html',
  styleUrls: ['./my-complaints.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class MyComplaintsComponent implements OnInit {
  complaints: Complaint[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private complaintsService: ComplaintsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadMyComplaints();
  }

  loadMyComplaints(): void {
    const user = this.authService.getUser();
    if (user) {
      this.complaintsService.getUserComplaints(user.id)
        .subscribe({
          next: (response) => {
            this.complaints = response.complaints;
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = 'Failed to load your complaints';
            this.isLoading = false;
          }
        });
    }
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

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'low': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'high': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
