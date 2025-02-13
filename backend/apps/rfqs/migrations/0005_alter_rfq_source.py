# Generated by Django 5.1.4 on 2025-02-13 08:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rfqs', '0004_alter_rfq_source'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rfq',
            name='source',
            field=models.CharField(choices=[('Website', 'Website'), ('NetComponents', 'NetComponents'), ('ICSource', 'ICSource'), ('Private', 'Private')], max_length=255),
        ),
    ]
