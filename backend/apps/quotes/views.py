from rest_framework import viewsets, permissions
from .models import Quote
from .serializers import QuoteSerializer
from utils.email_utils import send_html_email
from rest_framework.decorators import action
from rest_framework.response import Response

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
        print(f"Preparing to send quote with {len(items)} items")
        items_table = build_items_table(items)
        print(f"Items table: {items_table}")

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
            return Response({"status": "Email sent successfully"}, status=200)
        else:
            return Response({"error": "Failed to send email"}, status=500)
        
def build_items_table(items):
    print("Building items table")
    rows = ""
    for idx, item in enumerate(items, start=1):
        rows += f"""
        <tr>
            <td>{idx}</td>
            <td>{item.mpn}</td>
            <td>{item.qty_offered}</td>
            <td>${item.unit_price:.2f}</td>
        </tr>
        """

    return f"""
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
            <tr>
                <th>#</th>
                <th>MPN</th>
                <th>Qty</th>
                <th>Unit Price</th>
            </tr>
        </thead>
        <tbody>
            {rows}
        </tbody>
    </table>
    """