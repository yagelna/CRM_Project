# Generated by Django 5.1.4 on 2024-12-08 13:58

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0001_initial'),
        ('rfqs', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rfq',
            name='company',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='companies.company'),
        ),
    ]
