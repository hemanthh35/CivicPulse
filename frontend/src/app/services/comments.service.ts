import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Comment {
  _id: string;
  complaintId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  text: string;
  userRole: string;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) { }

  getComments(complaintId: string): Observable<{success: boolean, count: number, comments: Comment[]}> {
    return this.http.get<any>(`${this.apiUrl}/${complaintId}`);
  }

  addComment(complaintId: string, text: string): Observable<{success: boolean, comment: Comment}> {
    return this.http.post<any>(`${this.apiUrl}/${complaintId}`, { text });
  }

  editComment(commentId: string, text: string): Observable<{success: boolean, comment: Comment}> {
    return this.http.put<any>(`${this.apiUrl}/${commentId}`, { text });
  }

  deleteComment(commentId: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<any>(`${this.apiUrl}/${commentId}`);
  }
}
