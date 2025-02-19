# Generated by Django 5.1.4 on 2025-02-18 11:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usersettings', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='usersettings',
            old_name='icsource_enabled',
            new_name='export_icsource',
        ),
        migrations.RenameField(
            model_name='usersettings',
            old_name='inventory_enabled',
            new_name='export_inventory',
        ),
        migrations.RenameField(
            model_name='usersettings',
            old_name='netcomponents_enabled',
            new_name='export_netcomponents',
        ),
        migrations.RenameField(
            model_name='usersettings',
            old_name='preffered_file_format',
            new_name='file_format',
        ),
        migrations.AddField(
            model_name='usersettings',
            name='icsource_max_available',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='icsource_max_stock',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='netcomponents_max_available',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='netcomponents_max_stock',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
    ]
