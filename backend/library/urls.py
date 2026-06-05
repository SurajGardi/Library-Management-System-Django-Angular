from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('members/register/', views.register_member_view, name='register_member'),
    path('members/', views.members_list_view, name='members_list'),
    path('books/', views.books_list_create_view, name='books_list_create'),
    path('books/<int:book_id>/', views.book_detail_view, name='book_detail'),
    path('books/csv-export/', views.csv_export_view, name='csv_export'),
    path('books/csv-import/', views.csv_import_view, name='csv_import'),
    path('borrow/', views.borrow_book_view, name='borrow_book'),
    path('return/', views.return_book_view, name='return_book'),
    path('history/', views.member_history_view, name='member_history'),
    path('overdue/', views.overdue_books_view, name='overdue_books'),
]
