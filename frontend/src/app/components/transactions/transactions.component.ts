import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent implements OnInit {
  activeTab = 'history';
  history: any[] = [];
  overdueBooks: any[] = [];
  isAdmin = false;
  historyMemberId = '';
  loading = false;

  // Feedback notifications
  errorMessage = '';
  successMessage = '';

  // Return modal details
  showReturnModal = false;
  returnModalIsbn = '';
  returnModalBookTitle = '';
  simulatedReturnDate = '';

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
    this.isAdmin = this.authService.isAdmin();
    
    // Automatically pre-populate Member ID for Admin so they can click Query immediately
    if (this.isAdmin) {
      this.historyMemberId = 'M001';
    } else {
      this.historyMemberId = this.authService.getMemberId() || '';
    }

    this.fetchHistory();
    if (this.isAdmin) {
      this.fetchOverdueBooks();
    }
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    if (tab === 'history') {
      this.fetchHistory();
    } else if (tab === 'overdue' && this.isAdmin) {
      this.fetchOverdueBooks();
    }
  }

  fetchHistory(): void {
    this.loading = true;
    this.errorMessage = '';
    this.apiService.getHistory(this.historyMemberId).subscribe({
      next: (res) => {
        this.history = res.history || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to fetch borrowing history.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchOverdueBooks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.apiService.getOverdueBooks().subscribe({
      next: (res) => {
        this.overdueBooks = res.overdue_books || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to check overdue log.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================================
  // RETURN BOOK FLOW
  // =====================================================================

  openReturnModal(isbn: string, title: string): void {
    this.returnModalIsbn = isbn;
    this.returnModalBookTitle = title;
    // Set default simulated return date to today's local date (formatted YYYY-MM-DD)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.simulatedReturnDate = `${year}-${month}-${day}`;
    
    this.showReturnModal = true;
  }

  closeReturnModal(): void {
    this.showReturnModal = false;
  }

  submitReturn(): void {
    if (!this.simulatedReturnDate) {
      alert('Please specify a return date.');
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.returnBook(this.returnModalIsbn, this.simulatedReturnDate).subscribe({
      next: (res) => {
        const details = res.return_details;
        let feeMsg = '';
        if (details.late_fee > 0) {
          feeMsg = ` A late fee of $${details.late_fee.toFixed(2)} was charged.`;
        }
        this.successMessage = `Book returned successfully.${feeMsg}`;
        this.closeReturnModal();
        this.fetchHistory();
        if (this.isAdmin) {
          this.fetchOverdueBooks();
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to return book.';
        this.closeReturnModal();
      }
    });
  }
}
