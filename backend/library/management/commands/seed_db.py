from django.core.management.base import BaseCommand
from library.models.book import Book
from library.models.member import Member

class Command(BaseCommand):
    help = 'Seeds the database with initial books and reader accounts.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding library database...")

        # 1. Seed Admin Account
        admin, admin_created = Member.objects.get_or_create(
            member_id='A001',
            defaults={
                'name': 'Admin User',
                'email': 'admin@library.com',
                'role': 'Admin'
            }
        )
        admin.set_password('admin123')
        admin.save()
        self.stdout.write("Seed: Admin account configured (admin@library.com / admin123)")

        # 2. Seed Member Account
        member, member_created = Member.objects.get_or_create(
            member_id='M001',
            defaults={
                'name': 'Alice Smith',
                'email': 'alice@library.com',
                'role': 'Member'
            }
        )
        member.set_password('alice123')
        member.save()
        self.stdout.write("Seed: Member account configured (alice@library.com / alice123)")

        # 3. Seed Default Books
        default_books = [
            {'isbn': '123456', 'title': 'Python Basics', 'author': 'John Doe'},
            {'isbn': '789012', 'title': 'Clean Code', 'author': 'Robert C. Martin'},
            {'isbn': '345678', 'title': 'The Pragmatic Programmer', 'author': 'Andy Hunt'},
            {'isbn': '901234', 'title': 'Design Patterns', 'author': 'Erich Gamma'},
            {'isbn': '112233', 'title': 'Introduction to Algorithms', 'author': 'Thomas H. Cormen'}
        ]

        for book_info in default_books:
            book, book_created = Book.objects.get_or_create(
                isbn=book_info['isbn'],
                defaults={
                    'title': book_info['title'],
                    'author': book_info['author'],
                    'available': True
                }
            )
            if book_created:
                self.stdout.write(f"Seed: Book '{book_info['title']}' added.")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
