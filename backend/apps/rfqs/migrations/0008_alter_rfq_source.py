# Generated by Django 5.1.6 on 2025-02-27 12:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rfqs', '0007_alter_rfq_source'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rfq',
            name='source',
            field=models.CharField(choices=[('Website', 'Website'), ('netCOMPONENTS', 'netCOMPONENTS'), ('IC Source', 'IC Source'), ('Private', 'Private')], max_length=255),
        ),
    ]
