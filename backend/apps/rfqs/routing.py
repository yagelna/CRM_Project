from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/rfqs/', consumers.RFQConsumer.as_asgi()),
]

