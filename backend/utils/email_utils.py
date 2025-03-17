from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.core.mail import EmailMessage, get_connection
from datetime import datetime
import logging
from django.conf import settings
from apps.email_templates.models import EmailTemplate
from apps.email_templates.serializers import EmailTemplateSerializer
from apps.email_templates.views import EmailTemplateViewSet
from django.template import Template, Context
logger = logging.getLogger('myapp')


# Function to send an HTML email
# data contains the email data including the email recipient, email subject, and email variables to be used in the template
# template is the name of the template to be used for the email subject and body
# from_account is an optional parameter that specifies the email account to be used for sending the email
# attachments is an optional parameter that contains a list of triplets (file_name, file_content, content_type) to be attached to the email
def send_html_email(data, template, from_account="default", attachments=None):
    email_config = settings.EMAIL_ACCOUNTS.get(from_account, settings.EMAIL_ACCOUNTS["default"])
    connection = get_connection(
        host=email_config["EMAIL_HOST"],
        port=email_config["EMAIL_PORT"],
        username=email_config["EMAIL_HOST_USER"],
        password=email_config["EMAIL_HOST_PASSWORD"],
        use_tls=email_config["EMAIL_USE_TLS"],
    )

    print(f'Email data: {data}')

    # Get the email subject and body from the database
    email_template = EmailTemplate.objects.filter(name=template).first()
    email_template_serializer = EmailTemplateSerializer(email_template)
    email_subject = email_template_serializer.data.get('subject')
    email_body = email_template_serializer.data.get('content')
    if not email_subject or not email_body:
        logger.error(f"Email template {template} not found")
        print(f"Email template {template} not found")
        return None
    print(f'Email template: {email_subject}')
    email_subject = Template(email_subject).render(Context(data))
    email_body = Template(email_body).render(Context(data))

    email = EmailMessage(
        subject=email_subject,
        body=email_body,
        from_email=email_config["EMAIL_HOST_USER"],
        to=[data['email']],
        connection=connection
    )
    email.content_subtype = "html"

    if attachments:
        for file_name, file_content, content_type in attachments:
            email.attach(file_name, file_content.read(), content_type)

    email.send()    
    return 1