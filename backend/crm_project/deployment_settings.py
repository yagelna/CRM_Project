import os
import dj_database_url
from .settings import *
from .settings import BASE_DIR

ALLOWED_HOSTS = [os.environ.get('RENDER_EXTERNAL_HOSTNAME')]
CSRF_TRUSTED_ORIGINS = ['https://' + os.environ.get('RENDER_EXTERNAL_HOSTNAME')]

DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY')

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
     "https://crm-frontend-rret.onrender.com",
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}

# Email settings using Gmail and environment variables
# Email settings using Gmail and environment variables
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_ACCOUNTS = {
    "default": {
        "EMAIL_HOST": os.environ.get('EMAIL_HOST'),
        "EMAIL_PORT": os.environ.get('EMAIL_PORT'),
        "EMAIL_USE_TLS": os.environ.get('EMAIL_USE_TLS'),
        "EMAIL_HOST_USER": os.environ.get('EMAIL_HOST_USER'),
        "EMAIL_HOST_PASSWORD": os.environ.get('EMAIL_HOST_PASSWORD'),
    },
    "rfq": {
        "EMAIL_HOST": os.environ.get('EMAIL_HOST'),
        "EMAIL_PORT": os.environ.get('EMAIL_PORT'),
        "EMAIL_USE_TLS": os.environ.get('EMAIL_USE_TLS'),
        "EMAIL_HOST_USER": os.environ.get('RFQ_EMAIL_HOST_USER'),
        "EMAIL_HOST_PASSWORD": os.environ.get('RFQ_EMAIL_HOST_PASSWORD'),
    },
    "inventory": {
        "EMAIL_HOST": os.environ.get('EMAIL_HOST'),
        "EMAIL_PORT": os.environ.get('EMAIL_PORT'),
        "EMAIL_USE_TLS": os.environ.get('EMAIL_USE_TLS'),
        "EMAIL_HOST_USER": os.environ.get('INVENTORY_EMAIL_HOST_USER'),
        "EMAIL_HOST_PASSWORD": os.environ.get('INVENTORY_EMAIL_HOST_PASSWORD'),
    },
}