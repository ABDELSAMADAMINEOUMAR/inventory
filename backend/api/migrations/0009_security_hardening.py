
import django.core.validators
import django.db.models.deletion
from django.db import migrations, models, transaction


def make_invoice_number_unique_per_company(apps, schema_editor):
    """
    Drop the global UNIQUE on invoice_number and add UNIQUE(company, invoice_number).
    Written by hand so it works on SQLite, PostgreSQL and CockroachDB (which may refuse
    DROP CONSTRAINT on index-backed unique constraints and needs DROP INDEX ... CASCADE).
    """
    Invoice = apps.get_model("api", "Invoice")
    conn = schema_editor.connection
    table = Invoice._meta.db_table

    if conn.vendor == "sqlite":
        old_field = Invoice._meta.get_field("invoice_number")
        new_field = models.CharField(max_length=50)
        new_field.set_attributes_from_name("invoice_number")
        new_field.model = Invoice
        old_field_unique = models.CharField(max_length=50, unique=True)
        old_field_unique.set_attributes_from_name("invoice_number")
        old_field_unique.model = Invoice
        schema_editor.alter_field(Invoice, old_field_unique, new_field)
        schema_editor.alter_unique_together(Invoice, set(), {("company", "invoice_number")})
        return

    qn = schema_editor.quote_name
    with conn.cursor() as cursor:
        constraints = conn.introspection.get_constraints(cursor, table)
    for name, info in constraints.items():
        if info.get("unique") and not info.get("primary_key") and info.get("columns") == ["invoice_number"]:
            try:
                with transaction.atomic(using=conn.alias):
                    schema_editor.execute(f"ALTER TABLE {qn(table)} DROP CONSTRAINT {qn(name)}")
            except Exception:
                with transaction.atomic(using=conn.alias):
                    schema_editor.execute(f"DROP INDEX IF EXISTS {qn(table)}@{qn(name)} CASCADE")
    schema_editor.execute(
        f"ALTER TABLE {qn(table)} ADD CONSTRAINT {qn('api_invoice_company_invoice_number_uniq')} "
        f"UNIQUE ({qn('company_id')}, {qn('invoice_number')})"
    )


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0008_product_selling_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="auditlog",
            name="company",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="audit_logs",
                to="api.company",
            ),
        ),
        migrations.AlterField(
            model_name="businessexpense",
            name="amount",
            field=models.FloatField(
                default=0.0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="invoice",
            name="amount_paid",
            field=models.FloatField(
                default=0.0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="invoice",
            name="total_revenue",
            field=models.FloatField(
                default=0.0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="exchange_rate",
            field=models.FloatField(
                default=1.0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="purchase_price",
            field=models.FloatField(
                default=0.0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="quantity",
            field=models.IntegerField(
                default=0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="selling_price",
            field=models.FloatField(
                default=0.0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="productexpense",
            name="amount",
            field=models.FloatField(
                default=0.0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="amount_paid",
            field=models.FloatField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="quantity",
            field=models.IntegerField(
                default=1, validators=[django.core.validators.MinValueValidator(1)]
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="selling_price",
            field=models.FloatField(
                default=0.0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        # Invoice numbers become unique per company instead of globally.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name="invoice",
                    name="invoice_number",
                    field=models.CharField(max_length=50),
                ),
                migrations.AlterUniqueTogether(
                    name="invoice",
                    unique_together={("company", "invoice_number")},
                ),
            ],
            database_operations=[
                migrations.RunPython(make_invoice_number_unique_per_company, migrations.RunPython.noop),
            ],
        ),
    ]
