from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class Company(models.Model):
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
    ]
    name = models.CharField(max_length=255)
    subscription_plan = models.CharField(max_length=50, choices=PLAN_CHOICES, default='free')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    currency = models.CharField(max_length=10, default='RWF')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Companies"

    def __str__(self):
        return f"{self.name} ({self.get_subscription_plan_display()} - {self.get_status_display()})"


class User(AbstractUser):
    ROLE_CHOICES = [
        ('platform_owner', 'Platform Owner'),
        ('admin', 'Company Admin (Owner)'),
        ('manager', 'Manager (Supervisor)'),
        ('cashier', 'Cashier (Sales Rep)'),
        ('staff', 'Staff (Warehouse)'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('deactivated', 'Deactivated'),
    ]
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='admin')
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)
    phone = models.CharField(max_length=50, blank=True, null=True)
    business = models.CharField(max_length=255, blank=True, null=True)
    currency = models.CharField(max_length=10, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if self.status == 'deactivated':
            self.is_active = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.email}) - {self.role}"


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=255)
    target_type = models.CharField(max_length=100)
    target_id = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor} performed {self.action} on {self.target_type} ({self.target_id}) at {self.created_at}"


class Category(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='categories', null=True, blank=True)
    user_id = models.IntegerField(default=1, null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Supplier(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='suppliers', null=True, blank=True)
    user_id = models.IntegerField(default=1, null=True, blank=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    user_id = models.IntegerField(default=1, null=True, blank=True)
    code = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, related_name='products')
    description = models.TextField(blank=True, null=True)
    purchase_price = models.FloatField(default=0.0)
    currency = models.CharField(max_length=10, default='USD')
    exchange_rate = models.FloatField(default=1.0)
    quantity = models.IntegerField(default=0)
    purchase_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=50, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'code')

    def __str__(self):
        return f"{self.code} - {self.name}"


class ProductExpense(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='product_expenses', null=True, blank=True)
    user_id = models.IntegerField(default=1, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='expenses')
    expense_type = models.CharField(max_length=100)
    amount = models.FloatField(default=0.0)
    note = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.code} - {self.expense_type}: {self.amount}"


class Sale(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='sales', null=True, blank=True)
    user_id = models.IntegerField(default=1, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sales')
    quantity = models.IntegerField(default=1)
    selling_price = models.FloatField(default=0.0)
    sale_date = models.DateField(blank=True, null=True)
    customer = models.CharField(max_length=255, blank=True, null=True)
    revenue = models.FloatField(default=0.0)
    cost = models.FloatField(default=0.0)
    profit = models.FloatField(default=0.0)
    profit_margin = models.FloatField(default=0.0)
    payment_status = models.CharField(max_length=50, default='paid')
    amount_paid = models.FloatField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-calculate revenue, cost, profit if not set
        self.revenue = self.selling_price * self.quantity
        total_expenses = sum(exp.amount for exp in self.product.expenses.all())
        total_cost = self.product.purchase_price + total_expenses
        cost_per_unit = total_cost / self.product.quantity if self.product.quantity > 0 else total_cost
        self.cost = cost_per_unit * self.quantity
        self.profit = self.revenue - self.cost
        self.profit_margin = (self.profit / self.revenue * 100) if self.revenue > 0 else 0.0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sale of {self.quantity}x {self.product.name} to {self.customer}"


class BusinessExpense(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='business_expenses', null=True, blank=True)
    user_id = models.IntegerField(default=1, null=True, blank=True)
    title = models.CharField(max_length=255)
    amount = models.FloatField(default=0.0)
    category = models.CharField(max_length=100)
    expense_date = models.DateField(blank=True, null=True)
    note = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title}: {self.amount}"


class InventoryEntry(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='inventory_entries', null=True, blank=True)
    user_id = models.IntegerField(default=1, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_entries')
    entry_type = models.CharField(max_length=50, choices=[('in', 'Stock In'), ('out', 'Stock Out'), ('adjustment', 'Adjustment')], default='in')
    quantity = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    entry_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.code} ({self.entry_type}): {self.quantity}"
