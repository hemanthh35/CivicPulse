import { Component, OnInit, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {

  // Statistics with icons and percentages
  stats = [
    { target: 2847, current: 0, label: 'Issues Reported', icon: '📋', percentage: 85 },
    { target: 2156, current: 0, label: 'Issues Resolved', icon: '✅', percentage: 76 },
    { target: 8942, current: 0, label: 'Active Citizens', icon: '👥', percentage: 92 },
    { target: 67, current: 0, label: 'Partner Organizations', icon: '🏢', percentage: 45 }
  ];

  // Features data
  features = [
    {
      icon: '📢',
      title: 'Report Issues',
      description: 'Easily submit civic issues with photos, location, and detailed descriptions. Our smart system categorizes and routes your reports automatically.'
    },
    {
      icon: '📍',
      title: 'Track Progress',
      description: 'Monitor your reported issues in real-time. Get instant notifications when status changes and see estimated resolution times.'
    },
    {
      icon: '🏆',
      title: 'Earn Rewards',
      description: 'Build your civic reputation! Earn badges, climb the leaderboard, and unlock achievements for your community contributions.'
    },
    {
      icon: '🤝',
      title: 'Community Power',
      description: 'Upvote issues that matter. Join forces with fellow citizens to prioritize critical problems and drive faster resolutions.'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Access detailed insights about your area. View trends, resolution rates, and community performance statistics.'
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Stay informed with personalized alerts. Know when nearby issues are reported or when your concerns are addressed.'
    }
  ];

  // Categories data
  categories = [
    { icon: '🛣️', name: 'Roads', count: 845 },
    { icon: '💡', name: 'Lighting', count: 432 },
    { icon: '🗑️', name: 'Sanitation', count: 678 },
    { icon: '🌳', name: 'Parks', count: 256 },
    { icon: '💧', name: 'Water', count: 389 },
    { icon: '⚡', name: 'Utilities', count: 247 }
  ];

  // Testimonials data
  testimonials = [
    {
      text: 'CivicPulse transformed how our neighborhood handles issues. Within 48 hours of my first report, the pothole that had been there for months was fixed!',
      name: 'Priya Sharma',
      role: 'Community Leader',
      avatarColor: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
      text: 'As a municipal worker, this platform has streamlined our workflow immensely. We can now prioritize issues based on community votes and respond faster.',
      name: 'Rajesh Kumar',
      role: 'Municipal Corporation',
      avatarColor: 'linear-gradient(135deg, #4ECDC4, #44A08D)'
    },
    {
      text: 'The gamification aspect is brilliant! My family now competes to report and verify issues. We have made a real difference in our locality.',
      name: 'Anita Desai',
      role: 'Active Citizen',
      avatarColor: 'linear-gradient(135deg, #FF6B6B, #FF8E53)'
    }
  ];

  private animationTriggered = false;

  constructor(private router: Router, private elementRef: ElementRef, private translate: TranslateService) { }

  ngOnInit(): void {
    // Initialize language from localStorage
    const savedLanguage = localStorage.getItem('language') || 'en';
    this.translate.use(savedLanguage);
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    this.checkStatsVisibility();
  }

  setupIntersectionObserver(): void {
    // Animate elements when they come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
        }
      });
    }, { threshold: 0.1 });

    // Observe all animatable elements
    const elements = this.elementRef.nativeElement.querySelectorAll('.feature-card, .stat-card, .category-card, .testimonial-card');
    elements.forEach((el: Element) => observer.observe(el));
  }

  checkStatsVisibility(): void {
    if (this.animationTriggered) return;

    const statsSection = this.elementRef.nativeElement.querySelector('.stats-section');
    if (!statsSection) return;

    const rect = statsSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;

    if (isVisible) {
      this.animationTriggered = true;
      this.animateNumbers();
    }
  }

  animateNumbers(): void {
    const duration = 2000; // 2 seconds
    const frameRate = 16; // ~60fps
    const totalFrames = duration / frameRate;

    this.stats.forEach((stat, index) => {
      let frame = 0;
      const increment = stat.target / totalFrames;

      const timer = setInterval(() => {
        frame++;
        stat.current = Math.min(Math.floor(increment * frame), stat.target);

        if (frame >= totalFrames) {
          stat.current = stat.target;
          clearInterval(timer);
        }
      }, frameRate);
    });
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