import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminStats {
  users: {
    total: number;
    byRole: {
      citizen?: number;
      student?: number;
      worker?: number;
      admin?: number;
    };
  };
  complaints: {
    total: number;
    byStatus: {
      Pending?: number;
      'In Progress'?: number;
      Resolved?: number;
    };
    byType: any;
    byPriority: any;
  };
  analytics: {
    avgResponseTime: number;
    resolutionRate: string;
  };
  recentActivity: {
    complaints: any[];
    users: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  getStats(): Observable<{ success: boolean; stats: AdminStats }> {
    return this.http.get<{ success: boolean; stats: AdminStats }>(`${this.apiUrl}/stats`);
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  getAllUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, { params: params as any });
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  suspendUser(id: string, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/suspend`, { reason });
  }

  activateUser(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/activate`, {});
  }

  // ==========================================
  // COMPLAINT MANAGEMENT
  // ==========================================

  getAllComplaints(params?: {
    status?: string;
    type?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/complaints`, { params: params as any });
  }

  updateComplaint(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/complaints/${id}`, data);
  }

  deleteComplaint(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/complaints/${id}`);
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  getTrends(): Observable<{ success: boolean; trends: any[]; summary: any }> {
    return this.http.get<{ success: boolean; trends: any[]; summary: any }>(`${this.apiUrl}/analytics/trends`);
  }

  // ==========================================
  // DATABASE MANAGEMENT
  // ==========================================

  getDbStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/db/stats`);
  }

  dropAllData(): Observable<any> {
    return this.http.post(`${this.apiUrl}/db/drop-all`, { 
      confirmation: 'DROP_ALL_DATA_CONFIRMED' 
    });
  }

  dropComplaints(): Observable<any> {
    return this.http.post(`${this.apiUrl}/db/drop-complaints`, { 
      confirmation: 'DROP_COMPLAINTS_CONFIRMED' 
    });
  }

  dropUsers(): Observable<any> {
    return this.http.post(`${this.apiUrl}/db/drop-users`, { 
      confirmation: 'DROP_USERS_CONFIRMED' 
    });
  }

  dropModeration(): Observable<any> {
    return this.http.post(`${this.apiUrl}/db/drop-moderation`, { 
      confirmation: 'DROP_MODERATION_CONFIRMED' 
    });
  }

  // ==========================================
  // MODERATION
  // ==========================================

  getModerationReports(params?: {
    status?: string;
    severity?: string;
    reason?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/moderation`, { params: params as any });
  }

  getModerationReportById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/moderation/${id}`);
  }

  approveModerationReport(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/moderation/${id}/approve`, data);
  }

  rejectModerationReport(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/moderation/${id}/reject`, data);
  }

  bulkApproveModerationReports(ids: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/moderation/bulk-approve`, { ids });
  }

  bulkRejectModerationReports(ids: string[], data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/moderation/bulk-reject`, { ids, ...data });
  }

  getModerationStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/moderation/stats/summary`);
  }

  // ==========================================
  // WORKER PERFORMANCE
  // ==========================================

  getWorkerPerformance(): Observable<{
    success: boolean;
    data: {
      workers: any[];
      summary: any;
    }
  }> {
    return this.http.get<{
      success: boolean;
      data: {
        workers: any[];
        summary: any;
      }
    }>(`${this.apiUrl}/workers/performance`);
  }

  // ==========================================
  // DETAILED ANALYTICS
  // ==========================================

  getDetailedAnalytics(): Observable<{
    success: boolean;
    analytics: {
      trends: any;
      performance: any;
      workers: any[];
      peakHours: any[];
      locations: any[];
      summary: any;
    }
  }> {
    return this.http.get<{
      success: boolean;
      analytics: {
        trends: any;
        performance: any;
        workers: any[];
        peakHours: any[];
        locations: any[];
        summary: any;
      }
    }>(`${this.apiUrl}/analytics/detailed`);
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  bulkAssignComplaints(complaintIds: string[], workerId?: string, distributionMethod?: string): Observable<{
    success: boolean;
    message: string;
    results: any[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    }
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      results: any[];
      summary: {
        total: number;
        successful: number;
        failed: number;
      }
    }>(`${this.apiUrl}/complaints/bulk-assign`, {
      complaintIds,
      workerId,
      distributionMethod
    });
  }
}
