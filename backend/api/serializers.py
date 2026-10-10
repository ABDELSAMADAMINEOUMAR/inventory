from django.db import transaction
from rest_framework import serializers
from .models import Company, User, Category, Supplier, Product, ProductExpense, Sale, BusinessExpense, AuditLog, InventoryEntry, Invoice


# Roles a company admin may assign. 'platform_owner' can never be granted through the API.
TENANT_ROLES = ['admin', 'manager', 'cashier', 'staff']


def _round_money(value):
    return round(float(value or 0), 2)


def product_stock(product, exclude_invoice=None):
    """
    Units currently in stock: initial quantity + stock-in - stock-out + adjustments - units sold.
    Uses prefetched relations when available. `exclude_invoice` ignores the items of an invoice
    that is being edited, so its old quantities don't count against the new ones.
    """
    sold = sum(s.quantity for s in product.sales.all() if exclude_invoice is None or s.invoice_id != exclude_invoice.pk)
    moved = 0
    for e in product.inventory_entries.all():
        if e.entry_type == 'in':
            moved += e.quantity
        elif e.entry_type == 'out':
            moved -= e.quantity
        else:
            moved += e.quantity
    return product.quantity + moved - sold


def _lock_products(product_ids):
    """Lock product rows for the rest of the transaction so concurrent sales can't oversell."""
    return {p.pk: p for p in Product.objects.select_for_update().filter(pk__in=list(product_ids))}


class TenantScopedSerializerMixin:
    """
    Restricts every writable foreign key to objects of the requesting user's company,
    so one tenant can never reference (or read through) another tenant's records.
    """
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        company = getattr(getattr(request, 'user', None), 'company', None)
        for field in fields.values():
            if isinstance(field, serializers.PrimaryKeyRelatedField) and not field.read_only and field.queryset is not None:
                model = field.queryset.model
                if any(f.name == 'company' for f in model._meta.get_fields()):
                    field.queryset = field.queryset.filter(company=company) if company else field.queryset.none()
        return fields


class CompanySerializer(serializers.ModelSerializer):
    """Full company serializer, used by Platform Owners only."""
    admin_email = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = '__all__'

    def get_admin_email(self, obj):
        admin = obj.users.filter(role='admin').first()
        return admin.email if admin else "N/A"


class TenantCompanySerializer(CompanySerializer):
    """Company serializer for tenant admins: only name and currency are editable."""
    class Meta(CompanySerializer.Meta):
        read_only_fields = [
            'subscription_plan', 'status', 'monthly_fee', 'is_deleted', 'deleted_at',
            'created_at', 'updated_at',
        ]


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()
    email = serializers.EmailField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=TENANT_ROLES, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'email', 'role', 'company', 'company_name', 'status',
            'phone', 'business', 'currency', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'is_active', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context.get('request')
        if self.instance is not None and request is not None and self.instance.pk == request.user.pk:
            if 'role' in attrs and attrs['role'] != self.instance.role:
                raise serializers.ValidationError({"role": "You cannot change your own role."})
            if attrs.get('status') == 'deactivated':
                raise serializers.ValidationError({"status": "You cannot deactivate your own account."})

        if self.instance is not None:
            if not attrs.get('email') and not self.instance.email:
                import uuid
                u_name = attrs.get('username') or self.instance.username or 'user'
                attrs['email'] = f"{u_name}_{uuid.uuid4().hex[:6]}@internal.smartims.local"
            if not attrs.get('username') and not self.instance.username:
                u_name = attrs.get('name', '') or self.instance.name or ''
                attrs['username'] = u_name.lower().replace(' ', '_') if u_name else (self.instance.email.split('@')[0] if self.instance.email else 'user')
        else:
            attrs.setdefault('role', 'staff')  # least privilege when the caller doesn't specify a role
            username = attrs.get('username') or attrs.get('name', '').lower().replace(' ', '_')
            if not attrs.get('email'):
                import uuid
                attrs['email'] = f"{username}_{uuid.uuid4().hex[:6]}@internal.smartims.local"
            if not attrs.get('username'):
                attrs['username'] = username

        others = User.objects.exclude(pk=self.instance.pk) if self.instance is not None else User.objects.all()
        if attrs.get('username') and others.filter(username__iexact=attrs['username']).exists():
            raise serializers.ValidationError({"username": "This username already exists."})
        if attrs.get('email') and others.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError({"email": "This email already has an account."})
        return attrs

    def get_company_name(self, obj):
        return obj.company.name if obj.company else "Platform"


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'actor', 'actor_name', 'company', 'action', 'target_type', 'target_id', 'created_at']

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


class ProductExpenseSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = ProductExpense
        fields = '__all__'
        read_only_fields = ['company', 'user_id']


class ProductSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
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
            'description', 'purchase_price', 'selling_price', 'currency', 'exchange_rate', 'quantity',
            'purchase_date', 'status', 'total_expenses', 'total_cost', 'cost_per_unit',
            'current_stock', 'stock_status', 'expenses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'user_id']

    def validate_code(self, value):
        request = self.context.get('request')
        company = getattr(getattr(request, 'user', None), 'company', None)
        qs = Product.objects.filter(company=company, code=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this code already exists.")
        return value

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
        return max(0, product_stock(obj))

    def get_stock_status(self, obj):
        stock = self.get_current_stock(obj)
        if stock == 0:
            return 'out'
        if stock <= 5:
            return 'low'
        return 'available'


class SaleSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_code = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            'id', 'invoice', 'company', 'user_id', 'product', 'product_name', 'product_code', 'quantity', 'selling_price',
            'sale_date', 'customer', 'revenue', 'cost', 'profit', 'profit_margin',
            'payment_status', 'amount_paid', 'due_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'user_id', 'revenue', 'cost', 'profit', 'profit_margin']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else "Unknown"

    def get_product_code(self, obj):
        return obj.product.code if obj.product else ""

    def _check_stock(self, product, quantity):
        locked = _lock_products([product.pk])[product.pk]
        available = product_stock(locked)
        if self.instance is not None and self.instance.product_id == locked.pk:
            available += self.instance.quantity
        if quantity > available:
            raise serializers.ValidationError({"quantity": f"Insufficient stock for {locked.name}: only {max(0, available)} available."})

    @transaction.atomic
    def create(self, validated_data):
        self._check_stock(validated_data['product'], validated_data.get('quantity', 1))
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        product = validated_data.get('product', instance.product)
        quantity = validated_data.get('quantity', instance.quantity)
        self._check_stock(product, quantity)
        return super().update(instance, validated_data)


class InvoiceItemSerializer(serializers.Serializer):
    """Validates one invoice line. Revenue/cost/profit are always computed by the server."""
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    selling_price = serializers.FloatField(min_value=0)

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = {
                'product': data.get('product', data.get('productId')),
                'quantity': data.get('quantity', 1),
                'selling_price': data.get('selling_price', data.get('sellingPrice', 0)),
            }
        return super().to_internal_value(data)


class InvoiceSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    items = SaleSerializer(many=True, read_only=True)

    # The frontend sends camelCase keys; accept both spellings.
    CAMEL_CASE_ALIASES = {
        'invoiceNumber': 'invoice_number',
        'customerPhone': 'customer_phone',
        'saleDate': 'sale_date',
        'totalRevenue': 'total_revenue',
        'amountPaid': 'amount_paid',
        'paymentStatus': 'payment_status',
        'dueDate': 'due_date',
        'paidAt': 'paid_at',
    }

    class Meta:
        model = Invoice
        fields = [
            'id', 'company', 'user_id', 'invoice_number', 'customer', 'customer_phone', 'sale_date',
            'note', 'total_revenue', 'amount_paid', 'payment_status', 'due_date', 'paid_at',
            'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['company', 'user_id', 'total_revenue', 'created_at', 'updated_at']
        # Uniqueness per company is checked in validate() because `company` is read-only here.
        validators = []

    def to_internal_value(self, data):
        if hasattr(data, 'items'):
            data = dict(data.items())
            for camel, snake in self.CAMEL_CASE_ALIASES.items():
                if camel in data and snake not in data:
                    data[snake] = data[camel]
        return super().to_internal_value(data)

    def _items_payload(self):
        raw = self.initial_data.get('items') if hasattr(self.initial_data, 'get') else None
        if raw is None:
            return None
        item_serializer = InvoiceItemSerializer(data=raw, many=True, context=self.context)
        request = self.context.get('request')
        company = getattr(getattr(request, 'user', None), 'company', None)
        item_serializer.child.fields['product'].queryset = Product.objects.filter(company=company) if company else Product.objects.none()
        if not item_serializer.is_valid():
            raise serializers.ValidationError({"items": item_serializer.errors})
        return item_serializer.validated_data

    def validate(self, attrs):
        request = self.context.get('request')
        company = getattr(getattr(request, 'user', None), 'company', None)
        number = attrs.get('invoice_number')
        if number:
            qs = Invoice.objects.filter(company=company, invoice_number=number)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"invoice_number": "An invoice with this number already exists."})
        self._validated_items = self._items_payload()
        if self.instance is None and not self._validated_items:
            raise serializers.ValidationError({"items": "An invoice needs at least one item."})
        return attrs

    def _check_stock(self, items, exclude_invoice=None):
        wanted = {}
        for item in items:
            wanted[item['product'].pk] = wanted.get(item['product'].pk, 0) + item['quantity']
        locked = _lock_products(wanted.keys())
        for pid, qty in wanted.items():
            product = locked[pid]
            available = product_stock(product, exclude_invoice=exclude_invoice)
            if qty > available:
                raise serializers.ValidationError({"items": f"Insufficient stock for {product.name}: only {max(0, available)} available."})

    def _save_items(self, invoice, items):
        for item in items:
            Sale.objects.create(
                invoice=invoice,
                company=invoice.company,
                user_id=invoice.user_id,
                product=item['product'],
                quantity=item['quantity'],
                selling_price=item['selling_price'],
                sale_date=invoice.sale_date,
                customer=invoice.customer,
            )

    def _apply_totals(self, invoice, total_revenue):
        invoice.total_revenue = _round_money(total_revenue)
        paid = invoice.amount_paid if invoice.amount_paid is not None else invoice.total_revenue
        invoice.amount_paid = _round_money(min(max(0.0, paid), invoice.total_revenue))
        invoice.payment_status = 'paid' if invoice.amount_paid >= invoice.total_revenue - 0.01 else 'credit'
        if invoice.payment_status == 'paid':
            invoice.due_date = None
        else:
            invoice.paid_at = None

    @transaction.atomic
    def create(self, validated_data):
        items = self._validated_items
        self._check_stock(items)
        invoice = Invoice(**validated_data)
        if 'amount_paid' not in validated_data:
            invoice.amount_paid = None  # not specified: treat as paid in full
        self._apply_totals(invoice, sum(i['quantity'] * i['selling_price'] for i in items))
        invoice.save()
        self._save_items(invoice, items)
        return invoice

    @transaction.atomic
    def update(self, instance, validated_data):
        items = self._validated_items
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if items is not None:
            self._check_stock(items, exclude_invoice=instance)
            instance.items.all().delete()
            self._apply_totals(instance, sum(i['quantity'] * i['selling_price'] for i in items))
            instance.save()
            self._save_items(instance, items)
        else:
            self._apply_totals(instance, instance.total_revenue)
            instance.save()
            instance.items.update(sale_date=instance.sale_date, customer=instance.customer)
        return instance


class BusinessExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessExpense
        fields = '__all__'
        read_only_fields = ['company', 'user_id']


class InventoryEntrySerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_code = serializers.SerializerMethodField()

    class Meta:
        model = InventoryEntry
        fields = [
            'id', 'company', 'user_id', 'product', 'product_name', 'product_code',
            'entry_type', 'quantity', 'notes', 'entry_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'user_id']

    def validate(self, attrs):
        entry_type = attrs.get('entry_type', getattr(self.instance, 'entry_type', 'in'))
        quantity = attrs.get('quantity', getattr(self.instance, 'quantity', 0))
        if entry_type in ('in', 'out') and quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})
        return attrs

    def _check_stock(self, attrs):
        entry_type = attrs.get('entry_type', getattr(self.instance, 'entry_type', 'in'))
        quantity = attrs.get('quantity', getattr(self.instance, 'quantity', 0))
        product = attrs.get('product', getattr(self.instance, 'product', None))
        removed = quantity if entry_type == 'out' else (-quantity if entry_type == 'adjustment' else 0)
        if removed <= 0 or product is None:
            return
        locked = _lock_products([product.pk])[product.pk]
        available = product_stock(locked)
        if self.instance is not None and self.instance.product_id == locked.pk:
            old = self.instance
            available += old.quantity if old.entry_type == 'out' else (-old.quantity)
        if removed > available:
            raise serializers.ValidationError({"quantity": f"Insufficient stock for {locked.name}: only {max(0, available)} available."})

    @transaction.atomic
    def create(self, validated_data):
        self._check_stock(validated_data)
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        self._check_stock(validated_data)
        return super().update(instance, validated_data)

    def get_product_name(self, obj):
        return obj.product.name if obj.product else "Unknown"

    def get_product_code(self, obj):
        return obj.product.code if obj.product else ""
