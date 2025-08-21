from django.template.loader import render_to_string
from django.core.mail import EmailMessage, get_connection
import logging
from django.conf import settings
from apps.email_templates.models import EmailTemplate
from apps.email_templates.serializers import EmailTemplateSerializer
from django.template import Template, Context
logger = logging.getLogger('myapp')




def parse_recipients(to_emails):
    """
    Accepts str (e.g. "a@x.com, b@x.com; c@x.com") or list like ["a@x.com","b@x.com"].
    Returns a flat, de-duplicated list of emails (order-preserving).
    No recursion, because we don't expect nested lists.
    """
    if not to_emails:
        return []

    if isinstance(to_emails, (list, tuple, set)):
        to_emails = ",".join(str(x) for x in to_emails if x)

    s = str(to_emails).replace(";", ",")
    parts = []
    for chunk in s.split(","):
        parts += chunk.strip().split()

    seen, result = set(), []
    for p in parts:
        if p and p.lower() not in seen:
            seen.add(p.lower())
            result.append(p)
    return result


# Function to send an HTML email
# data contains the email data including the email recipient, email subject, and email variables to be used in the template
# template is the name of the template to be used for the email subject and body
# from_account is an optional parameter that specifies the email account to be used for sending the email
# attachments is an optional parameter that contains a list of triplets (file_name, file_content, content_type) to be attached to the email
def send_html_email(data, template, from_account="default", attachments=None):
    email_config = settings.EMAIL_ACCOUNTS.get(from_account, settings.EMAIL_ACCOUNTS["default"])
    print(email_config)
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
    email_body = email_body.replace("{{items_table}}", "{{items_table|safe}}")
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

# TO DO: create "system" email account in settings.py and use it for system emails - from_account="system"
# TO DO: 
def send_system_email(to_email, subject, template_path, context=None, from_account="inventory", attachments=None):
    context = context or {}
    email_config = settings.EMAIL_ACCOUNTS.get(from_account, settings.EMAIL_ACCOUNTS["default"])
    connection = get_connection(
        host=email_config["EMAIL_HOST"],
        port=email_config["EMAIL_PORT"],
        username=email_config["EMAIL_HOST_USER"],
        password=email_config["EMAIL_HOST_PASSWORD"],
        use_tls=email_config["EMAIL_USE_TLS"],
    )

    html_body = render_to_string(template_path, context)
    to_list = parse_recipients(to_email)
    if not to_list:
        logger.error(f"No valid recipients found in {to_email}")
        return False

    email = EmailMessage(
        subject=subject,
        body=html_body,
        from_email=email_config["EMAIL_HOST_USER"],
        to=to_list,
        connection=connection
    )
    email.content_subtype = "html"

    if attachments:
        for file_name, file_content, content_type in attachments:
            email.attach(file_name, file_content.read(), content_type)

    email.send()
    return True
