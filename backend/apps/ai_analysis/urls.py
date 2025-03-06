from django.urls import path
from .views import analyze_parts

urlpatterns = [
    path('ai/analyze/', analyze_parts, name='analyze-parts'),
]