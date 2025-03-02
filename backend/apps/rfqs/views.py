from django.shortcuts import render
from .models import RFQ, Contact, Company, InventoryItem
from .serializers import RFQSerializer
from rest_framework import viewsets, status
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from utils.email_utils import send_html_email
import logging
from django.utils.timezone import now, timedelta
from django.conf import settings
logger = logging.getLogger('myapp')

@api_view(['GET'])
def search_rfqs(request, mpn):
    """
    Search for RFQs by mpn.
    Return all RFQs that match the exact mpn.
    """
    try:
        logger.debug(f"Searching for RFQs with MPN: {mpn}")
        rfqs = RFQ.objects.filter(mpn=mpn)
        serializer = RFQSerializer(rfqs, many=True)
        return Response(serializer.data)
    except RFQ.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer

    def create(self, request, *args, **kwargs):
        contact = None
        
        if(request.data.get('company') and request.data.get('contact')):
            logger.debug("Manual RFQ creation detected with data: %s", request.data)
            contact = Contact.objects.filter(id=request.data.get('contact')).first()
        else:
            logger.debug("Creating RFQ from email with data: %s", request.data)
            email = request.data.get('email')
            if email:
                contact = Contact.objects.filter(email=email).first()
                if not contact:
                    company_domain = email.split('@')[1]
                    company = Company.objects.filter(domain=company_domain).first()
                    if not company:
                        company_name = request.data.get('company_name')
                        country = request.data.get('country')
                        company = Company.objects.create(name=company_name, domain=company_domain, country=country)
                    contact_name = request.data.get('contact_name')
                    contact = Contact.objects.create(name=contact_name, email=email, company=company)
            else:
                return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        request.data['customer'] = contact.id
        request.data['company'] = contact.company.id if contact.company else None

        # check if the MPN is in stock and if so, set the stock_source field accordingly
        mpn = request.data.get('mpn')
        suppliers = InventoryItem.objects.filter(mpn=mpn).values_list('supplier', flat=True)
        stock_source = None
        if suppliers:
            stock_supplier = settings.STOCK_SUPPLIER.lower().replace("-", "").replace(" ", "")
            if len(suppliers) == 1 and stock_supplier in suppliers[0].lower().replace("-", "").replace(" ", ""):
                stock_source = 'Stock'
            elif any(stock_supplier in supplier.lower().replace("-", "").replace(" ", "") for supplier in suppliers):
                stock_source = 'Stock & Available'
            else:
                stock_source = 'Available'

        # check if there is a similar RFQ with a recent auto_quote_deadline and use its offer
        similar_rfq = RFQ.objects.filter(
            mpn=mpn,
            auto_quote_deadline__gte=now(),
            offered_price__isnull=False
        ).order_by('-updated_at').first()

        rfq_data = request.data.copy()
        rfq_data['stock_source'] = stock_source

        if similar_rfq:
            logger.debug(f"Found similar RFQ with MPN: {mpn}")
            new_tp = request.data.get('target_price')
            if new_tp:
                try:
                    new_tp = float(new_tp)
                except ValueError:
                    new_tp = None
                    logger.error("Failed to convert target_price to float")

            if new_tp is None or similar_rfq.offered_price > new_tp:
                logger.debug("Debug - Using previous RFQ's offer for the new RFQ")
                rfq_data.update({
                    'offered_price': similar_rfq.offered_price,
                    'qty_offered': similar_rfq.qty_offered,
                    'date_code': similar_rfq.date_code,
                    'manufacturer': similar_rfq.manufacturer,
                    'auto_quote_deadline': similar_rfq.auto_quote_deadline,
                    'parent_rfq': similar_rfq.id,
                    'status': 'Quote Sent',
                    'customer_name': contact.name if contact else None,
                    'company_name': contact.company.name if contact.company else None,
                    'email': contact.email if contact else None
                })
                send_html_email(rfq_data, 'quote-tab', from_account='rfq')

        # create the RFQ
        serializer = self.get_serializer(data=rfq_data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # send the RFQ to the websocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)('rfq_updates', {
            'type': 'send_rfq_update',
            'message': serializer.data
        })

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object() # get the RFQ instance
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        auto_quote_validity = request.data.get('auto_quote_validity')
        print(auto_quote_validity)
        if auto_quote_validity is not None:
            print("Setting auto quote deadline")
            instance.set_auto_quote_deadline(auto_quote_validity)
            instance.save()
        self.perform_update(serializer)

        # send the RFQ new status to the websocket
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "rfq_updates",
                {
                    "type": "send_rfq_update",
                    "message": serializer.data,
                },
            )
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")

        return Response(serializer.data, status=status.HTTP_200_OK) 
    
class SendEmailView(APIView):
    def post(self, request):
        data = request.data
        formData = data.get("formData")
        template = data.get("template")
        logger.debug("Debug - formData: %s", formData)
        logger.debug("Debug - template: %s", template)
        send_html_email(formData, template, from_account='rfq')
        # send the RFQ new status to the websocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)('rfq_updates', {
            'type': 'send_rfq_update',
            'message': template + ' was sent'
        })

        return Response({"success": "Email sent successfully"})