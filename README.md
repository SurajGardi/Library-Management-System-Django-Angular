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

--- 

## ☁️ Production Deployment

The Library Management System is deployed using a three-tier production architecture:

- **Frontend:** Angular 21 → Vercel
- **Backend:** Django REST Framework → Render
- **Database:** PostgreSQL → Neon
- **Source Code:** GitHub

The production request flow is:

```text
                         USER
                           │
                           │ HTTPS
                           ▼
                 ┌─────────────────────┐
                 │    Angular 21       │
                 │      Frontend       │
                 │       Vercel        │
                 └──────────┬──────────┘
                            │
                            │ HTTPS REST API
                            ▼
                 ┌─────────────────────┐
                 │   Django REST API   │
                 │       Backend       │
                 │       Render        │
                 └──────────┬──────────┘
                            │
                            │ PostgreSQL
                            ▼
                 ┌─────────────────────┐
                 │     PostgreSQL      │
                 │      Database       │
                 │        Neon         │
                 └─────────────────────┘
```

---

## 1. Prepare the Project for Production

Before deploying, the project was tested locally with:

```text
Angular 21
       ↓
Django REST Framework
       ↓
PostgreSQL
```

The repository contains both applications:

```text
Library_Management_System/
│
├── backend/
│   ├── manage.py
│   ├── library_project/
│   ├── library/
│   └── requirements.txt
│
├── frontend/
│   ├── package.json
│   ├── angular.json
│   └── src/
│
├── sample_books.csv
├── sample_books.json
└── README.md
```

The complete project is pushed to GitHub.

---

# 2. Deploy PostgreSQL Database to Neon

The database is deployed first because the Django backend needs a production database to connect to.

### Step 1: Create a Neon Project

Create a PostgreSQL project in Neon.

After creating the project, Neon provides a PostgreSQL connection string similar to:

```text
postgresql://username:password@host/database?sslmode=require
```

This connection string contains the information required by Django to connect to PostgreSQL.

### Step 2: Configure Django Database Settings

The local PostgreSQL configuration should not be hardcoded for production.

Instead, Django should read the production database connection information from an environment variable.

For example:

```text
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

The backend uses this production database URL when running on Render.

### Step 3: Verify the Database

After creating the Neon database, verify that the Django application can connect to it.

The production database will initially be empty, so Django migrations must be applied after the backend is deployed.

---

# 3. Prepare the Django Backend for Render

The Django application is deployed separately from the Angular frontend.

The backend directory is:

```text
backend/
├── manage.py
├── requirements.txt
├── library_project/
└── library/
```

### Step 1: Generate `requirements.txt`

All required Python packages must be included in:

```text
backend/requirements.txt
```

For example:

```text
Django
djangorestframework
django-cors-headers
psycopg2-binary
```

The exact versions should match the versions used by the project.

### Step 2: Production Configuration

The Django application needs production-specific configuration.

Important settings include:

```text
DEBUG=False
```

The production backend should also configure:

- Allowed hosts
- CORS
- Database connection
- Secret key
- Static files
- Environment variables

Sensitive information such as database passwords and Django secret keys should never be committed to GitHub.

---

# 4. Deploy Django Backend to Render

### Step 1: Create a Render Web Service

In Render:

```text
Dashboard
   ↓
New
   ↓
Web Service
   ↓
Connect GitHub Repository
```

Select the GitHub repository containing the Library Management System.

### Step 2: Configure the Backend Root Directory

Because the Django application is inside the `backend` directory, configure:

```text
Root Directory:
backend
```

This tells Render that the Django application is located inside:

```text
Library_Management_System/backend/
```

### Step 3: Configure the Build Command

The build command installs the Python dependencies:

```bash
pip install -r requirements.txt
```

Depending on the final production configuration, the build process can also include Django static-file collection.

For example:

```bash
pip install -r requirements.txt
python manage.py collectstatic --noinput
```

### Step 4: Configure the Start Command

Render needs a command to start the Django production server.

For a Gunicorn-based deployment:

```bash
gunicorn library_project.wsgi:application
```

The exact module path depends on the Django project's WSGI configuration.

### Step 5: Configure Environment Variables

In Render's **Environment Variables** section, configure the values required by Django.

For example:

```text
SECRET_KEY=your-production-secret-key
DEBUG=False
DATABASE_URL=your-neon-postgresql-url
```

Additional variables can be configured depending on the application's production settings.

### Step 6: Configure CORS

Because the frontend and backend are hosted on different domains, Django must allow requests from the production Angular application.

For example:

```text
https://your-angular-app.vercel.app
```

This is important because the browser considers the Vercel frontend and Render backend to be different origins.

The Django backend therefore needs an appropriate CORS configuration.

---

# 5. Run Django Migrations on the Neon Database

After the Render service is deployed, Django must create its database tables in the Neon PostgreSQL database.

Run:

```bash
python manage.py migrate
```

This applies Django migrations to the production database.

The process is:

```text
Django Models
      ↓
