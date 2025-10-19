import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Notification {
  _id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedComplaintId?: {
    _id: string;
    title: string;
    type: string;
    status: string;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUnreadCount();
  }

  getNotifications(unreadOnly: boolean = false, page: number = 1, limit: number = 20): Observable<any> {
    const params: any = { page, limit };
    if (unreadOnly) params.unreadOnly = 'true';
    return this.http.get<any>(this.apiUrl, { params });
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => this.loadUnreadCount())
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => this.loadUnreadCount())
    );
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => this.loadUnreadCount())
    );
  }

  loadUnreadCount(): void {
    this.http.get<any>(`${this.apiUrl}/unread-count`).subscribe({
      next: (response) => {
        if (response.success) {
          this.unreadCountSubject.next(response.count);
        }
      },
      error: (error) => console.error('Error loading unread count:', error)
    });
  }

  getUnreadCount(): Observable<{success: boolean, count: number}> {
    return this.http.get<any>(`${this.apiUrl}/unread-count`);
  }
}
