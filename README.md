# Library Management System

A full-stack, role-based Library Management System built with a **Django REST API** (Backend), **PostgreSQL** (Database), and **Angular** (Frontend). 

This application implements all core OOP models, custom decorators for logging and authentication, database integration, CSV import/export facilities, due date tracking, late fee calculations, and an overdue book listing powered by a Python generator.

---

## 🛠️ Tech Stack & Requirements
- **Backend**: Python 3.8+, Django 5.x+, Django REST Framework, Django CORS Headers, PostgreSQL client (`psycopg2-binary`)
- **Database**: PostgreSQL (already configured)
- **Frontend**: Angular 21 (Standalone component architecture with separate TS, HTML, and CSS files), RxJS, Reactive CSS

---

## 📂 Project Structure
```text
Library_Management_System/
├── backend/                   # Django REST API project
│   ├── manage.py
│   ├── library_project/       # Project configuration (settings, root URLs)
│   └── library/               # Main application logic
│       ├── management/        # Seeding scripts (seed_db)
│       ├── models/            # OOP Models: Book, Member, BorrowRecord
│       ├── utils/             # Business Logic: date_utils, file_io
│       ├── views.py           # API views, decorators, exception handlers
│       ├── urls.py            # API routing
│       └── tests.py           # Unit tests (6 test cases passing)
├── frontend/                  # Angular Web Client
│   ├── src/app/
│   │   ├── components/        # Standard Angular components (separated TS, HTML, and CSS)
│   │   │   ├── books/         # BooksComponent (books.component.ts, .html, .css)         => Parent Component
|   |   |   |   └── book-form  # BookFormComponent (book-form.component.ts, .html, . css) => Child Component
│   │   │   ├── dashboard/     # DashboardComponent (dashboard.component.ts, .html, .css)
│   │   │   ├── login/         # LoginComponent (login.component.ts, .html, .css)
│   │   │   ├── members/       # MembersComponent (members.component.ts, .html, .css)
│   │   │   └── transactions/  # TransactionsComponent (transactions.component.ts, .html, .css)
│   │   ├── services/          # API & Auth Services
│   │   ├── app.component.*    # Root component & navbar layout
│   │   ├── app.config.ts      # Standalone bootstrapping (HttpClient config)
│   │   └── app.routes.ts      # Navigation endpoints
│   └── src/styles.css         # Visual design theme stylesheet
├── sample_books.csv           # Seed template for CSV Import
├── sample_books.json          # Sample JSON dataset
└── README.md                  # This setup guide
```

---

## 🚀 Setup & Execution Guide (PowerShell)

Follow these steps in your PowerShell terminal to launch both servers.

### 1. Database Setup
Ensure your PostgreSQL database is initialized using your queries:
```sql
CREATE DATABASE library_db;
CREATE USER library_user WITH PASSWORD 'library123';
GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;
```

### 2. Run Backend (Django API)
Open a PowerShell terminal at the project root folder:

```powershell
# 1. Create a Python Virtual Environment
python -m venv venv

# 2. Activate the Virtual Environment
.\venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Navigate into the backend folder
cd backend

# 5. Apply database migrations to PostgreSQL
python manage.py migrate

# 6. Seed the Database with initial users and books
python manage.py seed_db

# 7. Start the Django API Server
python manage.py runserver
```
The Django server starts on `http://127.0.0.1:8000/`.

---

### 3. Run Frontend (Angular Client)
Open a **new** PowerShell terminal at the project root folder:

```powershell
# 1. Navigate into the frontend folder
cd frontend

# 2. Start the Angular Server
npx ng serve
```
The Angular UI starts on `http://localhost:4200/`. Open this address in your browser.

---

## 👥 Seeded Credentials for Testing

Use these accounts to sign into the system:

| Role | Email Address | Password | Functionality |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@library.com` | `admin123` | Can Register Members, Add/Edit/Delete Books, Import/Export CSV, and view Overdue reports. |
| **Member** | `alice@library.com` | `alice123` | Can Borrow books, view personal history, and return active loans. |

---

## 🧪 Verification & Testing

### Running Django Unit Tests
To run the test suite and verify calculations, exceptions, and unique ISBN rules, execute:
```powershell
cd backend
# Make sure your venv is activated
python manage.py test library
```
*(Tests cover: password hashing, unique ISBN constraint, borrow states, return logs, late fee calculations, and generator auditing).*

### 🗓️ Testing Late Fees ($1/day after 7 days)
To test late fee calculations without waiting:
1. Log in as a Member (`alice@library.com`).
2. Borrow any book from the **Books Catalog** tab.
3. Under the **Borrow & Return** tab, click **Return** on your active borrow record.
4. The return popup allows you to select a simulated return date. Pick a date **8+ days** in the future.
5. Click **Confirm Return**. You will see the calculated late fee applied instantly.

### 🚨 Auditing Overdues (Python Generator)
1. Log in as Admin (`admin@library.com`).
2. Navigate to **Borrow & Return** -> **Overdue Audit (Generator-based)**.
3. This view consumes the Python generator `yield_overdue_records()` on-demand, listing outstanding overdue books and their total accumulated fee values.

---

## 🧱 Core Concepts Implemented & Applied

This project explicitly implements and demonstrates the following core concepts:

### 1. Object-Oriented Programming (OOP)
* **Classes**:
  * **Book** ([book.py](file:///d:/Inteliment/Training%20Assignments/Library_Management_System/backend/library/models/book.py)): Django model class representing a book entity.
  * **Member** ([member.py](file:///d:/Inteliment/Training%20Assignments/Library_Management_System/backend/library/models/member.py)): Django model class representing a system member (inherits from abstract `Person` class).
  * **Library** ([library.py](file:///d:/Inteliment/Training%20Assignments/Library_Management_System/backend/library/models/library.py)): OOP coordinator/service class encapsulating core system operations like borrowing and returning books.
* **Inheritance / Mixins**:
  * **Person** ([member.py](file:///d:/Inteliment/Training%20Assignments/Library_Management_System/backend/library/models/member.py)): Implemented Django **Abstract Base Class** containing common properties (`name` and `email`), which the `Member` class inherits from.

### 2. Angular Parent ↔ Child Communication (Input / Output)
* **Child Component**:
  * **BookFormComponent** ([book-form.component.ts](file:///d:/Inteliment/Training%20Assignments/Library_Management_System/frontend/src/app/components/books/book-form/book-form.component.ts)): Handles the modal dialog for adding and editing library books.
* **Parent Component**:
  * **BooksComponent** ([books.component.ts](file:///d:/Inteliment/Training%20Assignments/Library_Management_System/frontend/src/app/components/books/books.component.ts)): Houses the library grid and manages catalog operations.
* **Communication Interface**:
  * **Parent to Child (`@Input()`)**: Employs `@Input() showModal`, `@Input() isEditMode`, and `@Input() activeBook` properties to pass state into the form.
  * **Child to Parent (`@Output()`)**: Employs `@Output() save` and `@Output() cancel` `EventEmitter` signals to trigger callbacks on the parent component when the form is submitted or closed.

