from rest_framework import viewsets, views, status
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime
from django.db.models import Q
from .models import (
    Company, User, Category, Supplier, Product,
    ProductExpense, Sale, BusinessExpense, InventoryEntry
)
from .serializers import (
    CompanySerializer, UserSerializer, CategorySerializer, SupplierSerializer,
    ProductSerializer, ProductExpenseSerializer, SaleSerializer,
    BusinessExpenseSerializer, InventoryEntrySerializer
)
from .permissions import (
    IsCompanyMember, CanAccessDashboard, CanAccessProducts,
    CanAccessInventory, CanAccessCategoriesAndSuppliers, CanAccessSales,
    CanAccessExpenses, CanAccessReports, CanAccessUsers, CanAccessSettings
)
from .utils import on_password_changed, send_verification_email


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

    def perform_create(self, serializer):
        user = self.request.user
        # When an admin creates a staff/cashier user, create immediately active without email verification
        username = self.request.data.get('username') or self.request.data.get('name', '').lower().replace(' ', '_')
        instance = serializer.save(
            company=user.company,
            is_active=True,
            must_change_password=False
        )
        if username:
            instance.username = username
        pw = self.request.data.get('password') or self.request.data.get('password_hash') or 'defaultpass123'
        instance.set_password(pw)
        instance.save()

    def perform_update(self, serializer):
        instance = serializer.save()
        status_val = self.request.data.get('status')
        if status_val == 'active' and not instance.is_active:
            instance.is_active = True
            instance.save()
        elif status_val == 'deactivated' and instance.is_active:
            instance.is_active = False
            instance.save()

        pw = self.request.data.get('password') or self.request.data.get('password_hash')
        if pw:
            instance.set_password(pw)
            instance.must_change_password = False
            instance.save()
            on_password_changed(instance, request=self.request)


class CategoryViewSet(CompanyScopedModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsCompanyMember, CanAccessCategoriesAndSuppliers]


class SupplierViewSet(CompanyScopedModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsCompanyMember, CanAccessCategoriesAndSuppliers]


class ProductViewSet(CompanyScopedModelViewSet):
    queryset = Product.objects.all().order_by('code')
    serializer_class = ProductSerializer
    permission_classes = [IsCompanyMember, CanAccessProducts]


class ProductExpenseViewSet(CompanyScopedModelViewSet):
    queryset = ProductExpense.objects.all().order_by('-date', '-created_at')
    serializer_class = ProductExpenseSerializer
    permission_classes = [IsCompanyMember, CanAccessExpenses]


class SaleViewSet(CompanyScopedModelViewSet):
    queryset = Sale.objects.all().order_by('-sale_date', '-created_at')
    serializer_class = SaleSerializer
    permission_classes = [IsCompanyMember, CanAccessSales]


class BusinessExpenseViewSet(CompanyScopedModelViewSet):
    queryset = BusinessExpense.objects.all().order_by('-expense_date', '-created_at')
    serializer_class = BusinessExpenseSerializer
    permission_classes = [IsCompanyMember, CanAccessExpenses]


class InventoryEntryViewSet(CompanyScopedModelViewSet):
    queryset = InventoryEntry.objects.all().order_by('-entry_date', '-created_at')
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

        products = Product.objects.filter(company=company)
        sales = Sale.objects.filter(company=company)
        biz_expenses = BusinessExpense.objects.filter(company=company)
        total_categories = Category.objects.filter(company=company).count()
        total_suppliers = Supplier.objects.filter(company=company).count()

        total_products = products.count()

        # Calculate product stats using serializer logic
        product_serializer = ProductSerializer(products, many=True)
        enriched_products = product_serializer.data

        total_investment = sum(p['total_cost'] for p in enriched_products)
        inventory_value = sum(p['cost_per_unit'] * p['current_stock'] for p in enriched_products)

        total_revenue = sum(s.revenue for s in sales)
        total_profit = sum(s.profit for s in sales)
        
        total_import_expenses = sum(p['total_expenses'] for p in enriched_products)
        total_biz_expenses = sum(e.amount for e in biz_expenses)
        total_expenses = total_import_expenses + total_biz_expenses

        low_stock = sum(1 for p in enriched_products if p['stock_status'] == 'low')
        out_of_stock = sum(1 for p in enriched_products if p['stock_status'] == 'out')

        today_str = timezone.now().date().isoformat()
        today_sales = [s for s in sales if s.sale_date and s.sale_date.isoformat() == today_str]
        sales_today = sum(s.revenue for s in today_sales)
        profit_today = sum(s.profit for s in today_sales)

        this_month_str = today_str[:7]
        month_sales = [s for s in sales if s.sale_date and s.sale_date.isoformat().startswith(this_month_str)]
        sales_this_month = sum(s.revenue for s in month_sales)
        profit_this_month = sum(s.profit for s in month_sales)

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
        prod_exps = ProductExpense.objects.filter(company=company)
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
        sales = Sale.objects.filter(company=company)
        prod_exps = ProductExpense.objects.filter(company=company)
        biz_exps = BusinessExpense.objects.filter(company=company)

        total_revenue = sum(s.revenue for s in sales)
        cogs = sum(s.cost for s in sales)
        gross_profit = total_revenue - cogs
        operating_expenses = sum(be.amount for be in biz_exps) + sum(pe.amount for pe in prod_exps)
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
        serializer = CompanySerializer(request.user.company)
        return Response(serializer.data)

    def patch(self, request):
        company = request.user.company
        serializer = CompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