Django Migrations
      ↓
Neon PostgreSQL
      ↓
Database Tables
```

If the project uses the custom database seeding command, the initial data can then be created using:

```bash
python manage.py seed_db
```

This creates the required initial users/books according to the project's seed logic.

---

# 6. Verify the Django API on Render

Once Render successfully deploys the backend, it provides a public URL such as:

```text
https://your-library-backend.onrender.com
```

The API can then be tested independently.

For example:

```text
Browser / Postman
       ↓
Render Django API
       ↓
Neon PostgreSQL
```

Before connecting Angular to the backend, verify that the API itself is working correctly.

Important things to test include:

- Login API
- Book APIs
- Member APIs
- Borrow APIs
- Return APIs
- Overdue APIs
- CSV import/export APIs
- Authentication
- Role-based authorization

---

# 7. Configure Angular for the Production Backend

The Angular application cannot continue using:

```text
http://127.0.0.1:8000/
```

because that points to the developer's local computer.

Instead, the Angular application must communicate with the deployed Render backend.

The production API URL should point to the Render deployment:

```text
https://your-library-backend.onrender.com/
```

The Angular services should therefore use the production backend URL when the application is deployed.

For example:

```text
Angular
   ↓
HTTP Request
   ↓
https://your-library-backend.onrender.com/api/...
```

This is one of the most important steps in full-stack deployment.

---

# 8. Deploy Angular 21 Frontend to Vercel

The Angular frontend is located inside:

```text
frontend/
```

Since the GitHub repository contains both frontend and backend, Vercel must be configured to deploy only the Angular application.

### Step 1: Import GitHub Repository

In Vercel:

```text
Dashboard
   ↓
Add New
   ↓
Project
   ↓
Import Git Repository
```

Select:

```text
SurajGardi/Library-Management-System-Django-Angular
```

### Step 2: Configure Root Directory

Set:

```text
Root Directory:
frontend
```

This tells Vercel:

> "The application I want to build is inside the `frontend` directory."

### Step 3: Configure Build Settings

The Angular project is configured with:

```text
Framework Preset:
Other / Angular
```

Build command:

```bash
ng build
```

Output directory:

```text
dist/frontend
```

The exact output directory should always be verified against the project's `angular.json` and the result of:

```bash
ng build
```

For Angular versions/configurations that generate a `browser` subdirectory, the output directory may instead be:

```text
dist/frontend/browser
```

### Step 4: Deploy

Click:

```text
Deploy
```

Vercel then performs:

```text
GitHub Repository
       ↓
Vercel
       ↓
Root Directory = frontend
       ↓
Install npm dependencies
       ↓
Run ng build
       ↓
Generate production files
       ↓
Deploy static Angular files
       ↓
Public Vercel URL
```

---

# 9. Connect Angular → Render → Neon

After all three services are deployed, the complete production request flow becomes:

```text
┌──────────────────────────────┐
│          Browser             │
│          User                │
└──────────────┬───────────────┘
               │
               │ HTTPS
               ▼
┌──────────────────────────────┐
│       Angular 21             │
│       Vercel                 │
│                              │
│  Login / Books / Members /   │
│  Borrow / Return / Dashboard │
└──────────────┬───────────────┘
               │
               │ HTTPS REST API
               ▼
┌──────────────────────────────┐
│       Django REST API        │
│       Render                 │
│                              │
│ Authentication               │
│ Business Logic               │
│ OOP Models                   │
│ API Views                    │
│ Decorators                   │
│ CSV Operations               │
└──────────────┬───────────────┘
               │
               │ SQL / PostgreSQL
               ▼
┌──────────────────────────────┐
│       PostgreSQL             │
│       Neon                   │
│                              │
│ Books                        │
│ Members                      │
│ Borrow Records               │
│ Users                        │
└──────────────────────────────┘
```

For example, when an admin logs in:

```text
1. User enters email/password
             ↓
2. Angular sends HTTP request
             ↓
