import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartData } from 'chart.js';
import { AdminService, AdminStats } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgChartsModule]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: AdminStats | null = null;
  loading = true;
  error = '';
  currentTime = new Date();

  // Advanced Tools Modal
  showAdvancedTools = false;
  
  // Database Management
  dbStats: any = null;
  dbLoading = false;

  // Analytics Data
  detailedAnalytics: any = null;
  analyticsLoading = false;

  // Operation Messages (shown in modal, not console)
  operationMessage = '';
  operationMessageType = ''; // 'success', 'error', 'warning'
  operationMessageIcon = '';
  
  // Chart data
  complaintsByStatusData: ChartData<'doughnut'> | null = null;
  complaintsByTypeData: ChartData<'bar'> | null = null;
  complaintsByPriorityData: ChartData<'doughnut'> | null = null;
  usersByRoleData: ChartData<'pie'> | null = null;
  trendData: ChartData<'line'> | null = null;
  peakHoursData: ChartData<'bar'> | null = null;
  locationData: ChartData<'bar'> | null = null;
  
  // Chart options
  pieChartOptions: ChartOptions<'pie'> = {};
  barChartOptions: ChartOptions<'bar'> = {};
  lineChartOptions: ChartOptions<'line'> = {};
  doughnutChartOptions: ChartOptions<'doughnut'> = {};

  // Auto-refresh
  private refreshInterval: any;

  constructor(private adminService: AdminService) {
    this.initChartOptions();
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadAnalytics();
    this.startAutoRefresh();
    
    // Update time every second
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  initChartOptions(): void {
    // Pie Chart Options
    this.pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 10,
            font: {
              size: 10,
              family: 'Inter, sans-serif'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 10,
          titleFont: { size: 11 },
          bodyFont: { size: 10 },
          cornerRadius: 6
        }
      }
    };

    // Doughnut Chart Options
    this.doughnutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 8,
            font: {
              size: 10,
              family: 'Inter, sans-serif'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 10,
          titleFont: { size: 11 },
          bodyFont: { size: 10 },
          cornerRadius: 6
        }
      }
    };

    // Bar Chart Options
    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 10,
          titleFont: { size: 11 },
          bodyFont: { size: 10 },
          cornerRadius: 6
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 10 },
            color: '#64748b'
          },
          grid: {
            color: '#f1f5f9'
          }
        },
        x: {
          ticks: {
            font: { size: 10 },
            color: '#64748b'
          },
          grid: {
            display: false
          }
        }
      }
    };

    // Line Chart Options
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            padding: 12,
            font: {
              size: 10,
              family: 'Inter, sans-serif'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 10,
          titleFont: { size: 11 },
          bodyFont: { size: 10 },
          cornerRadius: 6
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 10 },
            color: '#64748b'
          },
          grid: {
            color: '#f1f5f9'
          }
        },
        x: {
          ticks: {
            font: { size: 10 },
            color: '#64748b'
          },
          grid: {
            display: false
          }
        }
      }
    };
  }

  loadStats(): void {
    this.loading = true;
    this.adminService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.stats;
          this.prepareChartData();
          this.loadTrends(); // Load real trends data
          this.loadDbStats(); // Load database statistics
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.error = 'Failed to load statistics';
        this.loading = false;
      }
    });
  }

  loadTrends(): void {
    this.adminService.getTrends().subscribe({
      next: (response) => {
        if (response.success) {
          this.prepareTrendData(response.trends);
        }
      },
      error: (error) => {
        console.error('Error loading trends:', error);
        // Fall back to generated data if trends fail
        this.generateFallbackTrendData();
      }
    });
  }

  loadAnalytics(): void {
    this.analyticsLoading = true;
    this.adminService.getDetailedAnalytics().subscribe({
      next: (response) => {
        if (response.success) {
          this.detailedAnalytics = response.analytics;
          this.prepareAnalyticsCharts();
        }
        this.analyticsLoading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.analyticsLoading = false;
      }
    });
  }

  prepareAnalyticsCharts(): void {
    if (!this.detailedAnalytics) return;

    // Peak Hours Chart
    if (this.detailedAnalytics.peakHours) {
      const hours = this.detailedAnalytics.peakHours.map((h: any) => `${h._id}:00`);
      const counts = this.detailedAnalytics.peakHours.map((h: any) => h.count);

      this.peakHoursData = {
        labels: hours,
        datasets: [{
          label: 'Complaints',
          data: counts,
          backgroundColor: '#6366f1',
          borderColor: '#4f46e5',
          borderWidth: 1,
          borderRadius: 4
        }]
      };
    }

    // Location Distribution Chart
    if (this.detailedAnalytics.locations) {
      const cities = this.detailedAnalytics.locations.map((l: any) => l.city);
      const totals = this.detailedAnalytics.locations.map((l: any) => l.total);

      this.locationData = {
        labels: cities,
        datasets: [{
          label: 'Total Complaints',
          data: totals,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 4
        }]
      };
    }
  }

  prepareChartData(): void {
    if (!this.stats) return;

    // Complaints by Status - Doughnut Chart
    const statusLabels = Object.keys(this.stats.complaints.byStatus || {});
    const statusData = Object.values(this.stats.complaints.byStatus || {}) as number[];
    
    this.complaintsByStatusData = {
      labels: statusLabels,
      datasets: [{
        data: statusData,
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4
      }]
    };

    // Complaints by Type - Bar Chart
    const typeLabels = Object.keys(this.stats.complaints.byType || {});
    const typeData = Object.values(this.stats.complaints.byType || {}) as number[];
    
    this.complaintsByTypeData = {
      labels: typeLabels,
      datasets: [{
        label: 'Count',
        data: typeData,
        backgroundColor: '#6366f1',
        borderColor: '#4f46e5',
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 24
      }]
    };

    // Complaints by Priority - Doughnut Chart
    const priorityLabels = Object.keys(this.stats.complaints.byPriority || {});
    const priorityData = Object.values(this.stats.complaints.byPriority || {}) as number[];
    
    this.complaintsByPriorityData = {
      labels: priorityLabels,
      datasets: [{
        data: priorityData,
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4
      }]
    };

    // Users by Role - Pie Chart
    const roleLabels = Object.keys(this.stats.users.byRole || {});
    const roleData = Object.values(this.stats.users.byRole || {}) as number[];
    
    this.usersByRoleData = {
      labels: roleLabels,
      datasets: [{
        data: roleData,
        backgroundColor: ['#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4
      }]
    };
  }

  prepareTrendData(trendsData: any[]): void {
    // Use real data from backend
    const labels = trendsData.map(t => {
      const date = new Date(t.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const createdData = trendsData.map(t => t.created);
    const resolvedData = trendsData.map(t => t.resolved);
    const newUsersData = trendsData.map(t => t.newUsers);

    this.trendData = {
      labels: labels,
      datasets: [
        {
          label: 'Created',
          data: createdData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#6366f1'
        },
        {
          label: 'Resolved',
          data: resolvedData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#10b981'
        },
        {
          label: 'New Users',
          data: newUsersData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#f59e0b'
        }
      ]
    };
  }

  generateFallbackTrendData(): void {
    // Fallback to generated data if API fails
    const trendLabels = this.getLast7Days();
    const trendDataPoints = this.generateTrendData();
    
    this.trendData = {
      labels: trendLabels,
      datasets: [{
        label: 'New Complaints',
        data: trendDataPoints,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#6366f1'
      }]
    };
  }

  getLast7Days(): string[] {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
  }

  generateTrendData(): number[] {
    // Generate realistic trend data based on total complaints
    const total = this.stats?.complaints.total || 0;
    const avgPerDay = Math.ceil(total / 30); // Average per day over 30 days
    
    return Array.from({ length: 7 }, () => 
      Math.max(0, avgPerDay + Math.floor(Math.random() * 10 - 5))
    );
  }

  getStatusCount(status: string): number {
    return this.stats?.complaints.byStatus[status as keyof typeof this.stats.complaints.byStatus] || 0;
  }

  getRoleCount(role: string): number {
    return this.stats?.users.byRole[role as keyof typeof this.stats.users.byRole] || 0;
  }

  getPriorityCount(priority: string): number {
    return this.stats?.complaints.byPriority[priority as keyof typeof this.stats.complaints.byPriority] || 0;
  }

  getActiveUsersCount(): number {
    return this.stats?.users.total || 0;
  }

  getPendingComplaintsCount(): number {
    return this.getStatusCount('Pending');
  }

  getResolvedTodayCount(): number {
    // Mock calculation - would need API enhancement for real data
    return Math.floor((this.stats?.complaints.total || 0) * 0.05);
  }

  getSystemHealth(): string {
    const resolutionRate = parseFloat(this.stats?.analytics.resolutionRate || '0');
    if (resolutionRate >= 80) return 'excellent';
    if (resolutionRate >= 60) return 'good';
    if (resolutionRate >= 40) return 'fair';
    return 'poor';
  }

  getSystemHealthColor(): string {
    const health = this.getSystemHealth();
    switch (health) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#64748b';
    }
  }

  startAutoRefresh(): void {
    // Refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadStats();
    }, 300000);
  }

  refresh(): void {
    this.loadStats();
  }

  // ==========================================
  // ADVANCED TOOLS MODAL
  // ==========================================

  openAdvancedTools(): void {
    this.showAdvancedTools = true;
    this.loadDbStats();
    this.clearMessage();
  }

  closeAdvancedTools(): void {
    this.showAdvancedTools = false;
    this.clearMessage();
  }

  getHighPriorityAvgTime(): string {
    if (!this.detailedAnalytics || !this.detailedAnalytics.performance || !this.detailedAnalytics.performance.byPriority) {
      return '0.0';
    }
    const highPriority = this.detailedAnalytics.performance.byPriority.find((p: any) => p._id === 'high');
    return highPriority && highPriority.avgTime ? highPriority.avgTime.toFixed(1) : '0.0';
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.operationMessage = message;
    this.operationMessageType = type;

    if (type === 'success') {
      this.operationMessageIcon = 'bi bi-check-circle-fill';
    } else if (type === 'error') {
      this.operationMessageIcon = 'bi bi-exclamation-circle-fill';
    } else if (type === 'warning') {
      this.operationMessageIcon = 'bi bi-exclamation-triangle-fill';
    } else {
      this.operationMessageIcon = 'bi bi-info-circle-fill';
    }

    // Auto-clear message after 5 seconds (user can still see it)
    setTimeout(() => {
      // Keep the message visible unless user closes modal
    }, 5000);
  }

  private clearMessage(): void {
    this.operationMessage = '';
    this.operationMessageType = '';
    this.operationMessageIcon = '';
  }

  // ==========================================
  // DATABASE MANAGEMENT METHODS
  // ==========================================

  loadDbStats(): void {
    this.dbLoading = true;
    this.adminService.getDbStats().subscribe({
      next: (response) => {
        this.dbStats = response;
        this.dbLoading = false;
      },
      error: (err) => {
        this.dbLoading = false;
        this.showMessage(`❌ Error loading database stats: ${err.error?.message || err.message}`, 'error');
      }
    });
  }

  confirmDropComplaints(): void {
    const count = this.dbStats?.stats?.complaints || 0;
    const confirmed = confirm(
      `⚠️ WARNING: DELETE ALL ${count} COMPLAINTS?\n\nType "DELETE_COMPLAINTS" in the next prompt to confirm.`
    );
    
    if (confirmed) {
      const userInput = prompt('Type "DELETE_COMPLAINTS" to confirm:');
      if (userInput === 'DELETE_COMPLAINTS') {
        this.dropComplaints();
      } else {
        this.showMessage('❌ Confirmation text did not match. Operation cancelled.', 'error');
      }
    }
  }

  confirmDropUsers(): void {
    const count = this.dbStats?.stats?.users || 0;
    const confirmed = confirm(
      `⚠️ WARNING: DELETE ALL ${count} NON-ADMIN USERS?\n\nType "DELETE_USERS" in the next prompt to confirm.`
    );
    
    if (confirmed) {
      const userInput = prompt('Type "DELETE_USERS" to confirm:');
      if (userInput === 'DELETE_USERS') {
        this.dropUsers();
      } else {
        this.showMessage('❌ Confirmation text did not match. Operation cancelled.', 'error');
      }
    }
  }

  confirmDropModeration(): void {
    const count = this.dbStats?.stats?.moderationReports || 0;
    const confirmed = confirm(
      `⚠️ WARNING: DELETE ALL ${count} MODERATION REPORTS?\n\nType "DELETE_MODERATION" in the next prompt to confirm.`
    );
    
    if (confirmed) {
      const userInput = prompt('Type "DELETE_MODERATION" to confirm:');
      if (userInput === 'DELETE_MODERATION') {
        this.dropModeration();
      } else {
        this.showMessage('❌ Confirmation text did not match. Operation cancelled.', 'error');
      }
    }
  }

  confirmDropAllData(): void {
    const users = this.dbStats?.stats?.users || 0;
    const complaints = this.dbStats?.stats?.complaints || 0;
    const moderation = this.dbStats?.stats?.moderationReports || 0;

    const confirmed = confirm(
      `🚨 CRITICAL: DELETE ENTIRE DATABASE?\n\nUsers: ${users}\nComplaints: ${complaints}\nModeration: ${moderation}\n\nType "DROP_EVERYTHING" in the next prompt to confirm.`
    );
    
    if (confirmed) {
      const userInput = prompt('Type "DROP_EVERYTHING" to confirm total database wipe:');
      if (userInput === 'DROP_EVERYTHING') {
        const finalConfirm = confirm('ARE YOU ABSOLUTELY SURE? This is IRREVERSIBLE! Press OK to proceed.');
        if (finalConfirm) {
          this.dropAllData();
        } else {
          this.showMessage('❌ Final confirmation cancelled. Operation aborted.', 'warning');
        }
      } else {
        this.showMessage('❌ Confirmation text did not match. Operation cancelled.', 'error');
      }
    }
  }

  private dropComplaints(): void {
    this.dbLoading = true;
    this.adminService.dropComplaints().subscribe({
      next: (response) => {
        const deleted = response.summary?.complaintsDeleted || 0;
        this.showMessage(`✅ SUCCESS! ${deleted} complaints permanently deleted.`, 'success');
        this.loadDbStats();
        this.loadStats();
      },
      error: (err) => {
        this.dbLoading = false;
        this.showMessage(`❌ Error: ${err.error?.message || err.message}`, 'error');
      }
    });
  }

  private dropUsers(): void {
    this.dbLoading = true;
    this.adminService.dropUsers().subscribe({
      next: (response) => {
        const deleted = response.summary?.usersDeleted || 0;
        this.showMessage(`✅ SUCCESS! ${deleted} non-admin users permanently deleted.`, 'success');
        this.loadDbStats();
        this.loadStats();
      },
      error: (err) => {
        this.dbLoading = false;
        this.showMessage(`❌ Error: ${err.error?.message || err.message}`, 'error');
      }
    });
  }

  private dropModeration(): void {
    this.dbLoading = true;
    this.adminService.dropModeration().subscribe({
      next: (response) => {
        const deleted = response.summary?.moderationDeleted || 0;
        this.showMessage(`✅ SUCCESS! ${deleted} moderation reports permanently deleted.`, 'success');
        this.loadDbStats();
        this.loadStats();
      },
      error: (err) => {
        this.dbLoading = false;
        this.showMessage(`❌ Error: ${err.error?.message || err.message}`, 'error');
      }
    });
  }

  private dropAllData(): void {
    this.dbLoading = true;
    this.adminService.dropAllData().subscribe({
      next: (response) => {
        const summary = response.summary || {};
        this.showMessage(
          `🚨 DATABASE CLEARED!\n\nDeleted:\n• Users: ${summary.users || 0}\n• Complaints: ${summary.complaints || 0}\n• Moderation: ${summary.moderation || 0}\n\nAll data has been permanently removed.`,
          'warning'
        );
        this.loadDbStats();
        this.loadStats();
      },
      error: (err) => {
        this.dbLoading = false;
        this.showMessage(`❌ Error: ${err.error?.message || err.message}`, 'error');
      }
    });
  }
}
