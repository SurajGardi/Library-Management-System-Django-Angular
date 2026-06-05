import hashlib
from django.db import models
from .book import Book

class Member(models.Model):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Member', 'Member'),
    ]

    member_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=64)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Member')

    def set_password(self, password):
        """Hashes the password using SHA-256 for basic data security."""
        self.password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

    def check_password(self, password):
        """Verifies if the provided password matches the stored hash."""
        hashed = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return self.password_hash == hashed

    class Meta:
        ordering = ['member_id']

    def __str__(self):
        return f"{self.name} ({self.member_id}) - {self.role}"


class BorrowRecord(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='borrowed_records')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrow_records')
    borrow_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    late_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)

    class Meta:
        ordering = ['-borrow_date']

    def __str__(self):
        status = "Returned" if self.return_date else "Borrowed"
        return f"{self.member.name} borrowed {self.book.title} ({status})"
