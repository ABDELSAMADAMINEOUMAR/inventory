import os
import django
import sys
sys.path.append(r'c:\Users\DIGITAL AXIS\Downloads\inventory system\backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_backend.settings')
django.setup()

from api.models import Sale, Invoice, Company
from django.db.models import Sum, Count

# 1. Check for rounding mismatches
print("Checking for rounding mismatches...")
mismatches = 0
invoices = Invoice.objects.all()
for inv in invoices:
    sales = inv.items.all()
    sales_revenue = sum(s.revenue for s in sales)
    sales_paid = sum(s.amount_paid for s in sales)
    
    # We allow small float differences if any, but since we used Decimal/Float, let's check
    if abs(sales_revenue - float(inv.total_revenue)) > 0.01:
        print(f"Revenue mismatch on Invoice {inv.invoice_number}: Sales({sales_revenue}) vs Invoice({inv.total_revenue})")
        mismatches += 1
    
    if abs(sales_paid - float(inv.amount_paid)) > 0.01:
        print(f"Paid mismatch on Invoice {inv.invoice_number}: Sales({sales_paid}) vs Invoice({inv.amount_paid})")
        mismatches += 1

if mismatches == 0:
    print("No rounding mismatches found.")

# 2. Check for duplicate invoice_number across different companies
print("\nChecking for duplicate invoice_number values...")
duplicates = Invoice.objects.values('invoice_number').annotate(company_count=Count('company', distinct=True)).filter(company_count__gt=1)
if duplicates:
    print(f"Found {len(duplicates)} duplicate invoice_number(s) spanning multiple companies:")
    for d in duplicates:
        print(d)
else:
    print("No duplicate invoice_number values spanning different companies found.")
