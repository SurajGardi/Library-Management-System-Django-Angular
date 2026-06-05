import { Injectable } from '@angular/core';

export interface UserSession {
  member_id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private sessionKey = 'lms_user_session';
  private cachedSession: UserSession | null = null;
  private isInitialized = false;

  constructor() {
    this.initSession();
  }

  private initSession(): void {
    const sessionStr = localStorage.getItem(this.sessionKey);
    if (sessionStr) {
      try {
        this.cachedSession = JSON.parse(sessionStr) as UserSession;
      } catch {
        this.logout();
      }
    }
    this.isInitialized = true;
  }

  saveSession(session: UserSession): void {
    this.cachedSession = session;
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  getSession(): UserSession | null {
    if (!this.isInitialized) {
      this.initSession();
    }
    return this.cachedSession;
  }

  isLoggedIn(): boolean {
    return this.getSession() !== null;
  }

  isAdmin(): boolean {
    const session = this.getSession();
    return session ? session.role === 'Admin' : false;
  }

  getMemberId(): string | null {
    const session = this.getSession();
    return session ? session.member_id : null;
  }

  getUserName(): string {
    const session = this.getSession();
    return session ? session.name : 'Guest';
  }

  logout(): void {
    this.cachedSession = null;
    localStorage.removeItem(this.sessionKey);
  }
}
