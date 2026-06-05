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
  template: `
    <div class="app-container">
      <div class="header-actions">
        <div>
          <h1>Borrowing Operations</h1>
          <p>View your active rentals, borrow history, and audit late returns</p>
        </div>
      </div>

      <!-- Feedbacks -->
      <div *ngIf="errorMessage" class="lms-alert lms-alert-error">
        <span>⚠️</span> {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="lms-alert lms-alert-success">
        <span>✅</span> {{ successMessage }}
      </div>

      <!-- MAIN LAYOUT -->
      <div class="tab-container">
        <!-- Tabs selector -->
        <div class="tabs">
          <button [class.active]="activeTab === 'history'" (click)="selectTab('history')" class="tab-btn">
            📜 My Borrowing History
          </button>
          <button *ngIf="isAdmin" [class.active]="activeTab === 'overdue'" (click)="selectTab('overdue')" class="tab-btn">
            🚨 Overdue Audit (Generator-based)
          </button>
        </div>

        <div class="tab-content lms-card">
          <!-- SUB-TAB 1: BORROW HISTORY -->
          <div *ngIf="activeTab === 'history'">
            <div class="history-header" *ngIf="isAdmin">
              <label class="form-label" for="searchMemberId">View Borrow History of Specific Member:</label>
              <div class="search-form">
                <input 
                  type="text" 
                  id="searchMemberId" 
                  [(ngModel)]="historyMemberId" 
                  class="form-control" 
                  placeholder="Enter Member ID (e.g. M001)"
                />
                <button (click)="fetchHistory()" class="btn btn-primary">Query</button>
              </div>
            </div>

            <div class="table-container margin-top">
              <table class="lms-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Late Fee</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let record of history">
                    <td>
                      <strong>{{ record.book_title }}</strong><br/>
                      <span class="text-muted text-xs">ISBN: {{ record.isbn }}</span>
                    </td>
                    <td>{{ record.borrow_date }}</td>
                    <td>{{ record.due_date }}</td>
                    <td>{{ record.return_date || '—' }}</td>
                    <td>
                      <span [class.text-danger]="record.late_fee > 0">
                        {{ record.late_fee | currency:'USD' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-success': record.status === 'Returned',
                        'badge-warning': record.status === 'Borrowed',
                        'badge-danger': record.status === 'Overdue'
                      }">
                        {{ record.status }}
                      </span>
                    </td>
                    <td>
                      <button 
                        *ngIf="record.status !== 'Returned'" 
                        (click)="openReturnModal(record.isbn, record.book_title)" 
                        class="btn btn-success btn-xs"
                      >
                        Return
                      </button>
                      <span *ngIf="record.status === 'Returned'" class="text-muted text-xs">Closed</span>
                    </td>
                  </tr>
                  <tr *ngIf="loading">
                    <td colspan="7" class="empty-row">🔄 Loading records... Please wait.</td>
                  </tr>
                  <tr *ngIf="!loading && history.length === 0">
                    <td colspan="7" class="empty-row">No borrow records found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- SUB-TAB 2: OVERDUE AUDIT -->
          <div *ngIf="activeTab === 'overdue'">
            <h3>Currently Overdue Borrowings</h3>
            <p class="text-xs text-muted mb-4">
              This list is generated on-demand by calling a <strong>Python Generator</strong> on the backend to yield active overdue items.
            </p>

            <div class="table-container margin-top">
              <table class="lms-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Book / ISBN</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Outstanding Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let record of overdueBooks">
                    <td>
                      <strong>{{ record.member_name }}</strong><br/>
                      <span class="text-muted text-xs">ID: {{ record.member_id }}</span>
                    </td>
                    <td>
                      <strong>{{ record.book_title }}</strong><br/>
                      <span class="text-muted text-xs">ISBN: {{ record.isbn }}</span>
                    </td>
                    <td>{{ record.borrow_date }}</td>
                    <td>{{ record.due_date }}</td>
                    <td>
                      <span class="text-danger font-bold">
                        {{ record.current_fee | currency:'USD' }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="loading">
                    <td colspan="5" class="empty-row">🔍 Auditing overdue books... Please wait.</td>
                  </tr>
                  <tr *ngIf="!loading && overdueBooks.length === 0">
                    <td colspan="5" class="empty-row">No overdue books! Outstanding records are in good shape.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- RETURN SIMULATOR MODAL -->
      <div *ngIf="showReturnModal" class="modal-overlay">
        <div class="modal-content lms-card">
          <h3>Return Book: {{ returnModalBookTitle }}</h3>
          <p class="text-xs text-muted">
            Standard borrow period is 7 days. You can submit today's return or select a future date to simulate and verify the <strong>$1.00/day late fee calculation</strong>.
          </p>

          <form (ngSubmit)="submitReturn()">
            <div class="form-group margin-top">
              <label class="form-label" for="returnDate">Simulate Return Date:</label>
              <input 
                type="date" 
                id="returnDate" 
                name="returnDate" 
                class="form-control" 
                [(ngModel)]="simulatedReturnDate" 
                required
              />
            </div>

            <div class="modal-buttons">
              <button type="submit" class="btn btn-success">Confirm Return</button>
              <button type="button" (click)="closeReturnModal()" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      margin-bottom: 2rem;
    }
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: -1px;
    }
    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: 1px solid var(--border-color);
      border-bottom: none;
      background-color: var(--bg-main);
      color: var(--text-muted);
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition);
    }
    .tab-btn:hover {
      color: var(--text-main);
      background-color: var(--border-color);
    }
    .tab-btn.active {
      background-color: var(--bg-card);
      color: var(--primary);
      border-color: var(--border-color);
      border-bottom: 2px solid var(--bg-card);
      z-index: 2;
    }
    .tab-content {
      border-top-left-radius: 0;
    }
    .history-header {
      padding: 1rem;
      background-color: var(--bg-main);
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }
    .search-form {
      display: flex;
      gap: 1rem;
      margin-top: 0.25rem;
    }
    .margin-top {
      margin-top: 1.5rem;
    }
    .text-xs {
      font-size: 0.8rem;
    }
    .text-muted {
      color: var(--text-muted);
    }
    .text-danger {
      color: var(--danger);
    }
    .font-bold {
      font-weight: 600;
    }
    .empty-row {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
      font-style: italic;
    }
    .mb-4 {
      margin-bottom: 1rem;
    }
    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      border-radius: 4px;
    }
    /* Modal */
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
      max-width: 480px;
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
