from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
import logging
logger = logging.getLogger('myapp')

def send_email():
    send_mail(
        subject="Test Email",
        message="This is a test email",
        from_email="yagelnahshon@gmail.com",
        recipient_list=["yagel@flychips.com"],
        fail_silently=False,
    )

def send_html_email(data, template):
    template_dict = {
        "quote-tab": ["../templates/emails/quote.html", "Quote For {mpn} [FlyChips]"],
        "tp-alert-tab": ["../templates/emails/lowtp.html", "Target Price Inquiry {mpn}"],
        "no-stock-tab": ["../templates/emails/nostock.html","Availability Update for {mpn} - Out of Stock"],
        "mov-requirement-tab": ["../templates/emails/mov.html", "Minimum Order Value Requirement for {mpn} [FlyChips]"],
        "no-export-tab": ["../templates/emails/noexport.html", "Export Restriction for {mpn} [FlyChips]"],
    }
    logger.debug("Debug - Data: %s", data)
    #if quote-tab, calculate the total price and add it to the data
    if (template=="quote-tab"):
        data['total_price'] = data['offered_price'] * data['qty_offered']
    logger.debug("Debug - Data2: %s", data)
    email_body = render_to_string(template_dict[template][0], data)
    email = EmailMessage(
        subject=template_dict[template][1].format(mpn=data['mpn']),
        body=email_body,
        from_email="yagelnahshon@gmail.com",
        to=["yagel@flychips.com"],
    )
    email.content_subtype = "html"
    email.send()