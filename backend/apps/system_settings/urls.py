from django.urls import path
from .views import SystemSettingsSingletonView

urlpatterns = [
    path('system-settings/', SystemSettingsSingletonView.as_view(), name='system-settings-singleton')
]