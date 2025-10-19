import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Complaint } from '../models/complaint.model';

@Injectable({
  providedIn: 'root'
})
export class ComplaintsService {
  private apiUrl = `${environment.apiUrl}/complaints`;
  
  constructor(private http: HttpClient) { }

  createComplaint(complaintData: FormData | Partial<Complaint>): Observable<{ success: boolean, complaint: Complaint }> {
    return this.http.post<{ success: boolean, complaint: Complaint }>(`${this.apiUrl}/create`, complaintData);
  }

  getUserComplaints(userId: string): Observable<{ success: boolean, count: number, complaints: Complaint[] }> {
    return this.http.get<{ success: boolean, count: number, complaints: Complaint[] }>(`${this.apiUrl}/user/${userId}`);
  }

  getAllComplaints(filters?: any): Observable<{ success: boolean, count: number, complaints: Complaint[] }> {
    let queryParams = '';
    
    if (filters) {
      const params = [];
      
      if (filters.status) params.push(`status=${filters.status}`);
      if (filters.type) params.push(`type=${filters.type}`);
      if (filters.startDate) params.push(`startDate=${filters.startDate}`);
      if (filters.endDate) params.push(`endDate=${filters.endDate}`);
      
      if (params.length > 0) {
        queryParams = `?${params.join('&')}`;
      }
    }
    
    return this.http.get<{ success: boolean, count: number, complaints: Complaint[] }>(`${this.apiUrl}/all${queryParams}`);
  }

  getWorkerComplaints(): Observable<{ success: boolean, count: number, complaints: Complaint[] }> {
    return this.http.get<{ success: boolean, count: number, complaints: Complaint[] }>(`${this.apiUrl}/worker`);
  }

  getWorkerStats(): Observable<{
    success: boolean;
    stats: {
      totalAssigned: number;
      pending: number;
      inProgress: number;
      resolved: number;
      completionRate: string;
      recentAssignments: number;
      avgCompletionTime: string;
      overallRating?: number;
      ratedComplaints?: number;
    }
  }> {
    return this.http.get<any>(`${this.apiUrl}/worker/stats`);
  }

  assignComplaint(complaintId: string, workerId: string): Observable<{ success: boolean, complaint: Complaint }> {
    return this.http.put<{ success: boolean, complaint: Complaint }>(`${this.apiUrl}/assign/${complaintId}`, { workerId });
  }

  updateComplaintStatus(complaintId: string, status: string, resolutionProof?: string): Observable<{ success: boolean, complaint: Complaint }> {
    return this.http.put<{ success: boolean, complaint: Complaint }>(`${this.apiUrl}/update/${complaintId}`, { 
      status, 
      resolutionProof 
    });
  }

  updateComplaintStatusWithProof(complaintId: string, status: string, file: File): Observable<{ success: boolean, complaint: Complaint }> {
    const formData = new FormData();
    formData.append('status', status);
    formData.append('resolutionProof', file);

    return this.http.put<{ success: boolean, complaint: Complaint }>(`${this.apiUrl}/update/${complaintId}`, formData);
  }

  getComplaintById(complaintId: string): Observable<{ success: boolean, complaint: Complaint }> {
    return this.http.get<{ success: boolean, complaint: Complaint }>(`${this.apiUrl}/${complaintId}`);
  }

  submitFeedback(complaintId: string, rating: number, comment: string): Observable<{ success: boolean, message: string, feedback: any }> {
    return this.http.post<{ success: boolean, message: string, feedback: any }>(`${this.apiUrl}/${complaintId}/feedback`, {
      rating,
      comment
    });
  }

  getComplaintHistory(complaintId: string): Observable<{
    success: boolean;
    history: {
      statusHistory: any[];
      assignmentHistory: any[];
      createdAt: Date;
      resolvedAt?: Date;
      currentStatus: string;
      currentAssignee: any;
    }
  }> {
    return this.http.get<any>(`${this.apiUrl}/${complaintId}/history`);
  }

  getWorkerAnalytics(): Observable<{
    success: boolean;
    analytics: {
      byType: { _id: string; count: number; }[];
      byPriority: { _id: string; count: number; avgResolutionTime: number; }[];
      dailyTrends: { date: string; created: number; resolved: number; }[];
      resolutionTime: { avg: number; min: number; max: number; };
      monthlyPerformance: { month: string; resolved: number; avgTime: number; }[];
    }
  }> {
    return this.http.get<any>(`${this.apiUrl}/worker/analytics`);
  }

  // New Citizen Features
  getComplaintDetails(complaintId: string): Observable<{
    success: boolean;
    complaint: Complaint;
    workerStats: any;
  }> {
    return this.http.get<any>(`${this.apiUrl}/${complaintId}/details`);
  }

  addComment(complaintId: string, text: string): Observable<{
    success: boolean;
    message: string;
    comment: any;
    complaint: Complaint;
  }> {
    return this.http.post<any>(`${this.apiUrl}/${complaintId}/comments`, { text });
  }

  getComments(complaintId: string): Observable<{
    success: boolean;
    comments: any[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/${complaintId}/comments`);
  }

  addMedia(complaintId: string, files: File[]): Observable<{
    success: boolean;
    message: string;
    mediaURLs: string[];
    allMedia: string[];
  }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    return this.http.post<any>(`${this.apiUrl}/${complaintId}/media`, formData);
  }

  searchAdvanced(params: {
    q?: string;
    status?: string;
    type?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    myComplaints?: boolean;
    page?: number;
    limit?: number;
  }): Observable<{
    success: boolean;
    complaints: Complaint[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof typeof params];
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.http.get<any>(`${this.apiUrl}/search/advanced?${queryParams.toString()}`);
  }

  getNearbyComplaints(lat: number, lng: number, radius?: number): Observable<{
    success: boolean;
    count: number;
    complaints: Complaint[];
  }> {
    const radiusParam = radius ? `?radius=${radius}` : '';
    return this.http.get<any>(`${this.apiUrl}/nearby/${lat}/${lng}${radiusParam}`);
  }
}
