import functools
import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import datetime

from .models.book import Book
from .models.member import Member, BorrowRecord
from .models.library import Library
from .utils.date_utils import calculate_late_fee, parse_date, yield_overdue_records
from .utils.file_io import export_books_to_csv_string, import_books_from_csv_string

logger = logging.getLogger(__name__)

# =====================================================================
# DECORATORS
# =====================================================================

def log_action(func):
    """
    Decorator to log API function calls.
    Fulfills the Decorator requirement.
    """
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        if request.method == 'OPTIONS':
            return func(request, *args, **kwargs)
        method = request.method
        path = request.path
        logger.info(f"API Action Log: {func.__name__} called. Method: {method}, Path: {path}")
        print(f"[ACTION LOG] Function '{func.__name__}' called on path '{path}' via {method}")
        return func(request, *args, **kwargs)
    return wrapper


def check_permission(required_role=None):
    """
    Decorator to enforce roles and authentication.
    Authenticates user using 'X-Member-ID' header.
    Fulfills permissions decorator requirement.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            if request.method == 'OPTIONS':
                return func(request, *args, **kwargs)
            member_id = request.headers.get('X-Member-ID')
            
            # Exception Handling: User not authenticated
            if not member_id:
                return JsonResponse({'error': 'Unauthorized. Missing X-Member-ID header.'}, status=401)
            
            try:
                member = Member.objects.get(member_id=member_id)
            except Member.DoesNotExist:
                # Exception Handling: User not registered
                return JsonResponse({'error': f"User with ID '{member_id}' is not registered in the system."}, status=403)
            
            # Role Authorization
            if required_role and member.role != required_role:
                return JsonResponse({'error': f"Permission denied. Action requires '{required_role}' privileges."}, status=403)
            
            # Inject authenticated member into the request object
            request.user_member = member
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


# =====================================================================
# VIEWS: AUTHENTICATION
# =====================================================================

@csrf_exempt
@log_action
def login_view(request):
    """Logs in a member and verifies password."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests allowed'}, status=405)
        
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'error': 'Email and password are required.'}, status=400)
            
        try:
            member = Member.objects.get(email=email)
        except Member.DoesNotExist:
            return JsonResponse({'error': 'Invalid credentials.'}, status=401)
            
        if not member.check_password(password):
            return JsonResponse({'error': 'Invalid credentials.'}, status=401)
            
        return JsonResponse({
            'message': 'Login successful',
            'member_id': member.member_id,
            'name': member.name,
            'email': member.email,
            'role': member.role
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)


@csrf_exempt
@log_action
@check_permission(required_role='Admin')
def register_member_view(request):
    """Allows Admin to register a new member."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests allowed'}, status=405)
        
    try:
        data = json.loads(request.body)
        member_id = data.get('member_id')
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'Member')
        
        if not all([member_id, name, email, password]):
            return JsonResponse({'error': 'member_id, name, email, and password are required.'}, status=400)
            
        if role not in ['Admin', 'Member']:
            return JsonResponse({'error': "Role must be 'Admin' or 'Member'."}, status=400)
            
        # Exception Handling: Duplicate Member ID or Email
        if Member.objects.filter(member_id=member_id).exists():
            return JsonResponse({'error': f"Member with ID '{member_id}' is already registered."}, status=400)
            
        if Member.objects.filter(email=email).exists():
            return JsonResponse({'error': f"Email '{email}' is already registered."}, status=400)
            
        member = Member(member_id=member_id, name=name, email=email, role=role)
        member.set_password(password)
        member.save()
        
        return JsonResponse({
            'message': f"Member '{name}' successfully registered.",
            'member_id': member.member_id,
            'name': member.name,
            'email': member.email,
            'role': member.role
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)


# =====================================================================
# VIEWS: BOOKS (CRUD)
# =====================================================================

@csrf_exempt
@log_action
@check_permission()
def books_list_create_view(request):
    """
    GET: View books list (available vs borrowed, title/author search).
    POST: Add book (Admin only).
    """
    if request.method == 'GET':
        query = request.GET.get('search', '')
        books = Book.objects.all()
        if query:
            books = books.filter(title__icontains=query) | books.filter(author__icontains=query) | books.filter(isbn__icontains=query)
            
        book_list = []
        for b in books:
            book_list.append({
                'id': b.id,
                'isbn': b.isbn,
                'title': b.title,
                'author': b.author,
                'available': b.available
            })
        return JsonResponse({'books': book_list})
        
    elif request.method == 'POST':
        # Check permissions for Admin on the fly
        if request.user_member.role != 'Admin':
            return JsonResponse({'error': 'Permission denied. Admin role required.'}, status=403)
            
        try:
            data = json.loads(request.body)
            isbn = data.get('isbn')
            title = data.get('title')
            author = data.get('author')
            
            if not all([isbn, title, author]):
                return JsonResponse({'error': 'ISBN, title, and author are required.'}, status=400)
                
            if Book.objects.filter(isbn=isbn).exists():
                return JsonResponse({'error': f"Book with ISBN '{isbn}' already exists."}, status=400)
                
            book = Book.objects.create(isbn=isbn, title=title, author=author, available=True)
            return JsonResponse({
                'message': 'Book added successfully',
                'book': {'id': book.id, 'isbn': book.isbn, 'title': book.title, 'author': book.author, 'available': book.available}
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body.'}, status=400)


@csrf_exempt
@log_action
@check_permission(required_role='Admin')
def book_detail_view(request, book_id):
    """
    PUT/PATCH: Edit book (Admin only).
    DELETE: Delete book (Admin only).
    """
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        # Exception Handling: Book not found
        return JsonResponse({'error': f"Book with ID {book_id} was not found."}, status=404)
        
    if request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body)
            isbn = data.get('isbn')
            title = data.get('title')
            author = data.get('author')
            available = data.get('available')
            
            if isbn:
                # If changing ISBN, make sure it is not in use elsewhere
                if Book.objects.filter(isbn=isbn).exclude(id=book_id).exists():
                    return JsonResponse({'error': f"ISBN '{isbn}' is already used by another book."}, status=400)
                book.isbn = isbn
            if title:
                book.title = title
            if author:
                book.author = author
            if available is not None:
                book.available = available
                
            book.save()
            return JsonResponse({
                'message': 'Book updated successfully',
                'book': {'id': book.id, 'isbn': book.isbn, 'title': book.title, 'author': book.author, 'available': book.available}
            })
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
            
    elif request.method == 'DELETE':
        # Enforce that borrowed books cannot be deleted before return
        if not book.available:
            return JsonResponse({'error': 'Cannot delete a book that is currently borrowed.'}, status=400)
        book.delete()
        return JsonResponse({'message': 'Book deleted successfully.'})
        
    return JsonResponse({'error': 'Method not allowed.'}, status=405)


# =====================================================================
# VIEWS: TRANSACTIONS (BORROW / RETURN)
# =====================================================================

@csrf_exempt
@log_action
@check_permission()
def borrow_book_view(request):
    """Member borrows an available book."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests allowed.'}, status=405)
        
    try:
        data = json.loads(request.body)
        isbn = data.get('isbn')
        
        if not isbn:
            return JsonResponse({'error': 'ISBN is required to borrow.'}, status=400)
            
        try:
            book = Book.objects.get(isbn=isbn)
        except Book.DoesNotExist:
            return JsonResponse({'error': f"Book with ISBN '{isbn}' not found."}, status=404)
            
        if not book.available:
            return JsonResponse({'error': f"Book '{book.title}' is currently borrowed by another member."}, status=400)
            
        # Check if the member has already borrowed this specific book and hasn't returned it
        if BorrowRecord.objects.filter(member=request.user_member, book=book, return_date__isnull=True).exists():
            return JsonResponse({'error': 'You already have an active borrowing record for this book.'}, status=400)
            
        # Transaction utilizing OOP Library helper
        record = Library.borrow_book(request.user_member, book)
        
        return JsonResponse({
            'message': f"Book '{book.title}' borrowed successfully.",
            'borrow_record': {
                'id': record.id,
                'book_title': book.title,
                'isbn': book.isbn,
                'borrow_date': record.borrow_date.isoformat(),
                'due_date': record.due_date.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)


@csrf_exempt
@log_action
@check_permission()
def return_book_view(request):
    """Member returns a borrowed book."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests allowed.'}, status=405)
        
    try:
        data = json.loads(request.body)
        isbn = data.get('isbn')
        simulated_return_date = data.get('return_date') # For testing late fees
        
        if not isbn:
            return JsonResponse({'error': 'ISBN is required to return.'}, status=400)
            
        try:
            book = Book.objects.get(isbn=isbn)
        except Book.DoesNotExist:
            return JsonResponse({'error': f"Book with ISBN '{isbn}' not found."}, status=404)
            
        # Exception Handling: Find active borrowing record
        try:
            record = BorrowRecord.objects.get(member=request.user_member, book=book, return_date__isnull=True)
        except BorrowRecord.DoesNotExist:
            return JsonResponse({'error': f"No active borrowing record found for book '{book.title}' under your account."}, status=400)
            
        # Date and fee processing
        try:
            ret_date = parse_date(simulated_return_date) if simulated_return_date else datetime.date.today()
        except ValueError as e:
            return JsonResponse({'error': str(e)}, status=400)
            
        # Ensure return date is not before borrow date
        if ret_date < record.borrow_date:
            return JsonResponse({'error': f"Return date ({ret_date}) cannot be earlier than borrow date ({record.borrow_date})."}, status=400)
            
        late_fee = calculate_late_fee(record.borrow_date, return_date=ret_date, due_date=record.due_date)
        
        # Transaction utilizing OOP Library helper
        Library.return_book(record, ret_date, late_fee)
        
        return JsonResponse({
            'message': f"Book '{book.title}' returned successfully.",
            'return_details': {
                'id': record.id,
                'book_title': book.title,
                'borrow_date': record.borrow_date.isoformat(),
                'return_date': record.return_date.isoformat(),
                'due_date': record.due_date.isoformat(),
                'late_fee': float(record.late_fee)
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)


# =====================================================================
# VIEWS: HISTORY & REPORTING
# =====================================================================

@csrf_exempt
@log_action
@check_permission()
def member_history_view(request):
    """
    View borrow history.
    Admin can check history of any member by query param ?member_id=M001.
    Members can only check their own history.
    """
    target_member = request.user_member
    
    query_member_id = request.GET.get('member_id')
    if query_member_id:
        if request.user_member.role != 'Admin' and query_member_id != request.user_member.member_id:
            return JsonResponse({'error': 'Access denied. Members can only view their own history.'}, status=403)
        try:
            target_member = Member.objects.get(member_id=query_member_id)
        except Member.DoesNotExist:
            return JsonResponse({'error': f"Member with ID '{query_member_id}' not found."}, status=404)
            
    records = BorrowRecord.objects.filter(member=target_member)
    history = []
    for r in records:
        # Dynamic late fee if not returned yet
        curr_fee = float(r.late_fee)
        if not r.return_date:
            curr_fee = calculate_late_fee(r.borrow_date, due_date=r.due_date)
            
        history.append({
            'id': r.id,
            'isbn': r.book.isbn,
            'book_title': r.book.title,
            'book_author': r.book.author,
            'borrow_date': r.borrow_date.isoformat(),
            'due_date': r.due_date.isoformat(),
            'return_date': r.return_date.isoformat() if r.return_date else None,
            'late_fee': curr_fee,
            'status': 'Returned' if r.return_date else 'Overdue' if datetime.date.today() > r.due_date else 'Borrowed'
        })
        
    return JsonResponse({
        'member': {
            'member_id': target_member.member_id,
            'name': target_member.name,
            'email': target_member.email,
        },
        'history': history
    })


@csrf_exempt
@log_action
@check_permission(required_role='Admin')
def overdue_books_view(request):
    """
    Yields list of overdue books.
    Demonstrates using Python Generator to process data.
    """
    overdue_list = []
    # Consume Python generator
    for record in yield_overdue_records():
        current_fee = calculate_late_fee(record.borrow_date, due_date=record.due_date)
        overdue_list.append({
            'record_id': record.id,
            'member_id': record.member.member_id,
            'member_name': record.member.name,
            'book_title': record.book.title,
            'isbn': record.book.isbn,
            'borrow_date': record.borrow_date.isoformat(),
            'due_date': record.due_date.isoformat(),
            'current_fee': current_fee
        })
    return JsonResponse({'overdue_books': overdue_list})


# =====================================================================
# VIEWS: CSV IMPORT / EXPORT
# =====================================================================

@csrf_exempt
@log_action
@check_permission(required_role='Admin')
def csv_export_view(request):
    """Exports all books in DB as a CSV download."""
    books = Book.objects.all()
    csv_data = export_books_to_csv_string(books)
    response = HttpResponse(csv_data, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="books_export.csv"'
    return response


@csrf_exempt
@log_action
@check_permission(required_role='Admin')
def csv_import_view(request):
    """Imports books from uploaded CSV file content."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests allowed.'}, status=405)
        
    # Check if a file is uploaded
    if 'file' in request.FILES:
        csv_file = request.FILES['file']
        try:
            csv_content = csv_file.read().decode('utf-8')
        except Exception as e:
            return JsonResponse({'error': f"Failed to read file: {str(e)}"}, status=400)
    else:
        # Or read raw CSV from post body text
        csv_content = request.body.decode('utf-8')
        
    if not csv_content:
        return JsonResponse({'error': 'No CSV content provided.'}, status=400)
        
    count, errors = import_books_from_csv_string(csv_content)
    
    return JsonResponse({
        'message': f"Successfully imported {count} books.",
        'errors': errors
    })


@csrf_exempt
@log_action
@check_permission(required_role='Admin')
def members_list_view(request):
    """View list of registered members (Admin only)."""
    members = Member.objects.all()
    members_data = []
    for m in members:
        members_data.append({
            'member_id': m.member_id,
            'name': m.name,
            'email': m.email,
            'role': m.role
        })
    return JsonResponse({'members': members_data})
