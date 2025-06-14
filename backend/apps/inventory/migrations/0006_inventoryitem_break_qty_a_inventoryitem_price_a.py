# Generated by Django 5.1.4 on 2025-05-13 10:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0005_alter_inventoryitem_cost_alter_inventoryitem_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='inventoryitem',
            name='break_qty_a',
            field=models.IntegerField(blank=True, help_text='Break quantity A', null=True),
        ),
        migrations.AddField(
            model_name='inventoryitem',
            name='price_a',
            field=models.DecimalField(blank=True, decimal_places=4, help_text='Price break A', max_digits=10, null=True),
        ),
    ]
