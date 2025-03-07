# Generated by Django 5.1.4 on 2025-02-18 11:15

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('preffered_file_format', models.CharField(choices=[('csv', 'CSV'), ('xlsx', 'Excel')], default='csv', max_length=10)),
                ('netcomponents_enabled', models.BooleanField(default=False)),
                ('icsource_enabled', models.BooleanField(default=False)),
                ('inventory_enabled', models.BooleanField(default=False)),
                ('last_export_date', models.DateTimeField(blank=True, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='settings', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
