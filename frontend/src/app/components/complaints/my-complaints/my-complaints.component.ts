import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintsService } from '../../../services/complaints.service';
import { AuthService } from '../../../services/auth.service';
import { Complaint } from '../../../models/complaint.model';

@Component({
  selector: 'app-my-complaints',
  templateUrl: './my-complaints.component.html',
  styleUrls: ['./my-complaints.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class MyComplaintsComponent implements OnInit {
  complaints: Complaint[] = [];
  isLoading = true;
  errorMessage = '';
  
  // Feedback modal
  showFeedbackModal = false;
  selectedComplaint: Complaint | null = null;
  feedbackRating = 0;
  feedbackComment = '';
  feedbackSubmitting = false;

  constructor(
    private complaintsService: ComplaintsService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadMyComplaints();
    
    // Check if there's a feedback query parameter
    this.route.queryParams.subscribe(params => {
      const feedbackId = params['feedback'];
      if (feedbackId) {
        setTimeout(() => {
          const complaint = this.complaints.find(c => c._id === feedbackId);
          if (complaint && complaint.status === 'resolved' && !complaint.feedback) {
            this.openFeedbackModal(complaint);
          }
        }, 1000);
      }
    });
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'bi bi-hourglass-split';
      case 'in-progress': return 'bi bi-tools';
      case 'resolved': return 'bi bi-check-circle-fill';
      case 'rejected': return 'bi bi-x-circle-fill';
      default: return 'bi bi-question-circle';
    }
  }

  getProgressPercentage(status: string): number {
    switch (status) {
      case 'pending': return 33;
      case 'in-progress': return 66;
      case 'resolved': return 100;
      default: return 0;
    }
  }

  getProgressBarClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'in-progress': return 'bg-primary';
      case 'resolved': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getProgressText(status: string): string {
    switch (status) {
      case 'pending': return 'Waiting to be processed';
      case 'in-progress': return 'Work in progress';
      case 'resolved': return 'Completed!';
      default: return 'Status unknown';
    }
  }

  getPendingCount(): number {
    return this.complaints.filter(c => c.status === 'pending').length;
  }

  getInProgressCount(): number {
    return this.complaints.filter(c => c.status === 'in-progress').length;
  }

  getResolvedCount(): number {
    return this.complaints.filter(c => c.status === 'resolved').length;
  }

  // Feedback functionality
  openFeedbackModal(complaint: Complaint): void {
    this.selectedComplaint = complaint;
    this.feedbackRating = 0;
    this.feedbackComment = '';
    this.showFeedbackModal = true;
  }

  closeFeedbackModal(): void {
    this.showFeedbackModal = false;
    this.selectedComplaint = null;
    this.feedbackRating = 0;
    this.feedbackComment = '';
  }

  setRating(rating: number): void {
    this.feedbackRating = rating;
  }

  submitFeedback(): void {
    if (!this.selectedComplaint || this.feedbackRating === 0) {
      return;
    }

    this.feedbackSubmitting = true;

    this.complaintsService.submitFeedback(
      this.selectedComplaint._id,
      this.feedbackRating,
      this.feedbackComment
    ).subscribe({
      next: (response) => {
        // Update the complaint with feedback
        const complaint = this.complaints.find(c => c._id === this.selectedComplaint!._id);
        if (complaint) {
          complaint.feedback = response.feedback;
        }
        this.feedbackSubmitting = false;
        this.closeFeedbackModal();
        alert('Thank you for your feedback!');
      },
      error: (error) => {
        this.feedbackSubmitting = false;
        alert(error.error?.message || 'Failed to submit feedback');
      }
    });
  }
}
