import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-container">
      <div class="header-actions">
        <div>
          <h1>Member Accounts</h1>
          <p>Register new readers and review access privileges</p>
        </div>
        <button (click)="openRegisterModal()" class="btn btn-primary">
          ➕ Register New Member
        </button>
      </div>

      <!-- Feedbacks -->
      <div *ngIf="errorMessage" class="lms-alert lms-alert-error">
        <span>⚠️</span> {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="lms-alert lms-alert-success">
        <span>✅</span> {{ successMessage }}
      </div>

      <!-- Members list table -->
      <div class="table-container">
        <table class="lms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>System Role</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let member of members">
              <td><strong>{{ member.member_id }}</strong></td>
              <td>{{ member.name }}</td>
              <td>{{ member.email }}</td>
              <td>
                <span class="badge" [ngClass]="member.role === 'Admin' ? 'badge-warning' : 'badge-success'">
                  {{ member.role }}
                </span>
              </td>
            </tr>
            <tr *ngIf="loading">
              <td colspan="4" class="empty-row">🔄 Loading registered members... Please wait.</td>
            </tr>
            <tr *ngIf="!loading && members.length === 0">
              <td colspan="4" class="empty-row">No registered members found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- REGISTER MODAL -->
      <div *ngIf="showRegisterModal" class="modal-overlay">
        <div class="modal-content lms-card">
          <h3>Register Member Account</h3>
          <form (ngSubmit)="registerMember()">
            <div class="form-group">
              <label class="form-label" for="memberId">Member ID (Unique)</label>
              <input 
                type="text" 
                id="memberId" 
                name="memberId" 
                class="form-control" 
                [(ngModel)]="newMember.member_id" 
                placeholder="e.g. M004"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="memberName">Full Name</label>
              <input 
                type="text" 
                id="memberName" 
                name="memberName" 
                class="form-control" 
                [(ngModel)]="newMember.name" 
                placeholder="e.g. Bob Johnson"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="memberEmail">Email Address</label>
              <input 
                type="email" 
                id="memberEmail" 
                name="memberEmail" 
                class="form-control" 
                [(ngModel)]="newMember.email" 
                placeholder="e.g. bob@example.com"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="memberPassword">Access Password</label>
              <input 
                type="password" 
                id="memberPassword" 
                name="memberPassword" 
                class="form-control" 
                [(ngModel)]="newMember.password" 
                placeholder="••••••••"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="memberRole">Role</label>
              <select id="memberRole" name="memberRole" class="form-control" [(ngModel)]="newMember.role">
                <option value="Member">Member (Borrow/Return only)</option>
                <option value="Admin">Admin (Full administrative privileges)</option>
              </select>
            </div>
            
            <div class="modal-buttons">
              <button type="submit" class="btn btn-primary">Register</button>
              <button type="button" (click)="closeRegisterModal()" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .empty-row {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
      font-style: italic;
    }
    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      width: 90%;
      max-width: 500px;
      padding: 2rem;
      box-shadow: var(--shadow-lg);
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
  `]
})
export class MembersComponent implements OnInit {
  members: any[] = [];
  errorMessage = '';
  successMessage = '';
  loading = false;

  // Register Modal state
  showRegisterModal = false;
  newMember = {
    member_id: '',
    name: '',
    email: '',
    password: '',
    role: 'Member'
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.authService.isAdmin()) {
      // Members cannot manage other members
      this.router.navigate(['/dashboard']);
      return;
    }
    this.fetchMembers();
  }

  fetchMembers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.apiService.getMembers().subscribe({
      next: (res) => {
        this.members = res.members || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to fetch registered members.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openRegisterModal(): void {
    this.newMember = {
      member_id: '',
      name: '',
      email: '',
      password: '',
      role: 'Member'
    };
    this.showRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
  }

  registerMember(): void {
    if (!this.newMember.member_id || !this.newMember.name || !this.newMember.email || !this.newMember.password) {
      this.errorMessage = 'All fields are required to register a member.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.registerMember(this.newMember).subscribe({
      next: (res) => {
        this.successMessage = res.message || `Member ${res.name} registered successfully.`;
        this.fetchMembers();
        this.closeRegisterModal();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Registration failed.';
      }
    });
  }
}
