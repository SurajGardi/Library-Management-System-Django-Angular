import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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
