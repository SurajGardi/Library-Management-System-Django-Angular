import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Helper to build headers with custom auth key
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const memberId = this.authService.getMemberId();
    if (memberId) {
      headers = headers.set('X-Member-ID', memberId);
    }
    return headers;
  }

  // =====================================================================
  // AUTH / USER ENDPOINTS
  // =====================================================================

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login/`, credentials);
  }

  registerMember(memberData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/members/register/`, memberData, {
      headers: this.getHeaders()
    });
  }

  getMembers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/members/`, {
      headers: this.getHeaders()
    });
  }

  // =====================================================================
  // BOOKS (CRUD) ENDPOINTS
  // =====================================================================

  getBooks(searchQuery: string = ''): Observable<any> {
    let params = new HttpParams();
    if (searchQuery) {
      params = params.set('search', searchQuery);
    }
    return this.http.get(`${this.baseUrl}/books/`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  addBook(bookData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/books/`, bookData, {
      headers: this.getHeaders()
    });
  }

  updateBook(bookId: number, bookData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/books/${bookId}/`, bookData, {
      headers: this.getHeaders()
    });
  }

  deleteBook(bookId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/books/${bookId}/`, {
      headers: this.getHeaders()
    });
  }

  // =====================================================================
  // TRANSACTIONS ENDPOINTS
  // =====================================================================

  borrowBook(isbn: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/borrow/`, { isbn }, {
      headers: this.getHeaders()
    });
  }

  returnBook(isbn: string, simulatedDate?: string): Observable<any> {
    const payload: any = { isbn };
    if (simulatedDate) {
      payload.return_date = simulatedDate;
    }
    return this.http.post(`${this.baseUrl}/return/`, payload, {
      headers: this.getHeaders()
    });
  }

  getHistory(memberId?: string): Observable<any> {
    let params = new HttpParams();
    if (memberId) {
      params = params.set('member_id', memberId);
    }
    return this.http.get(`${this.baseUrl}/history/`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  getOverdueBooks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/overdue/`, {
      headers: this.getHeaders()
    });
  }

  // =====================================================================
  // CSV IMPORT / EXPORT ENDPOINTS
  // =====================================================================

  importCsv(csvContent: string): Observable<any> {
    // Send CSV content as raw text
    return this.http.post(`${this.baseUrl}/books/csv-import/`, csvContent, {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain',
        'X-Member-ID': this.authService.getMemberId() || ''
      })
    });
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/books/csv-export/`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
}
