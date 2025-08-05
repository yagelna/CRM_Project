from rest_framework import viewsets, permissions
from .models import Quote
from .serializers import QuoteSerializer
from utils.email_utils import send_html_email
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.email_connections.models import EmailConnection
from apps.email_connections.utils import refresh_google_token

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all().order_by('-created_at')
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        quote = self.get_object()

        if not quote.crm_account or not quote.crm_account.email:
            return Response({"error": "CRM account or email not found"}, status=400)
        
        # HTML table generation for quote items
        items = quote.items.all()
        items_table = build_items_table(items)

        data = {
            'quote_id': quote.id,
            'customer_name': quote.crm_account.name,
            'company_name': quote.crm_account.company.name if quote.crm_account.company else '',
            'email': quote.crm_account.email,
            'items_table': items_table
        }

        # Send the email
        result = send_html_email(
            template='quote_multiple_items',
            data=data,
        )

        if result:
            # Update quote status and sent_at timestamp
            quote.status = 'sent'
            quote.sent_at = timezone.now()
            quote.save()
            return Response({"status": "Email sent successfully"}, status=200)
        else:
            return Response({"error": "Failed to send email"}, status=500)
        
    @action(detail=True, methods=['post'], url_path='send-reply')
    def send_reply(self, request, pk=None):
        quote = self.get_object()
        thread_id = request.data.get('thread_id')
        message_id = request.data.get('message_id')

        if not thread_id or not message_id:
            return Response({"error": "Missing thread_id or message_id"}, status=400)
        
        crm_account = quote.crm_account
        if not crm_account or not crm_account.email:
            return Response({"error": "CRM account or email not found"}, status=400)
        
        try:
            user_settings = request.user.settings
            conn = user_settings.crm_email_connection
            if not conn or conn.provider != 'google':
                return Response({"error": "No valid gmail connection found"}, status=400)
        except Exception as e:
            return Response({"error": f"failed to get email connection: {str(e)}"}, status=500)
        
        # token refresh
        try:
            access_token = refresh_google_token(conn)
        except Exception as e:
            return Response({"error": f"Failed to refresh token: {str(e)}"}, status=500)
        
        # Prepare the email data
        items = quote.items.all()
        items_table = build_items_table(items)

        data = {
            'quote_id': quote.id,
            'customer_name': crm_account.name,
            'company_name': crm_account.company.name if crm_account.company else '',
            'email': crm_account.email,
            'items_table': items_table,
        }

        # Send the email reply
        from apps.email_templates.models import EmailTemplate
        from django.template import Template, Context

        template_obj = EmailTemplate.objects.filter(name='quote_multiple_items').first()
        if not template_obj:
            return Response({"error": "Email template not found"}, status=500)
        subject_raw = Template(template_obj.subject).render(Context(data))
        body_html = Template(template_obj.content).render(Context(data))

        # base64 encode
        subject_encoded = base64.b64encode(subject_raw.encode("utf-8")).decode("utf-8")
        subject_header = f"=?UTF-8?B?{subject_encoded}?="

        email_raw = f"""To: {crm_account.email}
Subject: {subject_header}
In-Reply-To: <{message_id}>
References: <{message_id}>
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: 7bit

{body_html}
"""
        
        raw_base64 = base64.urlsafe_b64encode(email_raw.encode("utf-8")).decode("utf-8")

        url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "raw": raw_base64,
            "threadId": thread_id
        } 

        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            # Update quote status and sent_at timestamp
            quote.status = 'sent'
            quote.sent_at = timezone.now()
            quote.save()
            return Response({"status": "Email sent successfully"}, status=200)
        else:
            try:
                error_detail = response.json()
            except Exception:
                error_detail = {"message": response.text}

            return Response({
                "error": "Failed to send email",
                "details": error_detail
            }, status=response.status_code)




        
def build_items_table(items):
    rows = ""
    total_price = 0.0
    for idx, item in enumerate(items, start=1):
        rows += f"""
        <tr>
            <td>{idx}</td>
            <td>{item.mpn}</td>
            <td>{item.manufacturer}</td>
            <td>{item.qty_offered}</td>
            <td>{item.unit_price:.2f}$</td>
            <td>{item.date_code}</td>
            <td>{item.lead_time}</td>
            <td>{item.remarks}</td>
            <td>{item.total_price:.2f}</td>
        </tr>
        """
        total_price += float(item.total_price)

    return f"""
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
            <tr>
                <th>#</th>
                <th>MPN</th>
                <th>MFG</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Date Code</th>
                <th>Lead Time</th>
                <th>Remarks</th>
                <th>Total Price</th>
            </tr>
        </thead>
        <tbody>
            {rows}
            <tr>
                <td colspan="8" style="text-align: right;"><strong>Total:</strong></td>
                <td><strong>${total_price:.2f}</strong></td>
        </tbody>
    </table>
    """