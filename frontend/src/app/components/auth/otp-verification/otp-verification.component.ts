import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.scss']
})
export class OtpVerificationComponent implements OnInit {
  otp = '';
  userId = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  resendingOTP = false;
  countdown = 60;
  canResend = false;
  private countdownInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get userId from navigation state or query params
    const navigation = history.state;
    if (navigation && navigation.userId) {
      this.userId = navigation.userId;
    } else {
      this.route.queryParams.subscribe(params => {
        if (params['userId']) {
          this.userId = params['userId'];
        } else {
          // If no userId, redirect to login
          this.router.navigate(['/login']);
        }
      });
    }

    // Start countdown for resend
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.canResend = false;
    this.countdown = 60;
    
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.canResend = true;
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  verifyOTP(): void {
    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyOTP(this.userId, this.otp).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'OTP verified successfully! Redirecting...';
        
        // Save token and user data using AuthService methods
        if (response.token && response.user) {
          this.authService.storeToken(response.token);
          this.authService.storeUser(response.user);
          
          // Redirect to dashboard immediately
          setTimeout(() => {
            window.location.href = '/dashboard'; // Force full page reload to ensure auth state is updated
          }, 1000);
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Invalid or expired OTP. Please try again.';
      }
    });
  }

  resendOTP(): void {
    if (!this.canResend) {
      return;
    }

    this.resendingOTP = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendOTP(this.userId).subscribe({
      next: (response) => {
        this.resendingOTP = false;
        this.successMessage = 'OTP resent successfully! Please check your email.';
        this.startCountdown();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.resendingOTP = false;
        this.errorMessage = error.error?.message || 'Failed to resend OTP. Please try again.';
      }
    });
  }

  onOTPInput(event: any): void {
    // Only allow numbers
    const value = event.target.value;
    this.otp = value.replace(/[^0-9]/g, '').slice(0, 6);
  }

  cancelLogin(): void {
    this.router.navigate(['/login']);
  }
}
