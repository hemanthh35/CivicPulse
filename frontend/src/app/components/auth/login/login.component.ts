import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  get f() { 
    return this.loginForm.controls; 
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.f['email'].value, this.f['password'].value)
      .subscribe({
        next: (response: any) => {
          // Check if 2FA is required (for workers)
          if (response.require2FA && response.userId) {
            // Redirect to OTP verification page
            this.router.navigate(['/verify-otp'], {
              state: { userId: response.userId }
            });
            this.isSubmitting = false;
            return;
          }

          // Normal login flow (for non-workers)
          this.authService.storeToken(response.token);
          this.authService.storeUser(response.user);
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to login. Please check your credentials.';
          this.isSubmitting = false;
        }
      });
  }
}
