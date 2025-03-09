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

    company_name = settings.COMPANY_NAME

    template_dict = {
        "quote-tab": ["../templates/emails/quote.html", f"Quote For {{mpn}} [{company_name}]"],
        "tp-req-tab": ["../templates/emails/lowtp.html", f"Target Price Inquiry {{mpn}}"],
        "no-stock-tab": ["../templates/emails/nostock.html",f"Availability Update for {{mpn}} - Out of Stock"],
        "mov-requirement-tab": ["../templates/emails/mov.html", f"Minimum Order Value Requirement for {{mpn}} [{company_name}]"],
        "no-export-tab": ["../templates/emails/noexport.html", f"Export Restriction for {{mpn}} [{company_name}]"],
        "ics-update": ["../templates/emails/icsupdate.html", f"Stock & Available Stock Update - {company_name}"],
        "nc-update": ["../templates/emails/ncupdate.html", f"Stock & Available Stock Update - {company_name}"],
        "quote-reminder": ["../templates/emails/reminder.html", f"Follow Up on Quote for {{mpn}} [{company_name}]"],
    }

    if (template in ["quote-tab", "quote-reminder"]):
        data['total_price'] = float(data['offered_price']) * int(data['qty_offered'])

    data['current_time'] = datetime.now().strftime("%d-%m-%Y %H:%M")
    print(f'Email data: {data}')
    data['id'] =str(data.get('id', '')).zfill(6) 
    print(f'Email id: {data["id"]}')
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