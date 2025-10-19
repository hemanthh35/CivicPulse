import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintsService } from '../../../services/complaints.service';

@Component({
  selector: 'app-complaint-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './complaint-timeline.component.html',
  styleUrls: ['./complaint-timeline.component.scss']
})
export class ComplaintTimelineComponent implements OnInit {
  @Input() complaintId: string = '';
  
  timeline: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private complaintsService: ComplaintsService) {}

  ngOnInit(): void {
    if (this.complaintId) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;
    
    this.complaintsService.getComplaintHistory(this.complaintId).subscribe({
      next: (response) => {
        if (response.success) {
          // Combine status and assignment history into a single timeline
          const statusEvents = response.history.statusHistory.map((item: any) => ({
            type: 'status',
            status: item.status,
            user: item.changedBy,
            timestamp: item.changedAt,
            comment: item.comment,
            icon: 'bi-hourglass-split'
          }));

          const assignmentEvents = response.history.assignmentHistory.map((item: any) => ({
            type: 'assignment',
            assignedTo: item.assignedTo,
            assignedBy: item.assignedBy,
            timestamp: item.assignedAt,
            comment: item.comment,
            icon: 'bi-person-plus'
          }));

          // Combine and sort by timestamp
          this.timeline = [...statusEvents, ...assignmentEvents]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading timeline:', error);
        this.error = 'Failed to load timeline';
        this.loading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'badge bg-warning';
      case 'in-progress': return 'badge bg-info';
      case 'resolved': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }

  getEventIcon(event: any): string {
    if (event.type === 'status') {
      switch (event.status?.toLowerCase()) {
        case 'pending': return 'bi-clock-history text-warning';
        case 'in-progress': return 'bi-gear text-info';
        case 'resolved': return 'bi-check-circle text-success';
        default: return 'bi-hourglass-split text-secondary';
      }
    } else {
      return 'bi-person-plus text-primary';
    }
  }
}
