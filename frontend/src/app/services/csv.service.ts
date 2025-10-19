import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  constructor() { }

  /**
   * Export data to CSV file
   * @param data Array of objects to export
   * @param filename Name of the CSV file
   * @param headers Optional custom headers (if not provided, uses object keys)
   */
  exportToCsv(data: any[], filename: string, headers?: string[]): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = csvHeaders.join(',') + '\n';
    
    data.forEach(row => {
      const values = csvHeaders.map(header => {
        const value = row[header];
        // Handle nested objects (like location.address)
        if (header.includes('.')) {
          const keys = header.split('.');
          let val = row;
          for (const key of keys) {
            val = val?.[key];
          }
          return this.escapeCsvValue(val);
        }
        return this.escapeCsvValue(value);
      });
      csvContent += values.join(',') + '\n';
    });

    // Download file
    this.downloadFile(csvContent, filename);
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue = String(value);

    // Check if value contains special characters
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      // Escape quotes by doubling them
      stringValue = stringValue.replace(/"/g, '""');
      // Wrap in quotes
      stringValue = `"${stringValue}"`;
    }

    return stringValue;
  }

  /**
   * Download file to user's computer
   */
  private downloadFile(content: string, filename: string): void {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    
    element.href = URL.createObjectURL(file);
    element.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Export complaints data
   */
  exportComplaints(complaints: any[]): void {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Category',
      'Priority',
      'Status',
      'Location',
      'Reporter',
      'Assigned To',
      'Created Date',
      'Updated Date'
    ];

    const data = complaints.map(complaint => ({
      'ID': complaint._id,
      'Title': complaint.title,
      'Description': complaint.description,
      'Category': complaint.category,
      'Priority': complaint.priority || 'N/A',
      'Status': complaint.status,
      'Location': `${complaint.location?.address}, ${complaint.location?.city}`,
      'Reporter': `${complaint.reportedBy?.firstName} ${complaint.reportedBy?.lastName}`,
      'Assigned To': complaint.assignedTo ? `${complaint.assignedTo.firstName} ${complaint.assignedTo.lastName}` : 'Unassigned',
      'Created Date': new Date(complaint.createdAt).toLocaleString(),
      'Updated Date': new Date(complaint.updatedAt).toLocaleString()
    }));

    this.exportToCsv(data, 'complaints', headers);
  }

  /**
   * Export users data
   */
  exportUsers(users: any[]): void {
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'Status',
      'Points',
      'Created Date',
      'Last Login'
    ];

    const data = users.map(user => ({
      'ID': user._id,
      'Name': `${user.firstName} ${user.lastName}`,
      'Email': user.email,
      'Phone': user.phone || 'N/A',
      'Role': user.role,
      'Status': user.isActive ? 'Active' : 'Suspended',
      'Points': user.points || 0,
      'Created Date': new Date(user.createdAt).toLocaleString(),
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
    }));

    this.exportToCsv(data, 'users', headers);
  }

  /**
   * Export moderation reports
   */
  exportModerationReports(reports: any[]): void {
    const headers = [
      'ID',
      'Complaint',
      'Report Type',
      'Reason',
      'Status',
      'Reported By',
      'Action Taken',
      'Created Date'
    ];

    const data = reports.map(report => ({
      'ID': report._id,
      'Complaint': report.complaintId?.title || 'N/A',
      'Report Type': report.reportType,
      'Reason': report.reason,
      'Status': report.status,
      'Reported By': report.reportedBy ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}` : 'N/A',
      'Action Taken': report.actionTaken || 'Pending',
      'Created Date': new Date(report.createdAt).toLocaleString()
    }));

    this.exportToCsv(data, 'moderation-reports', headers);
  }
}
