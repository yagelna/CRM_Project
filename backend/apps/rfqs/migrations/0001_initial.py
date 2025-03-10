# Generated by Django 5.1.4 on 2025-01-16 10:09

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('companies', '0001_initial'),
        ('contacts', '0001_initial'),
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RFQ',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mpn', models.CharField(max_length=255)),
                ('target_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('manufacturer', models.CharField(blank=True, max_length=255, null=True)),
                ('qty_requested', models.IntegerField(blank=True, null=True)),
                ('qty_offered', models.IntegerField(blank=True, null=True)),
                ('offered_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('date_code', models.CharField(blank=True, max_length=50, null=True)),
                ('source', models.CharField(choices=[('website', 'Website'), ('netCOMPONENTS', 'NetComponents'), ('IC Source', 'ICSource'), ('Private', 'Private')], max_length=255)),
                ('status', models.CharField(default='pending', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('company', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='companies.company')),
                ('customer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='contacts.contact')),
                ('inventory_item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='inventory.inventoryitem')),
            ],
        ),
    ]
