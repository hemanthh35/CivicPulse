import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HomeComponent implements OnInit, AfterViewInit {

  stats = [
    { target: 2847, current: 0, label: 'Issues Reported' },
    { target: 2156, current: 0, label: 'Issues Resolved' },
    { target: 8942, current: 0, label: 'Active Citizens' },
    { target: 67, current: 0, label: 'Partner Organizations' }
  ];

  benefits = [
    {
      icon: 'bi-lightning-charge-fill',
      title: 'Lightning Fast Response',
      description: 'Get immediate acknowledgment and real-time tracking of your reported issues.'
    },
    {
      icon: 'bi-shield-check',
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected with industry-leading security measures.'
    },
    {
      icon: 'bi-graph-up-arrow',
      title: 'Track Progress',
      description: 'Monitor every step from submission to resolution with detailed updates.'
    },
    {
      icon: 'bi-award-fill',
      title: 'Earn Recognition',
      description: 'Get rewarded for your civic contributions with badges and points.'
    }
  ];

  constructor(private router: Router, private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.initAOS();
  }

  ngAfterViewInit(): void {
    this.animateNumbers();
  }

  initAOS(): void {
    // Initialize AOS (Animate On Scroll) library
    if (typeof window !== 'undefined') {
      import('aos').then(AOS => {
        AOS.init({
          duration: 1000,
          once: true,
          offset: 100,
          easing: 'ease-out-cubic'
        });
      });
    }
  }

  animateNumbers(): void {
    const statElements = this.elementRef.nativeElement.querySelectorAll('.stat-number');
    
    // Use Intersection Observer to trigger animation when visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Array.from(statElements).indexOf(entry.target);
          this.animateSingleNumber(entry.target as HTMLElement, this.stats[index].target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statElements.forEach((element: Element) => {
      observer.observe(element);
    });
  }

  animateSingleNumber(element: HTMLElement, target: number): void {
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target.toLocaleString();
        this.stats.find(s => s.target === target)!.current = target;
        clearInterval(timer);
      } else {
        const value = Math.floor(current);
        element.textContent = value.toLocaleString();
        this.stats.find(s => s.target === target)!.current = value;
      }
    }, 16);
  }

  getStatIcon(index: number): string {
    const icons = [
      'bi-flag-fill',
      'bi-check-circle-fill',
      'bi-people-fill',
      'bi-building-fill'
    ];
    return icons[index];
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToReportIssue(): void {
    this.router.navigate(['/report-issue']);
  }
}