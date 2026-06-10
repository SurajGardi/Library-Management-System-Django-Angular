import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { BookFormComponent } from './book-form/book-form.component';


@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule, BookFormComponent],
  templateUrl: './books.component.html',
  styleUrl: './books.component.css'
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
