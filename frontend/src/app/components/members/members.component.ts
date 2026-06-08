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
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
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
