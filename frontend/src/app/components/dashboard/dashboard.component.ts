import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ComplaintsService } from '../../services/complaints.service';
import { User } from '../../models/user.model';
import { Complaint } from '../../models/complaint.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  userComplaints: Complaint[] = [];
  complaintsLoading = false;
  complaintsStats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  };
  selectedImageUrl = '';
  selectedImageTitle = '';
  
  constructor(
    private authService: AuthService,
    private complaintsService: ComplaintsService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (this.user && this.hasRole(['citizen', 'student'])) {
      this.loadUserComplaints();
    }
  }

  hasRole(role: string | string[]): boolean {
    return this.authService.hasRole(role);
  }

  loadUserComplaints(): void {
    if (!this.user?.id) return;
    
    this.complaintsLoading = true;
    this.complaintsService.getUserComplaints(this.user.id).subscribe({
      next: (response) => {
        this.userComplaints = response.complaints;
        this.calculateStats();
        this.complaintsLoading = false;
      },
      error: (error) => {
        console.error('Error loading user complaints:', error);
        this.complaintsLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.complaintsStats = {
      total: this.userComplaints.length,
      pending: this.userComplaints.filter(c => c.status === 'pending').length,
      inProgress: this.userComplaints.filter(c => c.status === 'in-progress').length,
      resolved: this.userComplaints.filter(c => c.status === 'resolved').length
    };
  }

  getImageUrl(photoPath: string): string {
    if (!photoPath) return '';
    if (photoPath.startsWith('http')) return photoPath;
    const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
    return `http://localhost:5000/${cleanPath}`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-warning text-dark';
      case 'in-progress':
        return 'bg-info';
      case 'resolved':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-danger';
      case 'medium':
        return 'bg-warning text-dark';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  openImageModal(mediaURL: string, title: string): void {
    this.selectedImageUrl = this.getImageUrl(mediaURL);
    this.selectedImageTitle = title;
    
    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
  }
}
