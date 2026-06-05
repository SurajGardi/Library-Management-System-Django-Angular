import csv
import io
from ..models.book import Book

def export_books_to_csv_string(books_queryset):
    """
    Exports a queryset of books to a CSV formatted string.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write Header
    writer.writerow(['isbn', 'title', 'author', 'available'])
    
    for book in books_queryset:
        writer.writerow([book.isbn, book.title, book.author, book.available])
        
    return output.getvalue()

def import_books_from_csv_string(csv_content):
    """
    Imports books from a CSV formatted string.
    Returns a tuple: (imported_count, list of warning/error messages).
    """
    csv_file = io.StringIO(csv_content.strip())
    reader = csv.reader(csv_file)
    
    try:
        header = next(reader)
    except StopIteration:
        return 0, ["Empty CSV file"]
        
    # Check headers
    header = [h.strip().lower() for h in header]
    if 'isbn' not in header or 'title' not in header or 'author' not in header:
        return 0, ["CSV must contain 'isbn', 'title', and 'author' columns."]
        
    isbn_idx = header.index('isbn')
    title_idx = header.index('title')
    author_idx = header.index('author')
    
    imported_count = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        if not row or all(cell.strip() == "" for cell in row):
            continue # Skip blank rows
            
        if len(row) <= max(isbn_idx, title_idx, author_idx):
            errors.append(f"Row {row_num}: Insufficient columns.")
            continue
            
        isbn = row[isbn_idx].strip()
        title = row[title_idx].strip()
        author = row[author_idx].strip()
        
        if not isbn or not title or not author:
            errors.append(f"Row {row_num}: Missing required book fields.")
            continue
            
        # Exception handling: handle duplicate ISBN / uniqueness check
        if Book.objects.filter(isbn=isbn).exists():
            errors.append(f"Row {row_num}: Book with ISBN '{isbn}' already exists (skipped).")
            continue
            
        try:
            Book.objects.create(
                isbn=isbn,
                title=title,
                author=author,
                available=True
            )
            imported_count += 1
        except Exception as e:
            errors.append(f"Row {row_num}: Failed to create book. Error: {str(e)}")
            
    return imported_count, errors
