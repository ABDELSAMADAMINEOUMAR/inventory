from rest_framework import viewsets, views, status
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime
from django.db.models import Q, Sum, Prefetch
from django.db import transaction
from .models import (
    Company, User, Category, Supplier, Product,
    ProductExpense, Sale, BusinessExpense, InventoryEntry, Invoice
)
from .serializers import (
    TenantCompanySerializer, UserSerializer, CategorySerializer, SupplierSerializer,
    ProductSerializer, ProductExpenseSerializer, SaleSerializer,
    BusinessExpenseSerializer, InventoryEntrySerializer, InvoiceSerializer
)
from .permissions import (
    IsCompanyMember, CanAccessDashboard, CanAccessProducts,
    CanAccessInventory, CanAccessCategoriesAndSuppliers, CanAccessSales,
    CanAccessExpenses, CanAccessReports, CanAccessUsers, CanAccessSettings
)
from .utils import on_password_changed, set_validated_password


class CompanyScopedModelViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for all tenant-scoped data.
    Ensures users can only read and mutate objects belonging to their company.
    """
    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(company=user.company)

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(company=user.company, user_id=user.id)


class UserViewSet(CompanyScopedModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsCompanyMember, CanAccessUsers]

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        # When an admin creates a staff/cashier user, create immediately active without email verification
        # Only a real plaintext `password` is accepted. The frontend also sends `password_hash`
        # (a client-side SHA-256 for its offline cache); it must never become the account password.
        pw = self.request.data.get('password')
        candidate = User(
            username=serializer.validated_data.get('username', ''),
            email=serializer.validated_data.get('email', ''),
            name=serializer.validated_data.get('name', ''),
        )
        set_validated_password(candidate, pw)
        instance = serializer.save(
            company=user.company,
            is_active=True,
            must_change_password=False
        )
        instance.password = candidate.password
        instance.save(update_fields=['password'])

    @transaction.atomic
    def perform_update(self, serializer):
        # Only a real plaintext `password` is accepted. The frontend also sends `password_hash`
        # (a client-side SHA-256 for its offline cache); it must never become the account password.
        pw = self.request.data.get('password')
        if pw:
            set_validated_password(serializer.instance, pw)
        instance = serializer.save()
        status_val = self.request.data.get('status')
        if status_val == 'active' and not instance.is_active:
            instance.is_active = True
            instance.save()
        elif status_val == 'deactivated' and instance.is_active:
            instance.is_active = False
            instance.save()

        if pw:
            instance.must_change_password = False
            instance.save()
            try:
                on_password_changed(instance, request=self.request)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"on_password_changed warning: {e}")

    def perform_destroy(self, instance):
        if instance == self.request.user:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You cannot delete your own admin account.")
        if instance.role == 'platform_owner':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Platform owner account cannot be deleted.")
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
            OutstandingToken.objects.filter(user=instance).delete()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Could not clean up outstanding tokens before deleting user: {e}")
        instance.delete()


class CategoryViewSet(CompanyScopedModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsCompanyMember, CanAccessCategoriesAndSuppliers]


class SupplierViewSet(CompanyScopedModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsCompanyMember, CanAccessCategoriesAndSuppliers]


PRODUCT_PREFETCH = ('expenses', 'sales', 'inventory_entries')


class ProductViewSet(CompanyScopedModelViewSet):
    queryset = Product.objects.select_related('category', 'supplier').prefetch_related(*PRODUCT_PREFETCH).order_by('code')
    serializer_class = ProductSerializer
    permission_classes = [IsCompanyMember, CanAccessProducts]


class ProductExpenseViewSet(CompanyScopedModelViewSet):
    queryset = ProductExpense.objects.select_related('product').order_by('-date', '-created_at')
    serializer_class = ProductExpenseSerializer
    permission_classes = [IsCompanyMember, CanAccessExpenses]


class SaleViewSet(CompanyScopedModelViewSet):
    queryset = Sale.objects.select_related('product').order_by('-sale_date', '-created_at')
    serializer_class = SaleSerializer
    permission_classes = [IsCompanyMember, CanAccessSales]


class InvoiceViewSet(CompanyScopedModelViewSet):
    queryset = Invoice.objects.prefetch_related(
        Prefetch('items', queryset=Sale.objects.select_related('product'))
    ).order_by('-sale_date', '-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [IsCompanyMember, CanAccessSales]


class BusinessExpenseViewSet(CompanyScopedModelViewSet):
    queryset = BusinessExpense.objects.all().order_by('-expense_date', '-created_at')
    serializer_class = BusinessExpenseSerializer
    permission_classes = [IsCompanyMember, CanAccessExpenses]


class InventoryEntryViewSet(CompanyScopedModelViewSet):
    queryset = InventoryEntry.objects.select_related('product').order_by('-entry_date', '-created_at')
    serializer_class = InventoryEntrySerializer
    permission_classes = [IsCompanyMember, CanAccessInventory]


class DashboardStatsView(views.APIView):
    """
    Returns aggregated analytics matching getDashboardStats() in frontend db.js,
    now strictly filtered by the authenticated user's company.
    """
    permission_classes = [IsCompanyMember, CanAccessDashboard]

    def get(self, request):
        user = request.user
        company = user.company
        if not company:
            return Response({"detail": "User has no assigned company."}, status=status.HTTP_403_FORBIDDEN)

        products = Product.objects.filter(company=company).prefetch_related(*PRODUCT_PREFETCH)
        sales = Sale.objects.filter(company=company)
        total_categories = Category.objects.filter(company=company).count()
        total_suppliers = Supplier.objects.filter(company=company).count()

        enriched_products = ProductSerializer(products, many=True, context={'request': request}).data
        total_products = len(enriched_products)

        total_investment = sum(p['total_cost'] for p in enriched_products)
        inventory_value = sum(p['cost_per_unit'] * p['current_stock'] for p in enriched_products)

        def _totals(qs):
            agg = qs.aggregate(revenue=Sum('revenue'), profit=Sum('profit'))
            return agg['revenue'] or 0, agg['profit'] or 0

        total_revenue, total_profit = _totals(sales)

        total_import_expenses = sum(p['total_expenses'] for p in enriched_products)
        total_biz_expenses = BusinessExpense.objects.filter(company=company).aggregate(t=Sum('amount'))['t'] or 0
        total_expenses = total_import_expenses + total_biz_expenses

        low_stock = sum(1 for p in enriched_products if p['stock_status'] == 'low')
        out_of_stock = sum(1 for p in enriched_products if p['stock_status'] == 'out')

        today = timezone.localdate()
        sales_today, profit_today = _totals(sales.filter(sale_date=today))
        sales_this_month, profit_this_month = _totals(sales.filter(sale_date__year=today.year, sale_date__month=today.month))

        return Response({
            "totalProducts": total_products,
            "totalCategories": total_categories,
            "totalSuppliers": total_suppliers,
            "totalInvestment": total_investment,
            "inventoryValue": inventory_value,
            "totalRevenue": total_revenue,
            "totalProfit": total_profit,
            "totalExpenses": total_expenses,
            "lowStock": low_stock,
            "outOfStock": out_of_stock,
            "salesToday": sales_today,
            "profitToday": profit_today,
            "salesThisMonth": sales_this_month,
            "profitThisMonth": profit_this_month
        })


class CombinedExpensesView(views.APIView):
    """
    Consolidates product import expenses and business operating expenses for the tenant company.
    """
    permission_classes = [IsCompanyMember, CanAccessExpenses]

    def get(self, request):
        company = request.user.company
        prod_exps = ProductExpense.objects.filter(company=company).select_related('product')
        biz_exps = BusinessExpense.objects.filter(company=company)

        combined = []
        for pe in prod_exps:
            combined.append({
                "id": f"prod_{pe.id}",
                "type": "Product Import Expense",
                "title": f"{pe.product.code} - {pe.expense_type}",
                "amount": pe.amount,
                "date": pe.date or pe.created_at.date(),
                "note": pe.note
            })
        for be in biz_exps:
            combined.append({
                "id": f"biz_{be.id}",
                "type": "Business Expense",
                "title": be.title,
                "amount": be.amount,
                "date": be.expense_date or be.created_at.date(),
                "note": be.note
            })
        combined.sort(key=lambda x: str(x['date']), reverse=True)
        return Response(combined)


class ProfitAndLossReportView(views.APIView):
    """
    Returns Profit & Loss financial statements for the tenant company.
    """
    permission_classes = [IsCompanyMember, CanAccessReports]

    def get(self, request):
        company = request.user.company
        sales_agg = Sale.objects.filter(company=company).aggregate(revenue=Sum('revenue'), cost=Sum('cost'))
        total_revenue = sales_agg['revenue'] or 0
        cogs = sales_agg['cost'] or 0
        gross_profit = total_revenue - cogs
        operating_expenses = (
            (BusinessExpense.objects.filter(company=company).aggregate(t=Sum('amount'))['t'] or 0)
            + (ProductExpense.objects.filter(company=company).aggregate(t=Sum('amount'))['t'] or 0)
        )
        net_profit = gross_profit - operating_expenses
        profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0.0

        return Response({
            "companyName": company.name,
            "totalRevenue": total_revenue,
            "costOfGoodsSold": cogs,
            "grossProfit": gross_profit,
            "operatingExpenses": operating_expenses,
            "netProfit": net_profit,
            "profitMargin": round(profit_margin, 2),
            "generatedAt": timezone.now().isoformat()
        })


class CompanySettingsView(views.APIView):
    """
    Allows Admin to view and update their company settings.
    """
    permission_classes = [IsCompanyMember, CanAccessSettings]

    def get(self, request):
        serializer = TenantCompanySerializer(request.user.company)
        return Response(serializer.data)

    def patch(self, request):
        company = request.user.company
        serializer = TenantCompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            company = serializer.save()
            if 'currency' in request.data and company.currency:
                User.objects.filter(company=company).update(currency=company.currency)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
