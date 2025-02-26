from rest_framework import serializers
from .models import InventoryItem
# from django_celery_beat.models import PeriodicTask, IntervalSchedule
import json

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

    def validate(self, data):
        if data.get('supplier') == 'FlyChips' and not data.get('location'):
            raise serializers.ValidationError('Location is required for FlyChips supplier')
        return data

# class ExportTaskSerializer(serializers.ModelSerializer):
#     schedule_time = serializers.IntegerField(write_only=True)  # מספר הימים בין ייצוא לייצוא

#     class Meta:
#         model = PeriodicTask
#         fields = ['id', 'name', 'task', 'schedule_time']

#     def create(self, validated_data):
#         schedule_time = validated_data.pop('schedule_time')

#         schedule, created = IntervalSchedule.objects.get_or_create(
#             every=schedule_time,
#             period=IntervalSchedule.HOURS
#         )

#         task = PeriodicTask.objects.create(
#             interval=schedule,
#             name="Scheduled inventory export",
#             task="apps.inventory.tasks.scheduled_export_inventory",
#             args=json.dumps([]),
#         )
#         return task

