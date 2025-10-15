import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModerationQueueItem } from '../models/moderation.model';

@Injectable({
  providedIn: 'root'
})
export class ModerationService {
  private apiUrl = `${environment.apiUrl}/moderation`;
  
  constructor(private http: HttpClient) { }

  getPendingModerationItems(): Observable<{ success: boolean, count: number, moderationItems: ModerationQueueItem[] }> {
    return this.http.get<{ success: boolean, count: number, moderationItems: ModerationQueueItem[] }>(`${this.apiUrl}/pending`);
  }

  approveModerationItem(itemId: string, pointsToAward?: number): Observable<{ success: boolean, moderationItem: ModerationQueueItem }> {
    return this.http.put<{ success: boolean, moderationItem: ModerationQueueItem }>(`${this.apiUrl}/approve/${itemId}`, { pointsToAward });
  }

  rejectModerationItem(itemId: string, reason?: string): Observable<{ success: boolean, moderationItem: ModerationQueueItem }> {
    return this.http.put<{ success: boolean, moderationItem: ModerationQueueItem }>(`${this.apiUrl}/reject/${itemId}`, { reason });
  }
}
