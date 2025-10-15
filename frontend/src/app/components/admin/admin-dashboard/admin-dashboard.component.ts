import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    totalUsers: 0
  };

  constructor() { }

  ngOnInit(): void {
    // Mock data for now
    this.stats = {
      totalComplaints: 150,
      pendingComplaints: 25,
      resolvedComplaints: 120,
      totalUsers: 500
    };
  }
}
