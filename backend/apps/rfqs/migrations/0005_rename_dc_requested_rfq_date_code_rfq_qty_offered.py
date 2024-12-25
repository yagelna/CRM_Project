# Generated by Django 5.1.4 on 2024-12-25 13:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rfqs', '0004_alter_rfq_company_alter_rfq_customer'),
    ]

    operations = [
        migrations.RenameField(
            model_name='rfq',
            old_name='dc_requested',
            new_name='date_code',
        ),
        migrations.AddField(
            model_name='rfq',
            name='qty_offered',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