3. Request reaches Django API on Render
             ↓
4. Django validates the credentials
             ↓
5. Django queries PostgreSQL on Neon
             ↓
6. Neon returns the database result
             ↓
7. Django sends API response
             ↓
8. Angular receives the response
             ↓
9. Dashboard is displayed
```

---

# 10. CORS Configuration

Because the applications are hosted on different domains:

```text
Frontend:
https://your-app.vercel.app

Backend:
https://your-api.onrender.com
```

the browser treats them as different origins.

Therefore, Django CORS configuration must allow the Vercel frontend.

Conceptually:

```text
Vercel Angular Application
          │
          │ Cross-Origin Request
          ▼
Django REST API
          │
          │ CORS validation
          ▼
Allowed → Process Request
```

The production Vercel domain should be added to the Django CORS allowed origins.

---

# 11. Production Environment Variables

Sensitive production configuration should not be committed directly to GitHub.

Typical backend environment variables include:

```text
SECRET_KEY
DEBUG
DATABASE_URL
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
```

The values are configured on the backend hosting platform.

For the frontend, the production API URL should also be configured through the appropriate Angular environment/configuration mechanism used by the project.

The important principle is:

```text
Source Code
     ↓
No passwords
No database credentials
No secret keys
     ↓
Environment Variables
     ↓
Production Services
```

---

# 12. Continuous Deployment

The deployment platforms are connected to the GitHub repository.

The development workflow becomes:

```text
Developer
    ↓
Modify Code Locally
    ↓
Test Locally
    ↓
git add .
    ↓
git commit
    ↓
git push origin main
    ↓
GitHub
    │
    ├──────────────► Vercel
    │                  ↓
    │              Angular Build
    │                  ↓
    │              Frontend Deployment
    │
    └──────────────► Render
                       ↓
                   Django Build
                       ↓
                   Backend Deployment
                       ↓
                   Render API
                       ↓
                   Neon PostgreSQL
```

When the configured production branch is updated, Vercel and Render can automatically create new deployments from the latest GitHub commit.

---

# 13. Production Testing Checklist

After deploying all three components, test the complete application from the public Vercel URL.

### Authentication

- Login as Admin
- Login as Member
- Logout
- Invalid credentials
- Role-based access

### Books

- View books
- Add book
- Edit book
- Delete book
- Search/filter books
- Verify ISBN validation

### Members

- Register member
- View members
- Edit member information
- Delete member

### Borrow & Return

- Borrow book
- View active loans
- Return book
- Verify book availability
- Verify borrow history

### Late Fees

- Test simulated future return date
- Verify late fee calculation
- Verify overdue records

### Overdue Audit

- Login as Admin
- Open Overdue Audit
- Verify generator-based overdue records

### CSV

- Import books
- Export books
- Verify imported records in PostgreSQL

---

# 14. Final Production Architecture

The final deployed application consists of three independently hosted components:

| Component | Technology | Platform | Responsibility |
|---|---|---|---|
| Frontend | Angular 21 | Vercel | User interface |
| Backend | Django 5.x + DRF | Render | REST API and business logic |
| Database | PostgreSQL | Neon | Persistent application data |
| Source Control | Git + GitHub | GitHub | Source code and deployment trigger |

The complete architecture is:

```text
                         INTERNET
                            │
                            ▼
                  ┌──────────────────┐
                  │   Vercel         │
                  │   Angular 21     │
                  │   Frontend       │
                  └────────┬─────────┘
                           │
                       HTTPS/API
                           │
                           ▼
                  ┌──────────────────┐
                  │   Render         │
                  │   Django + DRF   │
                  │   Backend        │
                  └────────┬─────────┘
                           │
                      PostgreSQL
                           │
                           ▼
                  ┌──────────────────┐
                  │   Neon           │
                  │   PostgreSQL     │
                  │   Database       │
                  └──────────────────┘
```

### Deployment Summary

```text
GitHub
  │
  ├── frontend/ ──────► Vercel
  │                       │
  │                       │ HTTPS
  │                       ▼
  │                    Angular 21
  │
  └── backend/ ───────► Render
                          │
                          │ PostgreSQL
                          ▼
                        Neon
                          │
                          ▼
                     PostgreSQL
```

This deployment architecture separates the application into three layers:

**Presentation Layer → Angular/Vercel**

**Application Layer → Django REST Framework/Render**

**Data Layer → PostgreSQL/Neon**

This separation makes the application easier to deploy, maintain, scale, and troubleshoot.