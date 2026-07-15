from rest_framework import serializers
from .models import Company, User, Category, Supplier, Product, ProductExpense, Sale, BusinessExpense, AuditLog, InventoryEntry


class CompanySerializer(serializers.ModelSerializer):
    admin_email = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = '__all__'

    def get_admin_email(self, obj):
        admin = obj.users.filter(role='admin').first()
        return admin.email if admin else "N/A"


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()
    email = serializers.EmailField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'email', 'role', 'company', 'company_name', 'status',
            'phone', 'business', 'currency', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        if self.instance is not None:
            if not attrs.get('email') and not self.instance.email:
                import uuid
                u_name = attrs.get('username') or self.instance.username or 'user'
                attrs['email'] = f"{u_name}_{uuid.uuid4().hex[:6]}@internal.smartims.local"
            if not attrs.get('username') and not self.instance.username:
                u_name = attrs.get('name', '') or self.instance.name or ''
                attrs['username'] = u_name.lower().replace(' ', '_') if u_name else (self.instance.email.split('@')[0] if self.instance.email else 'user')
            return attrs

        username = attrs.get('username') or attrs.get('name', '').lower().replace(' ', '_')
        email = attrs.get('email')
        if not email:
            import uuid
            email = f"{username}_{uuid.uuid4().hex[:6]}@internal.smartims.local"
            attrs['email'] = email
        if not attrs.get('username'):
            attrs['username'] = username
        return attrs

    def get_company_name(self, obj):
        return obj.company.name if obj.company else "Platform"


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'actor', 'actor_name', 'action', 'target_type', 'target_id', 'created_at']

    def get_actor_name(self, obj):
        return obj.actor.name if obj.actor else "System"


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['company', 'user_id']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['company', 'user_id']


class ProductExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductExpense
        fields = '__all__'
        read_only_fields = ['company', 'user_id']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    supplier_name = serializers.SerializerMethodField()
    total_expenses = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()
    cost_per_unit = serializers.SerializerMethodField()
    current_stock = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    expenses = ProductExpenseSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'company', 'user_id', 'code', 'name', 'category', 'category_name', 'supplier', 'supplier_name',
            'description', 'purchase_price', 'currency', 'exchange_rate', 'quantity',
            'purchase_date', 'status', 'total_expenses', 'total_cost', 'cost_per_unit',
            'current_stock', 'stock_status', 'expenses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'user_id']

    def get_category_name(self, obj):
        return obj.category.name if obj.category else "N/A"

    def get_supplier_name(self, obj):
        return obj.supplier.name if obj.supplier else "N/A"

    def get_total_expenses(self, obj):
        return sum(exp.amount for exp in obj.expenses.all())

    def get_total_cost(self, obj):
        return obj.purchase_price + self.get_total_expenses(obj)

    def get_cost_per_unit(self, obj):
        total_cost = self.get_total_cost(obj)
        return total_cost / obj.quantity if obj.quantity > 0 else total_cost

    def get_current_stock(self, obj):
        sold_qty = sum(sale.quantity for sale in obj.sales.all())
        return max(0, obj.quantity - sold_qty)

    def get_stock_status(self, obj):
        stock = self.get_current_stock(obj)
        if stock == 0:
            return 'out'
        if stock <= 5:
            return 'low'
        return 'available'


class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_code = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            'id', 'company', 'user_id', 'product', 'product_name', 'product_code', 'quantity', 'selling_price',
            'sale_date', 'customer', 'revenue', 'cost', 'profit', 'profit_margin',
            'payment_status', 'amount_paid', 'due_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'user_id', 'revenue', 'cost', 'profit', 'profit_margin']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else "Unknown"

    def get_product_code(self, obj):
        return obj.product.code if obj.product else ""


class BusinessExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessExpense
        fields = '__all__'
        read_only_fields = ['company', 'user_id']


class InventoryEntrySerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_code = serializers.SerializerMethodField()

    class Meta:
        model = InventoryEntry
        fields = [
            'id', 'company', 'user_id', 'product', 'product_name', 'product_code',
            'entry_type', 'quantity', 'notes', 'entry_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'user_id']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else "Unknown"

    def get_product_code(self, obj):
        return obj.product.code if obj.product else ""
