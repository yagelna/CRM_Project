# import os
# from celery import Celery

# # Set the default Django settings module for the 'celery' program.
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_project.settings')

# celery_app = Celery('crm_project')
# celery_app.config_from_object('django.conf:settings', namespace='CELERY')
# celery_app.autodiscover_tasks()

# @celery_app.task(bind=True)
# def debug_task(self):
#     print(f'Request: {self.request!r}')
