import requests
from django.conf import settings
from django.utils import timezone
from .models import EmailConnection
import base64
import smtplib
from email.mime.text import MIMEText
from django.core.mail import EmailMessage, get_connection
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from apps.email_templates.models import EmailTemplate
from django.template import Template, Context

def send_templated_email(data, template_name, connection_id, attachments=None):
    email_template = EmailTemplate.objects.filter(name=template_name).first()
    if not email_template:
        raise Exception(f"Email template '{template_name}' not found")

    email_subject = Template(email_template.subject).render(Context(data))
    email_body = Template(email_template.content).render(Context(data))

    send_email(
        connection_id=connection_id,
        subject=email_subject,
        body=email_body,
        to_email=data['email'],
        attachments=attachments
    )

def generate_oauth2_string(email, access_token):
    """
    Generate the OAuth2 string for the email connection.
    """
    auth_string = f"user={email}\x01auth=Bearer {access_token}\x01\x01"
    return base64.b64encode(auth_string.encode()).decode()

def refresh_google_token(connection: EmailConnection):
    """
    Refresh the Google OAuth2 token for the email connection.
    """
    if connection.token_expires and timezone.now() < connection.token_expires:
        return connection.access_token

    # Make a request to refresh the token
    response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
            'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
            'refresh_token': connection.refresh_token,
            'grant_type': 'refresh_token',
        }
    )
    
    if response.status_code == 200:
        tokens = response.json()
        connection.access_token = tokens['access_token']
        connection.token_expires = timezone.now() + timezone.timedelta(seconds=tokens['expires_in'])
        connection.save()
        return connection.access_token
    else:
        raise Exception(f"Token refresh failed: {response.content}")
    
def send_email(connection_id, subject, body, to_email, cc=None, bcc=None, attachments=None):
    """
    Send an email using the specified email connection.
    """
    connection = EmailConnection.objects.get(id=connection_id)
    
    if connection.provider == 'google':
        access_token = refresh_google_token(connection)
        auth_string = generate_oauth2_string(connection.email_address, access_token)
        
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['From'] = connection.email_address
        msg['To'] = to_email

        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.ehlo()
        code, response = server.docmd('AUTH', 'XOAUTH2 ' + auth_string)
        if code != 235:
            raise Exception(f"Gmail XOAUTH2 auth failed: {response}")
        if attachments:
            for filename, content, mime_type in attachments:
                part = MIMEApplication(content, Name=filename)
                part['Content-Disposition'] = f'attachment; filename="{filename}"'
                msg.attach(part)
        server.sendmail(connection.email_address, to_email, msg.as_string())
        server.quit()

    elif connection.provider == 'microsoft':
        pass
        # Implement Microsoft OAuth2 email sending logic here

    elif connection.provider == 'custom_smtp':
        smtp_connection  = get_connection(
            host=connection.smtp_host,
            port=connection.smtp_port,
            username=connection.email_address,
            password=connection.smtp_password,
            use_tls=connection.use_tls,
        )
        email = EmailMessage(
            subject,
            body,
            from_email=connection.smtp_username,
            to=[to_email],
            cc=cc or [],
            bcc=bcc or [],
            connection=smtp_connection
        )
        email.content_subtype = 'html'
        if attachments:
            for filename, content, mime_type in attachments:
                email.attach(filename, content, mime_type)

        email.send()     
    else:
        raise Exception("Unsupported email provider")