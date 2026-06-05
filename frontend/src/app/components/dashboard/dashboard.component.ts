import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="app-container">
      <div class="welcome-banner lms-card">
        <div class="welcome-text">
          <h1>Welcome back, {{ userName }}!</h1>
          <p>Role: <span class="badge" [ngClass]="isAdmin ? 'badge-warning' : 'badge-success'">{{ userRole }}</span></p>
        </div>
        <div class="welcome-date">
          <p>{{ currentDate | date:'fullDate' }}</p>
        </div>
      </div>

      <!-- Statistics Widgets -->
      <div class="lms-grid">
        <div class="stat-card lms-card">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <h3>Total Catalog</h3>
            <h2>{{ bookCount }}</h2>
            <p>Books in Library</p>
          </div>
        </div>

        <div class="stat-card lms-card">
          <div class="stat-icon text-success">✔️</div>
          <div class="stat-content">
            <h3>Available</h3>
            <h2>{{ availableBookCount }}</h2>
            <p>Ready to borrow</p>
          </div>
        </div>

        <div class="stat-card lms-card">
          <div class="stat-icon text-danger">🔄</div>
          <div class="stat-content">
            <h3>Active Loans</h3>
            <h2>{{ borrowedBookCount }}</h2>
            <p>Currently checked out</p>
          </div>
        </div>

        <div *ngIf="isAdmin" class="stat-card lms-card">
          <div class="stat-icon text-warning">👥</div>
          <div class="stat-content">
            <h3>Members</h3>
            <h2>{{ memberCount }}</h2>
            <p>Registered readers</p>
          </div>
        </div>
      </div>

      <!-- Quick Links Section -->
      <div class="quick-links-section">
        <h2>Quick Operations</h2>
        <div class="links-grid">
          <a routerLink="/books" class="link-card lms-card">
            <span class="link-icon">📖</span>
            <div>
              <h4>Search & View Books</h4>
              <p>Explore catalog, check book details or import new collections.</p>
            </div>
          </a>

          <a routerLink="/transactions" class="link-card lms-card">
            <span class="link-icon">💳</span>
            <div>
              <h4>Borrow & Return</h4>
              <p>Borrow new titles, return checked out items, and pay late fees.</p>
            </div>
          </a>

          <a *ngIf="isAdmin" routerLink="/members" class="link-card lms-card">
            <span class="link-icon">➕</span>
            <div>
              <h4>Register Member</h4>
              <p>Create new student or library accounts to permit borrowings.</p>
            </div>
          </a>

          <a *ngIf="isAdmin" routerLink="/transactions" class="link-card lms-card">
            <span class="link-icon">⏳</span>
            <div>
              <h4>Overdue Audits</h4>
              <p>Utilize generator reporting to audit late books & fees.</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: white;
      border: none;
      margin-bottom: 2rem;
    }
    .welcome-banner h1 {
      color: white;
      margin-bottom: 0.25rem;
    }
    .welcome-banner p {
      color: rgba(255, 255, 255, 0.85);
    }
    .welcome-date {
      text-align: right;
      font-size: 1.1rem;
      font-weight: 500;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .stat-icon {
      font-size: 3rem;
      background-color: var(--primary-light);
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }
    .text-success {
      background-color: rgba(16, 185, 129, 0.1);
    }
    .text-danger {
      background-color: rgba(239, 68, 110, 0.1);
    }
    .text-warning {
      background-color: rgba(245, 158, 11, 0.1);
    }
    .stat-content h3 {
      font-size: 1rem;
      color: var(--text-muted);
      font-weight: 500;
      margin-bottom: 0.125rem;
    }
    .stat-content h2 {
      font-size: 2rem;
      margin: 0;
    }
    .quick-links-section {
      margin-top: 3rem;
    }
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 1.25rem;
    }
    .link-card {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      text-decoration: none;
      color: inherit;
    }
    .link-card:hover h4 {
      color: var(--primary);
    }
    .link-icon {
      font-size: 2rem;
      padding: 0.5rem;
      background-color: var(--bg-main);
      border-radius: 8px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  userName = '';
  userRole = '';
  isAdmin = false;
  currentDate = new Date();

  // Statistics
  bookCount = 0;
  availableBookCount = 0;
  borrowedBookCount = 0;
  memberCount = 0;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName = this.authService.getUserName();
    this.userRole = this.authService.getSession()?.role || 'Member';
    this.isAdmin = this.authService.isAdmin();

    this.fetchStatistics();
  }

  fetchStatistics(): void {
    this.apiService.getBooks().subscribe({
      next: (res) => {
        const books = res.books || [];
        this.bookCount = books.length;
        this.availableBookCount = books.filter((b: any) => b.available).length;
        this.borrowedBookCount = this.bookCount - this.availableBookCount;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching statistics:', err)
    });

    if (this.isAdmin) {
      this.apiService.getMembers().subscribe({
        next: (res) => {
          const members = res.members || [];
          this.memberCount = members.length;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error fetching members count:', err)
      });
    }
  }
}
