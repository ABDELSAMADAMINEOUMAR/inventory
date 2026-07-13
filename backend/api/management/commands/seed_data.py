from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import hashlib
from api.models import User, Category, Supplier, Product, ProductExpense, Sale, BusinessExpense


class Command(BaseCommand):
    help = 'Seed the database with initial demo inventory data matching js/db.js'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting database seeding..."))

        if User.objects.exists() or Category.objects.exists():
            self.stdout.write(self.style.WARNING("Database already contains data! Clearing existing data for fresh seed..."))
            Sale.objects.all().delete()
            ProductExpense.objects.all().delete()
            Product.objects.all().delete()
            Supplier.objects.all().delete()
            Category.objects.all().delete()
            BusinessExpense.objects.all().delete()
            User.objects.all().delete()

        # Users
        pw_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        User.objects.create(
            name='Admin User', email='admin@business.com', password_hash=pw_hash,
            role='admin', phone='+250788000000', business='My Import Business', currency='USD'
        )

        # Categories
        cat_data = [
            {'name': 'Electronics', 'description': 'Electronic devices and accessories'},
            {'name': 'Clothing', 'description': 'Garments and fashion items'},
            {'name': 'Food & Beverage', 'description': 'Consumable food and drink products'},
            {'name': 'Cosmetics', 'description': 'Beauty and personal care products'},
            {'name': 'Home Appliances', 'description': 'Household appliances and equipment'},
            {'name': 'Furniture', 'description': 'Home and office furniture'},
        ]
        cats = [Category.objects.create(**c) for c in cat_data]

        # Suppliers
        supp_data = [
            {'name': 'Cairo Electronics Co.', 'phone': '+20112345678', 'email': 'info@cairoelec.com', 'address': '15 Tahrir St', 'country': 'Egypt', 'notes': 'Reliable electronics supplier'},
            {'name': 'Nile Fashion House', 'phone': '+20123456789', 'email': 'contact@nilefashion.com', 'address': '22 Ramses Ave', 'country': 'Egypt', 'notes': 'Clothing and accessories'},
            {'name': 'Delta Goods Ltd.', 'phone': '+20198765432', 'email': 'sales@deltagoods.com', 'address': '5 Port Said Rd', 'country': 'Egypt', 'notes': 'General merchandise'},
            {'name': 'Luxor Cosmetics', 'phone': '+20187654321', 'email': 'info@luxorcosm.com', 'address': '10 Queen St', 'country': 'Egypt', 'notes': 'Premium cosmetics'},
        ]
        supps = [Supplier.objects.create(**s) for s in supp_data]

        today = timezone.now().date()
        def days_ago(n): return today - timedelta(days=n)

        # Products & Expenses
        products_info = [
            {
                'code': 'PRD-001', 'name': 'Samsung LED TV 43"', 'category': cats[0], 'supplier': supps[0],
                'description': '43 inch LED Smart TV', 'purchase_price': 180000, 'currency': 'FCFA', 'exchange_rate': 1.0,
                'quantity': 20, 'purchase_date': days_ago(60), 'status': 'available',
                'expenses': [
                    {'expense_type': 'Shipping', 'amount': 80000, 'note': 'Sea freight'},
                    {'expense_type': 'Customs Duty', 'amount': 50000, 'note': 'Customs'},
                    {'expense_type': 'Transportation', 'amount': 20000, 'note': 'Port to warehouse'},
                    {'expense_type': 'Insurance', 'amount': 10000, 'note': 'Cargo insurance'},
                ]
            },
            {
                'code': 'PRD-002', 'name': 'iPhone 13 Case (Pack of 50)', 'category': cats[0], 'supplier': supps[0],
                'description': 'Protective phone cases assorted colors', 'purchase_price': 90000, 'currency': 'FCFA', 'exchange_rate': 1.0,
                'quantity': 50, 'purchase_date': days_ago(45), 'status': 'available',
                'expenses': [
                    {'expense_type': 'Shipping', 'amount': 18000, 'note': 'Air freight'},
                    {'expense_type': 'Customs Duty', 'amount': 12000, 'note': 'Customs'},
                    {'expense_type': 'Packaging', 'amount': 6000, 'note': 'Packaging material'},
                ]
            },
            {
                'code': 'PRD-003', 'name': "Men's Polo Shirts (100 pcs)", 'category': cats[1], 'supplier': supps[1],
                'description': 'Assorted colors polo shirts size M-XL', 'purchase_price': 240000, 'currency': 'FCFA', 'exchange_rate': 1.0,
                'quantity': 100, 'purchase_date': days_ago(30), 'status': 'available',
                'expenses': [
                    {'expense_type': 'Shipping', 'amount': 36000, 'note': 'Sea freight'},
                    {'expense_type': 'Customs Duty', 'amount': 48000, 'note': 'Customs'},
                    {'expense_type': 'Transportation', 'amount': 12000, 'note': 'Delivery'},
                ]
            },
            {
                'code': 'PRD-004', 'name': 'Face Cream Set (24 pcs)', 'category': cats[3], 'supplier': supps[3],
                'description': 'Luxury face cream and serum combo', 'purchase_price': 144000, 'currency': 'FCFA', 'exchange_rate': 1.0,
                'quantity': 24, 'purchase_date': days_ago(20), 'status': 'available',
                'expenses': [
                    {'expense_type': 'Shipping', 'amount': 24000, 'note': 'Air freight'},
                    {'expense_type': 'Customs Duty', 'amount': 21600, 'note': 'Customs'},
                    {'expense_type': 'Insurance', 'amount': 7200, 'note': 'Cargo insurance'},
                ]
            },
            {
                'code': 'PRD-005', 'name': 'Bluetooth Earbuds (30 pcs)', 'category': cats[0], 'supplier': supps[0],
                'description': 'Wireless earbuds with charging case', 'purchase_price': 108000, 'currency': 'FCFA', 'exchange_rate': 1.0,
                'quantity': 30, 'purchase_date': days_ago(15), 'status': 'available',
                'expenses': [
                    {'expense_type': 'Shipping', 'amount': 15000, 'note': 'Air freight'},
                    {'expense_type': 'Customs Duty', 'amount': 16200, 'note': 'Customs'},
                    {'expense_type': 'Packaging', 'amount': 4800, 'note': 'Display boxes'},
                ]
            },
        ]

        created_prods = []
        for pinfo in products_info:
            exps = pinfo.pop('expenses')
            prod = Product.objects.create(**pinfo)
            created_prods.append(prod)
            for e in exps:
                ProductExpense.objects.create(product=prod, date=days_ago(5), **e)

        # Sales
        sales_info = [
            {'product': created_prods[0], 'quantity': 3, 'selling_price': 420000, 'sale_date': days_ago(50), 'customer': 'John Electronics'},
            {'product': created_prods[0], 'quantity': 2, 'selling_price': 420000, 'sale_date': days_ago(40), 'customer': 'Kigali Shop'},
            {'product': created_prods[1], 'quantity': 15, 'selling_price': 6000, 'sale_date': days_ago(35), 'customer': 'Mobile Store RW'},
            {'product': created_prods[2], 'quantity': 30, 'selling_price': 6000, 'sale_date': days_ago(25), 'customer': 'Fashion Kigali'},
            {'product': created_prods[3], 'quantity': 10, 'selling_price': 16000, 'sale_date': days_ago(15), 'customer': 'Beauty Palace'},
            {'product': created_prods[4], 'quantity': 8, 'selling_price': 12000, 'sale_date': days_ago(10), 'customer': 'Tech Hub RW'},
        ]
        for s in sales_info:
            Sale.objects.create(**s)

        # Business Expenses
        biz_expenses = [
            {'title': 'Office Rent', 'amount': 300000, 'category': 'Rent', 'expense_date': days_ago(60), 'note': 'Monthly office rent'},
            {'title': 'Electricity Bill', 'amount': 48000, 'category': 'Electricity', 'expense_date': days_ago(58), 'note': ''},
            {'title': 'Internet Service', 'amount': 30000, 'category': 'Internet', 'expense_date': days_ago(58), 'note': 'Monthly broadband'},
            {'title': 'Staff Salary', 'amount': 480000, 'category': 'Salary', 'expense_date': days_ago(30), 'note': 'Monthly salary'},
        ]
        for be in biz_expenses:
            BusinessExpense.objects.create(**be)

        self.stdout.write(self.style.SUCCESS("Successfully seeded database with demo data!"))
