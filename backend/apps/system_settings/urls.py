from django.urls import path
from .views import SystemSettingsSingletonView

urlpatterns = [
    path('singleton/', SystemSettingsSingletonView.as_view(), name='system-settings-singleton')
]