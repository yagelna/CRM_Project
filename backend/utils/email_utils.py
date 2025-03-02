from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.core.mail import EmailMessage, get_connection
from datetime import datetime
import logging
from django.conf import settings
logger = logging.getLogger('myapp')


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

    template_dict = {
        "quote-tab": ["../templates/emails/quote.html", "Quote For {mpn} [FlyChips]"],
        "tp-alert-tab": ["../templates/emails/lowtp.html", "Target Price Inquiry {mpn}"],
        "no-stock-tab": ["../templates/emails/nostock.html","Availability Update for {mpn} - Out of Stock"],
        "mov-requirement-tab": ["../templates/emails/mov.html", "Minimum Order Value Requirement for {mpn} [FlyChips]"],
        "no-export-tab": ["../templates/emails/noexport.html", "Export Restriction for {mpn} [FlyChips]"],
        "ics-update": ["../templates/emails/icsupdate.html", "Stock & Available Stock Update - FlyChips"],
        "nc-update": ["../templates/emails/ncupdate.html", "Stock & Available Stock Update - FlyChips"],
    }

    if (template=="quote-tab"):
        data['total_price'] = float(data['offered_price']) * int(data['qty_offered'])

    data['current_time'] = datetime.now().strftime("%d-%m-%Y %H:%M")
    email_body = render_to_string(template_dict[template][0], data)

    email = EmailMessage(
        subject=template_dict[template][1].format(mpn=data.get('mpn','')),
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