# Generated by Django 5.1.4 on 2025-04-02 12:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rfqs', '0008_alter_rfq_source'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rfq',
            name='target_price',
            field=models.DecimalField(blank=True, decimal_places=5, max_digits=10, null=True),
        ),
    ]
