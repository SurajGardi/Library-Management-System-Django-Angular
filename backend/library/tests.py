from django.test import TestCase
import datetime
from decimal import Decimal

from .models.book import Book
from .models.member import Member, BorrowRecord
from .utils.date_utils import calculate_late_fee, yield_overdue_records

class LibraryManagementSystemTests(TestCase):

    def setUp(self):
        # Set up initial test objects
        self.admin = Member.objects.create(
            member_id="A001",
            name="Admin User",
            email="admin@library.com",
            role="Admin"
        )
        self.admin.set_password("adminpass")
        self.admin.save()

        self.member = Member.objects.create(
            member_id="M001",
            name="Alice Smith",
            email="alice@library.com",
            role="Member"
        )
        self.member.set_password("memberpass")
        self.member.save()

        self.book1 = Book.objects.create(
            isbn="111-11111",
            title="Introduction to Python",
            author="Guido van Rossum",
            available=True
        )

        self.book2 = Book.objects.create(
            isbn="222-22222",
            title="Clean Code",
            author="Robert C. Martin",
            available=True
        )

    # Test Case 1: Member Registration & Password Hashing
    def test_member_registration_and_password_hashing(self):
        member = Member.objects.get(member_id="M001")
        self.assertEqual(member.name, "Alice Smith")
        # Verify that the password is not stored in plain text
        self.assertNotEqual(member.password_hash, "memberpass")
        # Verify that the password checks out
        self.assertTrue(member.check_password("memberpass"))
        self.assertFalse(member.check_password("wrongpass"))

    # Test Case 2: Unique ISBN Prevention (Uniqueness constraints)
    def test_unique_isbn_constraint(self):
        with self.assertRaises(Exception):
            # Attempt to create another book with duplicate ISBN
            Book.objects.create(
                isbn="111-11111",
                title="Duplicate ISBN Book",
                author="Unknown Author"
            )

    # Test Case 3: Borrow Book Logic & Data Persistence
    def test_borrow_book_logic(self):
        # Verify book starts as available
        self.assertTrue(self.book1.available)
        
        # Borrow book
        self.book1.available = False
        self.book1.save()
        
        borrow_date = datetime.date.today()
        due_date = borrow_date + datetime.timedelta(days=7)
        
        record = BorrowRecord.objects.create(
            member=self.member,
            book=self.book1,
            borrow_date=borrow_date,
            due_date=due_date
        )
        
        # Check database persistence
        db_record = BorrowRecord.objects.get(id=record.id)
        self.assertEqual(db_record.member.member_id, "M001")
        self.assertEqual(db_record.book.isbn, "111-11111")
        self.assertFalse(db_record.book.available)
        self.assertIsNone(db_record.return_date)

    # Test Case 4: Return Book within Due Date (No Late Fee)
    def test_return_book_no_fee(self):
        borrow_date = datetime.date.today()
        due_date = borrow_date + datetime.timedelta(days=7)
        
        # Borrow and save
        self.book1.available = False
        self.book1.save()
        record = BorrowRecord.objects.create(
            member=self.member,
            book=self.book1,
            borrow_date=borrow_date,
            due_date=due_date
        )
        
        # Return on same day
        record.return_date = borrow_date
        fee = calculate_late_fee(record.borrow_date, return_date=record.return_date, due_date=record.due_date)
        record.late_fee = Decimal(fee)
        record.save()
        
        self.assertEqual(record.late_fee, Decimal('0.0'))

    # Test Case 5: Return Book after Due Date (Late Fee of $1/day)
    def test_return_book_with_late_fee(self):
        borrow_date = datetime.date.today() - datetime.timedelta(days=12) # Borrowed 12 days ago
        due_date = borrow_date + datetime.timedelta(days=7) # Due 5 days ago
        
        # Return today (5 days late)
        return_date = datetime.date.today()
        
        fee = calculate_late_fee(borrow_date, return_date=return_date, due_date=due_date)
        # Expected fee: 5 days late * $1 = $5.00
        self.assertEqual(fee, 5.0)

    # Test Case 6: Overdue Generator Listing
    def test_overdue_generator(self):
        borrow_date = datetime.date.today() - datetime.timedelta(days=10) # 10 days ago
        due_date = borrow_date + datetime.timedelta(days=7) # 3 days ago
        
        # Create overdue borrowing
        self.book2.available = False
        self.book2.save()
        record = BorrowRecord.objects.create(
            member=self.member,
            book=self.book2,
            borrow_date=borrow_date,
            due_date=due_date
        )
        
        # Query generator
        overdue_records = list(yield_overdue_records())
        
        # Verify our record is yielded by the generator
        self.assertIn(record, overdue_records)
        self.assertEqual(len(overdue_records), 1)
        self.assertEqual(overdue_records[0].book.isbn, "222-22222")
