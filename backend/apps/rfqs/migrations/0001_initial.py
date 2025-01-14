# Generated by Django 5.1.4 on 2024-12-08 13:09

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
                ('target_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('manufacturer', models.CharField(max_length=255)),
                ('mpn', models.CharField(max_length=255)),
                ('qty_requested', models.IntegerField()),
                ('offered_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('dc_requested', models.CharField(blank=True, max_length=50, null=True)),
                ('source', models.CharField(choices=[('website', 'Website'), ('netcomponents', 'NetComponents'), ('icsource', 'ICSource'), ('private', 'Private')], max_length=255)),
                ('status', models.CharField(default='pending', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='companies.company')),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contacts.contact')),
                ('inventory_item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='inventory.inventoryitem')),
            ],
        ),
    ]
