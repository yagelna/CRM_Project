from django.shortcuts import render
from .models import RFQ, Contact, Company, InventoryItem
from .serializers import RFQSerializer
from rest_framework import viewsets, status
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view
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
        rfqs = RFQ.objects.filter(mpn=mpn)
        serializer = RFQSerializer(rfqs, many=True)
        return Response(serializer.data)
    except RFQ.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer

    @action(detail=False, methods=['delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids')
        if not ids:
            return Response({"error": "No RFQ IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(ids, list):
            return Response({"error": "ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        RFQ.objects.filter(id__in=ids).delete()
        return Response({"success": "RFQs deleted successfully"})
    
    
    

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
            new_tp = request.data.get('target_price')
            if new_tp:
                try:
                    new_tp = float(new_tp)
                except ValueError:
                    new_tp = None
                    logger.error("Failed to convert target_price to float")

            if new_tp is None or similar_rfq.offered_price > new_tp:
                rfq_data.update({
                    'offered_price': similar_rfq.offered_price,
                    'qty_offered': similar_rfq.qty_offered,
                    'date_code': similar_rfq.date_code,
                    'manufacturer': similar_rfq.manufacturer,
                    'auto_quote_deadline': similar_rfq.auto_quote_deadline,
                    'parent_rfq': similar_rfq.id,
                    'customer_name': contact.name if contact else None,
                    'company_name': contact.company.name if contact.company else None,
                    'email': contact.email if contact else None
                })

        # create the RFQ
        serializer = self.get_serializer(data=rfq_data)
        serializer.is_valid(raise_exception=True)
        rfq_instance = serializer.save()

        # send the RFQ to the customer if the there is similar RFQ
        if similar_rfq:
            rfq_data['id'] = rfq_instance.id
            logger.debug(f"Found similar RFQ with MPN: {mpn}. Sending auto-quote email to customer")
            try:
                send_html_email(rfq_data, 'quote', from_account='rfq')
                rfq_instance.status = 'Quote Sent'
                rfq_instance.save(update_fields=['status'])
            except Exception as e:
                logger.error(f"Failed to send email for RFQ {rfq_instance.id}: {e}")

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
    
    @action(detail=False, methods=['post'], url_path='bulk-email')
    def bulk_email(self, request):
        rfq_ids = request.data.get('rfq_ids')
        if not rfq_ids:
            return Response({"error": "No RFQ IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        template = request.data.get('template')
        if not template:
            return Response({"error": "No email template provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        rfqs = RFQ.objects.filter(id__in=rfq_ids)
        success_count = 0
        failed_ids = []
        template_status = {
            "quote": "Quote Sent",
            "reminder": "Reminder Sent",
            "lowtp": "T/P Request Sent",
            "nostock": "No Stock Alert Sent",
            "noexport": "No Export Alert Sent",
            "mov": "MOV Requirement Sent"
        }
        for rfq in rfqs:
            try:
                formData = {
                    'id': str(rfq.id).zfill(6),
                    'mpn': rfq.mpn,
                    'qty_offered': rfq.qty_offered,
                    'offered_price': rfq.offered_price,
                    'date_code': rfq.date_code,
                    'manufacturer': rfq.manufacturer,
                    'customer_name': rfq.customer.name if rfq.customer else None,
                    'company_name': rfq.company.name if rfq.company else None,
                    'email': rfq.customer.email if rfq.customer else None,
                    'my_company': settings.COMPANY_NAME,
                    'current_time': now().strftime("%d-%m-%Y %H:%M")
                }

                if (template=="reminder"):
                    formData['total_price'] = float(formData['offered_price']) * int(formData['qty_offered'])

                result = send_html_email(formData, template, from_account='rfq')
                if result is None:
                    raise Exception("Failed to send email")
                rfq.status = template_status[template]
                rfq.save(update_fields=['status'])
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to send email for RFQ {rfq.id}: {e}")
                failed_ids.append(rfq.id)

        # send the RFQ new status to the websocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)('rfq_updates', {
            'type': 'send_rfq_update',
            'message': {
                "failed_ids": failed_ids,
                "success_count": success_count,
                "total_count": len(rfq_ids),
            }
        })

        return Response({
            "success_count": success_count,
            "failed_ids": failed_ids,
            "total_count": len(rfq_ids)
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['patch'], url_path='bulk-edit')
    def bulk_edit(self,request):
        ids = request.data.get('ids')
        updates = request.data.get('updates')
        if not ids:
            return Response({"error": "No RFQ IDs provided."}, status=status.HTTP_400_BAD_REQUEST)

        if not updates:
            return Response({"error": "No update fields provided."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            updated_count = RFQ.objects.filter(id__in=ids).update(**updates)
            return Response({
                "success": f"Updated {updated_count} RFQ(s) successfully.",
                "updated_count": updated_count
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    
class SendEmailView(APIView):
    def post(self, request):
        data = request.data
        formData = data.get("formData")
        template = data.get("template")

        formData['my_company'] = settings.COMPANY_NAME
        formData['current_time'] = now().strftime("%d-%m-%Y %H:%M")
        formData['id'] = str(formData.get('id', '')).zfill(6)
        if (template in ["quote", "reminder"]):
            formData['total_price'] = float(formData['offered_price']) * int(formData['qty_offered'])

        if send_html_email(formData, template, from_account='rfq') is None:
            return Response({"error": "Failed to send email"}, status=status.HTTP_500_INTERNAL_SERVER)
        
        # send the RFQ new status to the websocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)('rfq_updates', {
            'type': 'send_rfq_update',
            'message': template + ' was sent'
        })

        return Response({"success": "Email sent successfully"})
    