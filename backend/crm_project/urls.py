"""
URL configuration for crm_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from apps.rfqs.views import SendEmailView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.rfqs.urls')),
    path('api/', include('apps.contacts.urls')),
    path('api/', include('apps.companies.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.usersettings.urls')),
    path('api/', include('apps.system_settings.urls')),
    path('api/', include('apps.email_templates.urls')),
    path('api/', include('apps.archive.urls')),
    path('api/', include('apps.ai_analysis.urls')),
    path('api/crm/', include('apps.crm_accounts.urls')),
    path('api/crm/', include('apps.quotes.urls')),
    path('api/email-connections/', include('apps.email_connections.urls')),
    path('api/send-email/', SendEmailView.as_view(), name='send-email'),
    path('api/auth/', include('knox.urls')),
]