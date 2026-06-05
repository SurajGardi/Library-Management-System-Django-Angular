import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-container">
      <div class="header-actions">
        <div>
          <h1>Book Inventory</h1>
          <p>Search, manage, borrow and export library books</p>
        </div>
        <div class="action-buttons">
          <button *ngIf="isAdmin" (click)="openAddModal()" class="btn btn-primary">
            ➕ Add New Book
          </button>
          <button *ngIf="isAdmin" (click)="triggerExport()" class="btn btn-secondary">
            📥 Export CSV
          </button>
          <button *ngIf="isAdmin" (click)="openImportModal()" class="btn btn-secondary">
            📤 Import CSV
          </button>
        </div>
      </div>

      <!-- Error / Success banners -->
      <div *ngIf="errorMessage" class="lms-alert lms-alert-error">
        <span>⚠️</span> {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="lms-alert lms-alert-success">
        <span>✅</span> {{ successMessage }}
      </div>

      <!-- Search Filter -->
      <div class="search-bar-container lms-card">
        <div class="search-form">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="onSearch()" 
            class="form-control search-input" 
            placeholder="Search by Title, Author, or ISBN..."
          />
          <button (click)="fetchBooks()" class="btn btn-secondary">Search</button>
        </div>
      </div>

      <!-- Books Grid / Table -->
      <div class="table-container">
        <table class="lms-table">
          <thead>
            <tr>
              <th>ISBN</th>
              <th>Title</th>
              <th>Author</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let book of books">
              <td><strong>{{ book.isbn }}</strong></td>
              <td>{{ book.title }}</td>
              <td>{{ book.author }}</td>
              <td>
                <span class="badge" [ngClass]="book.available ? 'badge-success' : 'badge-danger'">
                  {{ book.available ? 'Available' : 'Borrowed' }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button 
                    *ngIf="!isAdmin && book.available" 
                    (click)="borrowBook(book.isbn)" 
                    class="btn btn-success btn-xs"
                  >
                    Borrow
                  </button>
                  <button 
                    *ngIf="isAdmin" 
                    (click)="openEditModal(book)" 
                    class="btn btn-secondary btn-xs"
                  >
                    Edit
                  </button>
                  <button 
                    *ngIf="isAdmin" 
                    (click)="deleteBook(book.id, book.available)" 
                    class="btn btn-danger btn-xs"
                  >
                    Delete
                  </button>
                  <span *ngIf="!isAdmin && !book.available" class="text-muted text-xs">
                    Unavailable
                  </span>
                </div>
              </td>
            </tr>
            <tr *ngIf="loading">
              <td colspan="5" class="empty-row">🔄 Loading catalog... Please wait.</td>
            </tr>
            <tr *ngIf="!loading && books.length === 0">
              <td colspan="5" class="empty-row">No books found in the library.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ADD/EDIT MODAL -->
      <div *ngIf="showBookModal" class="modal-overlay">
        <div class="modal-content lms-card">
          <h3>{{ isEditMode ? 'Modify Book' : 'Add New Book' }}</h3>
          <form (ngSubmit)="saveBook()">
            <div class="form-group">
              <label class="form-label" for="bookIsbn">ISBN Number</label>
              <input 
                type="text" 
                id="bookIsbn" 
                name="bookIsbn" 
                class="form-control" 
                [(ngModel)]="activeBook.isbn" 
                required
                [disabled]="isEditMode"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="bookTitle">Title</label>
              <input 
                type="text" 
                id="bookTitle" 
                name="bookTitle" 
                class="form-control" 
                [(ngModel)]="activeBook.title" 
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="bookAuthor">Author</label>
              <input 
                type="text" 
                id="bookAuthor" 
                name="bookAuthor" 
                class="form-control" 
                [(ngModel)]="activeBook.author" 
                required
              />
            </div>
            
            <div class="modal-buttons">
              <button type="submit" class="btn btn-primary">
                {{ isEditMode ? 'Update' : 'Create' }}
              </button>
              <button type="button" (click)="closeBookModal()" class="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- CSV IMPORT MODAL -->
      <div *ngIf="showImportModal" class="modal-overlay">
        <div class="modal-content lms-card csv-modal">
          <h3>Bulk Import Books (CSV)</h3>
          <p class="text-xs">Provide a CSV string with columns: <strong>isbn,title,author</strong></p>
          
          <div class="form-group margin-top">
            <textarea 
              rows="8" 
              class="form-control font-mono" 
              [(ngModel)]="csvPasteContent" 
              placeholder="isbn,title,author&#10;978-3-16-148410-0,The Great Gatsby,F. Scott Fitzgerald&#10;978-0-452-28423-4,1984,George Orwell"
            ></textarea>
          </div>

          <div class="modal-buttons">
            <button (click)="importCsv()" class="btn btn-success">Import</button>
            <button (click)="closeImportModal()" class="btn btn-secondary">Cancel</button>
          </div>
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
    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }
    .search-bar-container {
      margin-bottom: 1.5rem;
      padding: 1rem;
    }
    .search-form {
      display: flex;
      gap: 1rem;
    }
    .search-input {
      flex: 1;
    }
    .row-actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      border-radius: 4px;
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
    .csv-modal {
      max-width: 600px;
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .font-mono {
      font-family: monospace;
      font-size: 0.85rem;
    }
    .margin-top {
      margin-top: 1rem;
    }
    .text-xs {
      font-size: 0.8rem;
    }
    .text-muted {
      color: var(--text-muted);
    }
  `]
})
export class BooksComponent implements OnInit {
  books: any[] = [];
  searchQuery = '';
  isAdmin = false;

  // Feedback notifications
  errorMessage = '';
  successMessage = '';

  // Book Modal state
  showBookModal = false;
  isEditMode = false;
  activeBook = { id: 0, isbn: '', title: '', author: '' };

  // CSV Import State
  showImportModal = false;
  csvPasteContent = '';

  loading = false;

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
    this.fetchBooks();
  }

  fetchBooks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.apiService.getBooks(this.searchQuery).subscribe({
      next: (res) => {
        this.books = res.books || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to fetch book catalog.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.fetchBooks();
  }

  // =====================================================================
  // BOOK SAVE / EDIT / DELETE ACTIONS
  // =====================================================================

  openAddModal(): void {
    this.isEditMode = false;
    this.activeBook = { id: 0, isbn: '', title: '', author: '' };
    this.showBookModal = true;
  }

  openEditModal(book: any): void {
    this.isEditMode = true;
    this.activeBook = { ...book };
    this.showBookModal = true;
  }

  closeBookModal(): void {
    this.showBookModal = false;
  }

  saveBook(): void {
    if (!this.activeBook.isbn || !this.activeBook.title || !this.activeBook.author) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode) {
      this.apiService.updateBook(this.activeBook.id, this.activeBook).subscribe({
        next: () => {
          this.successMessage = 'Book details updated successfully.';
          this.fetchBooks();
          this.closeBookModal();
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to update book.';
        }
      });
    } else {
      this.apiService.addBook(this.activeBook).subscribe({
        next: () => {
          this.successMessage = 'Book added to catalog successfully.';
          this.fetchBooks();
          this.closeBookModal();
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to add book.';
        }
      });
    }
  }

  deleteBook(bookId: number, available: boolean): void {
    if (!available) {
      this.errorMessage = 'Cannot delete a book that is currently borrowed.';
      return;
    }

    if (!confirm('Are you sure you want to delete this book?')) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.deleteBook(bookId).subscribe({
      next: () => {
        this.successMessage = 'Book deleted from catalog successfully.';
        this.fetchBooks();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to delete book.';
      }
    });
  }

  // =====================================================================
  // MEMBER BORROW ACTION
  // =====================================================================

  borrowBook(isbn: string): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.borrowBook(isbn).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.fetchBooks();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Unable to borrow book.';
      }
    });
  }

  // =====================================================================
  // CSV BULK ACTIONS
  // =====================================================================

  triggerExport(): void {
    this.apiService.exportCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'books_inventory.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.successMessage = 'CSV exported successfully.';
      },
      error: (err) => {
        this.errorMessage = 'Failed to export CSV file.';
      }
    });
  }

  openImportModal(): void {
    this.csvPasteContent = '';
    this.showImportModal = true;
  }

  closeImportModal(): void {
    this.showImportModal = false;
  }

  importCsv(): void {
    if (!this.csvPasteContent.trim()) {
      alert('Please paste some CSV content.');
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.importCsv(this.csvPasteContent).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        if (res.errors && res.errors.length > 0) {
          this.errorMessage = 'Warnings: ' + res.errors.join(' | ');
        }
        this.fetchBooks();
        this.closeImportModal();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to import CSV.';
      }
    });
  }
}
