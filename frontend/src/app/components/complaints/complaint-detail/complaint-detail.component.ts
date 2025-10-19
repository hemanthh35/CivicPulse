import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintsService } from '../../../services/complaints.service';
import { CommentsService, Comment } from '../../../services/comments.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './complaint-detail.component.html',
  styleUrls: ['./complaint-detail.component.scss']
})
export class ComplaintDetailComponent implements OnInit {
  complaint: any = null;
  comments: Comment[] = [];
  newCommentText = '';
  isLoading = true;
  commentsLoading = false;
  submittingComment = false;
  errorMessage = '';
  currentUser: any;
  
  editingCommentId: string | null = null;
  editingCommentText = '';

  constructor(
    private route: ActivatedRoute,
    private complaintsService: ComplaintsService,
    private commentsService: CommentsService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getUser();
  }

  ngOnInit(): void {
    const complaintId = this.route.snapshot.paramMap.get('id');
    if (complaintId) {
      this.loadComplaintDetails(complaintId);
      this.loadComments(complaintId);
    }
  }

  loadComplaintDetails(complaintId: string): void {
    this.isLoading = true;
    this.complaintsService.getComplaintDetails(complaintId).subscribe({
      next: (response) => {
        if (response.success) {
          this.complaint = response.complaint;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading complaint:', error);
        this.errorMessage = 'Failed to load complaint details';
        this.isLoading = false;
      }
    });
  }

  loadComments(complaintId: string): void {
    this.commentsLoading = true;
    this.commentsService.getComments(complaintId).subscribe({
      next: (response) => {
        if (response.success) {
          this.comments = response.comments;
        }
        this.commentsLoading = false;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.commentsLoading = false;
      }
    });
  }

  submitComment(): void {
    if (!this.newCommentText.trim() || !this.complaint) return;

    this.submittingComment = true;
    this.commentsService.addComment(this.complaint._id, this.newCommentText).subscribe({
      next: (response) => {
        if (response.success) {
          this.comments.push(response.comment);
          this.newCommentText = '';
        }
        this.submittingComment = false;
      },
      error: (error) => {
        console.error('Error submitting comment:', error);
        alert('Failed to submit comment');
        this.submittingComment = false;
      }
    });
  }

  startEditComment(comment: Comment): void {
    this.editingCommentId = comment._id;
    this.editingCommentText = comment.text;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentText = '';
  }

  saveEditComment(commentId: string): void {
    if (!this.editingCommentText.trim()) return;

    this.commentsService.editComment(commentId, this.editingCommentText).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.comments.findIndex(c => c._id === commentId);
          if (index !== -1) {
            this.comments[index] = response.comment;
          }
          this.cancelEditComment();
        }
      },
      error: (error) => {
        console.error('Error editing comment:', error);
        alert('Failed to edit comment');
      }
    });
  }

  deleteComment(commentId: string): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.commentsService.deleteComment(commentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.comments = this.comments.filter(c => c._id !== commentId);
        }
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment');
      }
    });
  }

  canEditComment(comment: Comment): boolean {
    return comment.userId._id === this.currentUser?.id;
  }

  canDeleteComment(comment: Comment): boolean {
    return comment.userId._id === this.currentUser?.id || this.currentUser?.role === 'admin';
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-warning text-dark';
      case 'in-progress': return 'bg-info';
      case 'resolved': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning text-dark';
      case 'low': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bi-hourglass-split';
      case 'in-progress': return 'bi-tools';
      case 'resolved': return 'bi-check-circle-fill';
      default: return 'bi-circle';
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'worker': return 'bg-primary';
      case 'student': return 'bg-info';
      case 'citizen': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `http://localhost:5000/${cleanPath}`;
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString();
  }
}
