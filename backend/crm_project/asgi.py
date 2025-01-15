"""
ASGI config for crm_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import apps.rfqs.routing

settings_module = 'crm_project.deployment_settings' if 'RENDER_EXTERNAL_HOSTNAME' in os.environ else 'crm_project.settings'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_module)

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            apps.rfqs.routing.websocket_urlpatterns
        )
    ),
})