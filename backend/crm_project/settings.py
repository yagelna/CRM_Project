"""
Django settings for crm_project project.

Generated by 'django-admin startproject' using Django 5.1.4.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path
import os
from decouple import config
from datetime import timedelta

def get_env_variable(var_name, default=None):
    return os.environ.get(var_name) or config(var_name, default=default)

def get_list_env_variable(var_name, default=""):
    """ממיר משתנה סביבה ממחרוזת לרשימה"""
    value = os.environ.get(var_name) or config(var_name, default=default)
    return value.split(',') if value else []

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-el6(4g9rpfm7_$)se7nh9k#j$6!^jwue4howrlgp9h4u#2)nmg'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = get_list_env_variable('ALLOWED_HOSTS', default='127.0.0.1,localhost')

CSRF_TRUSTED_ORIGINS = get_list_env_variable('CSRF_TRUSTED_ORIGINS', default='')

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'apps.rfqs',
    'apps.contacts',
    'apps.companies',
    'apps.inventory',
    'apps.archive',
    'apps.users',
    'apps.usersettings',
    'rest_framework',
    'channels',
    'django_extensions',
    'knox',  
]

ASGI_APPLICATION = 'crm_project.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

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

CORS_ALLOWED_ORIGINS = get_list_env_variable('CORS_ALLOWED_ORIGINS', default='http://localhost:5173')
AUTH_USER_MODEL = 'users.CustomUser'

AUTHENTICATION_BACKENDS = [
    # 'apps.users.auth_backend.EmailAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]

ROOT_URLCONF = 'crm_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'crm_project.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': get_env_variable('DB_NAME'),
        'USER': get_env_variable('DB_USER'),
        'PASSWORD': get_env_variable('DB_PASSWORD'),
        'HOST': get_env_variable('DB_HOST'),
        'PORT': get_env_variable('DB_PORT'),
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'
STATICFILES_DIRS = [
    BASE_DIR / "static",
]
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (uploaded by users)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / "media"



# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
        # 'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'knox.auth.TokenAuthentication',
    ],
}

REST_KNOX = {
    'TOKEN_TTL': timedelta(days=7), # 3 days token expiration
}

# Logging settings

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'debug.log',  # קובץ היעד
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'myapp': {  # שם מותאם אישית, יכול להיות כל דבר
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Email settings using Gmail and environment variables
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_ACCOUNTS = {
    "default": {
        "EMAIL_HOST": get_env_variable('EMAIL_HOST'),
        "EMAIL_PORT": get_env_variable('EMAIL_PORT'),
        "EMAIL_USE_TLS": get_env_variable('EMAIL_USE_TLS'),
        "EMAIL_HOST_USER": get_env_variable('EMAIL_HOST_USER'),
        "EMAIL_HOST_PASSWORD": get_env_variable('EMAIL_HOST_PASSWORD'),
    },
    "rfq": {
        "EMAIL_HOST": get_env_variable('EMAIL_HOST'),
        "EMAIL_PORT": get_env_variable('EMAIL_PORT'),
        "EMAIL_USE_TLS": get_env_variable('EMAIL_USE_TLS'),
        "EMAIL_HOST_USER": get_env_variable('RFQ_EMAIL_HOST_USER'),
        "EMAIL_HOST_PASSWORD": get_env_variable('RFQ_EMAIL_HOST_PASSWORD'),
    },
    "inventory": {
        "EMAIL_HOST": get_env_variable('EMAIL_HOST'),
        "EMAIL_PORT": get_env_variable('EMAIL_PORT'),
        "EMAIL_USE_TLS": get_env_variable('EMAIL_USE_TLS'),
        "EMAIL_HOST_USER": get_env_variable('INVENTORY_EMAIL_HOST_USER'),
        "EMAIL_HOST_PASSWORD": get_env_variable('INVENTORY_EMAIL_HOST_PASSWORD'),
    },
}

LOCATION_REQUIRED_SUPPLIERS = get_env_variable('LOCATION_REQUIRED_SUPPLIERS', default='FlyChips,Fly Chips').split(',')
NC_INVENTORY_UPDATE_EMAIL= get_env_variable('NC_INVENTORY_UPDATE_EMAIL')
NC_ACCOUNT= get_env_variable('NC_ACCOUNT')
ICS_INVENTORY_UPDATE_EMAIL= get_env_variable('ICS_INVENTORY_UPDATE_EMAIL')
STOCK_SUPPLIER = get_env_variable('STOCK_SUPPLIER', default='Fly Chips')
COMPANY_NAME = get_env_variable('COMPANY_NAME', default='Fly Chips')