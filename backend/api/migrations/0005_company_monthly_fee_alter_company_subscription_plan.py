from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_sale_amount_paid_sale_due_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='company',
            name='monthly_fee',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='company',
            name='subscription_plan',
            field=models.CharField(choices=[('free', 'Free'), ('basic', 'Basic'), ('pro', 'Pro'), ('enterprise', 'Enterprise'), ('custom', 'Custom')], default='free', max_length=50),
        ),
    ]
