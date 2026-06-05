import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-box lms-card">
        <div class="header">
          <div class="logo">📚</div>
          <h2>Library Portal</h2>
          <p>Sign in to access books, borrow records & configurations</p>
        </div>

        <div *ngIf="errorMessage" class="lms-alert lms-alert-error">
          <span>⚠️</span> {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="lms-alert lms-alert-success">
          <span>✅</span> {{ successMessage }}
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-control" 
              [(ngModel)]="email" 
              placeholder="e.g. alice@library.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              class="form-control" 
              [(ngModel)]="password" 
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="info-note">
          <p><strong>Demo Accounts:</strong></p>
          <p>Admin: Admin User (will be auto-seeded) or register custom users via the Admin dashboard.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 85vh;
      padding: 1rem;
    }
    .login-box {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    .w-full {
      width: 100%;
      margin-top: 1rem;
      padding: 0.75rem;
      font-size: 1rem;
    }
    .info-note {
      margin-top: 1.5rem;
      padding: 0.75rem;
      background-color: var(--primary-light);
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .info-note p {
      margin-bottom: 0.25rem;
      color: var(--primary);
    }
  `]
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If already logged in, redirect to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.authService.saveSession({
          member_id: res.member_id,
          name: res.name,
          email: res.email,
          role: res.role
        });
        this.successMessage = 'Login successful! Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 800);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else {
          this.errorMessage = err.error?.error || 'Server error. Please check if backend is running.';
        }
      }
    });
  }
}
