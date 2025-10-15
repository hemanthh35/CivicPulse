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

  assignComplaint(complaintId: string, workerId: string): Observable<{ success: boolean, complaint: Complaint }> {
    return this.http.put<{ success: boolean, complaint: Complaint }>(`${this.apiUrl}/assign/${complaintId}`, { workerId });
  }

  updateComplaintStatus(complaintId: string, status: string, resolutionProof?: string): Observable<{ success: boolean, complaint: Complaint }> {
    return this.http.put<{ success: boolean, complaint: Complaint }>(`${this.apiUrl}/update/${complaintId}`, { 
      status, 
      resolutionProof 
    });
  }

  getComplaintById(complaintId: string): Observable<{ success: boolean, complaint: Complaint }> {
    return this.http.get<{ success: boolean, complaint: Complaint }>(`${this.apiUrl}/${complaintId}`);
  }
}
