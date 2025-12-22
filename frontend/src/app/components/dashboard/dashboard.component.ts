import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ComplaintsService } from '../../services/complaints.service';
import { User } from '../../models/user.model';
import { Complaint } from '../../models/complaint.model';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  encapsulation: ViewEncapsulation.None
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
  
  // Feedback modal properties
  showFeedbackModal = false;
  selectedComplaint: Complaint | null = null;
  feedbackRating = 0;
  feedbackComment = '';
  feedbackSubmitting = false;

  // 2FA toggle
  twoFactorEnabled = false;
  toggling2FA = false;

  // Language switcher
  currentLanguage: string = 'en';
  dropdownOpen = false;
  languageNames: { [key: string]: string } = {
    'en': 'English',
    'hi': 'हिन्दी',
    'te': 'తెలుగు'
  };

  constructor(
    private authService: AuthService,
    private complaintsService: ComplaintsService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.twoFactorEnabled = this.user?.twoFactorEnabled || false;
    const savedLanguage = localStorage.getItem('language') || 'en';
    this.currentLanguage = savedLanguage;
    this.translate.setDefaultLang('en');
    this.translate.use(this.currentLanguage);
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
    return `http://localhost:5001/${cleanPath}`;
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

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bi-hourglass-split';
      case 'in-progress':
        return 'bi-tools';
      case 'resolved':
        return 'bi-check-circle';
      default:
        return 'bi-circle';
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

  openFeedbackModal(complaint: Complaint): void {
    this.selectedComplaint = complaint;
    this.feedbackRating = 0;
    this.feedbackComment = '';
    this.showFeedbackModal = true;
    document.body.classList.add('modal-open');
  }

  closeFeedbackModal(): void {
    this.showFeedbackModal = false;
    this.selectedComplaint = null;
    this.feedbackRating = 0;
    this.feedbackComment = '';
    document.body.classList.remove('modal-open');
  }

  setRating(rating: number): void {
    this.feedbackRating = rating;
  }

  submitFeedback(): void {
    if (!this.selectedComplaint || this.feedbackRating === 0) return;

    this.feedbackSubmitting = true;

    this.complaintsService.submitFeedback(
      this.selectedComplaint._id, 
      this.feedbackRating, 
      this.feedbackComment
    ).subscribe({
      next: (response) => {
        console.log('Feedback submitted successfully:', response);
        
        // Update the complaint in the list
        const index = this.userComplaints.findIndex(c => c._id === this.selectedComplaint!._id);
        if (index !== -1) {
          this.userComplaints[index].feedback = {
            rating: this.feedbackRating,
            comment: this.feedbackComment,
            submittedAt: new Date()
          };
        }
        
        this.feedbackSubmitting = false;
        this.closeFeedbackModal();
        
        // Show success message
        alert('Thank you for your feedback!');
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        this.feedbackSubmitting = false;
        alert('Failed to submit feedback. Please try again.');
      }
    });
  }

  toggle2FA(): void {
    if (this.toggling2FA) return;

    const newState = !this.twoFactorEnabled;
    const confirmMessage = newState 
      ? 'Enable Two-Factor Authentication? You will need to enter an OTP from your email on every login.'
      : 'Disable Two-Factor Authentication? Your account will be less secure.';

    if (!confirm(confirmMessage)) {
      return;
    }

    this.toggling2FA = true;

    this.authService.toggle2FA(newState).subscribe({
      next: (response) => {
        console.log('2FA Toggle Response:', response);
        if (response.success) {
          this.twoFactorEnabled = response.twoFactorEnabled;
          
          // Update user in storage
          if (this.user) {
            this.user.twoFactorEnabled = response.twoFactorEnabled;
            this.authService.storeUser(this.user);
          }

          alert(response.message);
        } else {
          alert('Failed: ' + (response.message || 'Unknown error'));
        }
        this.toggling2FA = false;
      },
      error: (error) => {
        console.error('Full Error Object:', error);
        console.error('Error Status:', error.status);
        console.error('Error Message:', error.message);
        console.error('Error Body:', error.error);
        
        let errorMsg = 'Failed to update 2FA setting. ';
        if (error.status === 401) {
          errorMsg += 'Please log in again.';
        } else if (error.status === 0) {
          errorMsg += 'Cannot connect to server. Check if backend is running.';
        } else if (error.error && error.error.message) {
          errorMsg += error.error.message;
        } else {
          errorMsg += 'Please try again.';
        }
        
        alert(errorMsg);
        this.toggling2FA = false;
      }
    });
  }

  toggleTravelFlag(): void {
    if (!this.user) return;

    const newState = !this.user.travelFlag;
    const confirmMessage = newState 
      ? 'Enable Travel Flag? Your complaints will be moderated by admin before assignment to workers.'
      : 'Disable Travel Flag? Your complaints will go directly to admin for assignment.';

    if (!confirm(confirmMessage)) {
      // Revert the checkbox
      if (this.user) {
        this.user.travelFlag = !newState;
      }
      return;
    }

    this.authService.updateProfile({ travelFlag: newState }).subscribe({
      next: (response) => {
        if (response.success && response.user) {
          this.user = response.user;
          this.authService.storeUser(this.user);
          alert(`Travel flag ${newState ? 'enabled' : 'disabled'} successfully!`);
        }
      },
      error: (error) => {
        console.error('Error updating travel flag:', error);
        alert('Failed to update travel flag. Please try again.');
        // Revert the change
        if (this.user) {
          this.user.travelFlag = !newState;
        }
      }
    });
  }

  changeLanguage(language: string): void {
    this.currentLanguage = language;
    this.translate.use(language);
    localStorage.setItem('language', language);
  }
}
