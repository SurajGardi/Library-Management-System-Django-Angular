import datetime
from .book import Book
from .member import Member, BorrowRecord

class Library:
    """
    Class: Library
    Encapsulates core operations of the Library Management System.
    """

    @staticmethod
    def borrow_book(member: Member, book: Book) -> BorrowRecord:
        """
        Borrows a book for a member.
        Flips book availability and creates a BorrowRecord.
        """
        borrow_date = datetime.date.today()
        due_date = borrow_date + datetime.timedelta(days=7)
        
        book.available = False
        book.save()
        
        record = BorrowRecord.objects.create(
            member=member,
            book=book,
            borrow_date=borrow_date,
            due_date=due_date
        )
        return record

    @staticmethod
    def return_book(record: BorrowRecord, return_date: datetime.date, late_fee: float) -> None:
        """
        Returns a borrowed book.
        Restores book availability and updates the BorrowRecord.
        """
        book = record.book
        book.available = True
        book.save()
        
        record.return_date = return_date
        record.late_fee = late_fee
        record.save()
