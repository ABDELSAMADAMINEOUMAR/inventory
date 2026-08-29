import sys
sys.path.append(r'c:\Users\DIGITAL AXIS\Downloads\inventory system\backend')
import os
import django
from django.db.models import Sum

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_backend.settings')
django.setup()

from api.models import Sale, Invoice

total_sales = Sale.objects.count()
total_invoices = Invoice.objects.count()

linked_sales = Sale.objects.filter(invoice__isnull=False).count()
orphaned_sales = Sale.objects.filter(invoice__isnull=True).count()

# Pre-migration (calculated from Sale records)
# Since the payment fields were just added to Invoice and remain in Sale for now,
# we can sum revenue and amount_paid from Sale.
sale_revenue_total = Sale.objects.aggregate(Sum('revenue'))['revenue__sum'] or 0
sale_paid_total = Sale.objects.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0

# Post-migration (calculated from Invoice records)
invoice_revenue_total = Invoice.objects.aggregate(Sum('total_revenue'))['total_revenue__sum'] or 0
invoice_paid_total = Invoice.objects.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0

print("="*40)
print("MIGRATION DATA VERIFICATION")
print("="*40)
print(f"Total Sale records: {total_sales}")
print(f"Total Invoice records: {total_invoices}")
print(f"Sales linked to an Invoice: {linked_sales}")
print(f"Sales orphaned (invoice_id is null): {orphaned_sales}")
print("-" * 40)
print("FINANCIAL TOTALS COMPARISON")
print(f"BEFORE (Sum of Sales Revenue):   {sale_revenue_total:.2f}")
print(f"AFTER  (Sum of Invoices Revenue): {invoice_revenue_total:.2f}")
print(f"BEFORE (Sum of Sales Paid):       {sale_paid_total:.2f}")
print(f"AFTER  (Sum of Invoices Paid):   {invoice_paid_total:.2f}")
print("="*40)

if sale_revenue_total != invoice_revenue_total or sale_paid_total != invoice_paid_total:
    print("WARNING: FINANCIAL TOTALS DO NOT MATCH EXACTLY!")
else:
    print("SUCCESS: FINANCIAL TOTALS MATCH PERFECTLY.")
