import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  
  constructor(private http: HttpClient) {
    const storedUser = this.getUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(name: string, email: string, password: string, role: string = 'citizen', mobile?: string, location?: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      name,
      email,
      password,
      role,
      mobile,
      location
    });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    });
  }

  verifyOTP(userId: string, otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-otp`, {
      userId,
      otp
    });
  }

  resendOTP(userId: string): Observable<{ success: boolean, message: string }> {
    return this.http.post<{ success: boolean, message: string }>(`${this.apiUrl}/resend-otp`, {
      userId
    });
  }

  getProfile(): Observable<{ success: boolean, user: User }> {
    return this.http.get<{ success: boolean, user: User }>(`${this.apiUrl}/profile`);
  }

  updateProfile(userData: Partial<User>): Observable<{ success: boolean, user: User }> {
    return this.http.put<{ success: boolean, user: User }>(`${this.apiUrl}/profile`, userData);
  }

  storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string | string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }

  toggle2FA(enabled: boolean): Observable<{ success: boolean, message: string, twoFactorEnabled: boolean }> {
    return this.http.put<{ success: boolean, message: string, twoFactorEnabled: boolean }>(
      `${this.apiUrl}/toggle-2fa`,
      { enabled }
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  updateWorkerSettings(settings: any): Observable<{ success: boolean, user: User, message: string }> {
    return this.http.put<{ success: boolean, user: User, message: string }>(
      `${this.apiUrl}/worker/settings`,
      settings
    ).pipe(
      map(response => {
        if (response.success && response.user) {
          this.storeUser(response.user);
        }
        return response;
      })
    );
  }
}
