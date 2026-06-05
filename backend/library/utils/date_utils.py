import datetime
from ..models.member import BorrowRecord

def calculate_late_fee(borrow_date, return_date=None, due_date=None):
    """
    Calculates the late fee.
    Standard period is 7 days. Late fee is $1.00 per day after the due date.
    """
    if isinstance(borrow_date, str):
        borrow_date = parse_date(borrow_date)
    if isinstance(return_date, str):
        return_date = parse_date(return_date)
    if isinstance(due_date, str):
        due_date = parse_date(due_date)

    if not due_date:
        due_date = borrow_date + datetime.timedelta(days=7)
    
    actual_return = return_date if return_date else datetime.date.today()
    
    if actual_return > due_date:
        days_late = (actual_return - due_date).days
        return float(days_late * 1.0)
    return 0.0

def parse_date(date_str):
    """
    Safely parses a string date (YYYY-MM-DD) into a datetime.date object.
    Raises ValueError for invalid formats.
    """
    if not date_str:
        return None
    try:
        if isinstance(date_str, datetime.date):
            return date_str
        return datetime.datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except (ValueError, TypeError) as e:
        raise ValueError(f"Date parsing error: '{date_str}' is not in YYYY-MM-DD format.") from e

def yield_overdue_records():
    """
    A generator that yields active BorrowRecords that are past their due date.
    This fulfills the requirement of utilizing a python generator.
    """
    today = datetime.date.today()
    # Find all BorrowRecords where return_date is null and due_date is in the past
    overdue_queryset = BorrowRecord.objects.filter(return_date__isnull=True, due_date__lt=today)
    for record in overdue_queryset:
        yield record
