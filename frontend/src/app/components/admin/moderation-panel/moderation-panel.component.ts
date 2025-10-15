import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-moderation-panel',
  templateUrl: './moderation-panel.component.html',
  styleUrls: ['./moderation-panel.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ModerationPanelComponent implements OnInit {
  pendingReports: any[] = [];
  isLoading = true;

  constructor() { }

  ngOnInit(): void {
    // Mock data for now
    this.pendingReports = [
      {
        id: 1,
        type: 'complaint',
        title: 'Inappropriate content reported',
        description: 'User reported inappropriate language in complaint description',
        reportedBy: 'John Doe',
        createdAt: new Date()
      }
    ];
    this.isLoading = false;
  }

  approveReport(reportId: number): void {
    // Implementation for approving report
    console.log('Approving report:', reportId);
  }

  rejectReport(reportId: number): void {
    // Implementation for rejecting report
    console.log('Rejecting report:', reportId);
  }
}
