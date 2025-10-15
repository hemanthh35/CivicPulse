import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {

  stats = [
    { target: 2847, current: 0, label: 'Issues Reported' },
    { target: 2156, current: 0, label: 'Issues Resolved' },
    { target: 8942, current: 0, label: 'Active Citizens' },
    { target: 67, current: 0, label: 'Partner Organizations' }
  ];

  constructor(private router: Router, private elementRef: ElementRef) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.animateNumbers();
  }

  animateNumbers(): void {
    const statElements = this.elementRef.nativeElement.querySelectorAll('.stat-number');
    
    statElements.forEach((element: HTMLElement, index: number) => {
      const target = this.stats[index].target;
      const duration = 2000; // 2 seconds
      const increment = target / (duration / 16); // 60fps
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          element.textContent = target.toLocaleString();
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(current).toLocaleString();
        }
      }, 16);
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToReportIssue() {
    this.router.navigate(['/report-issue']);
  }
}