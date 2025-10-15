import { Component, ChangeDetectorRef, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'CivicPulse';
  user: User | null = null;
  dropdownOpen = false;
  
  constructor(
    private authService: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.checkLoggedInStatus();
  }

  ngAfterViewInit() {
    // Detect changes after view initialization to prevent ExpressionChangedAfterItHasBeenCheckedError
    this.cdr.detectChanges();
  }

  checkLoggedInStatus() {
    if (this.authService.isLoggedIn()) {
      this.user = this.authService.getUser();
    }
  }

  logout() {
    this.authService.logout();
    this.user = null;
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  hasRole(role: string | string[]): boolean {
    return this.authService.hasRole(role);
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.dropdownOpen = !this.dropdownOpen;
    const dropdownElement = document.getElementById('userDropdownMenu');
    
    if (dropdownElement) {
      if (this.dropdownOpen) {
        dropdownElement.classList.add('show');
      } else {
        dropdownElement.classList.remove('show');
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('userDropdownMenu');
    
    // Close dropdown if clicking outside
    if (dropdown && dropdownMenu && 
        !dropdown.contains(target) && !dropdownMenu.contains(target)) {
      this.dropdownOpen = false;
      dropdownMenu.classList.remove('show');
    }
  }
}
