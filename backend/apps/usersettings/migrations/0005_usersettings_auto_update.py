# Generated by Django 5.1.6 on 2025-02-27 12:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usersettings', '0004_usersettings_selected_suppliers'),
    ]

    operations = [
        migrations.AddField(
            model_name='usersettings',
            name='auto_update',
            field=models.BooleanField(default=False),
        ),
    ]
