from django.shortcuts import render
from rest_framework import viewsets
from .models import RFQ, Contact, Company
from .serializers import RFQSerializer
from rest_framework.response import Response
from rest_framework import status
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import logging
logger = logging.getLogger('myapp')

class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer

    def create(self, request, *args, **kwargs):

        logger.debug("Debug - Request Data: %s", request.data)
        # check if the email is associated with a contact and if so, add the contact and company to the RFQ, if not, create a new contact
        email = request.data.get('email')
        logger.debug("Debug - Email: %s", email)
        if email:
            contact = Contact.objects.filter(email=email).first()
            logger.debug("Debug - Contact: %s", contact)

            if not contact:
                company_domain = email.split('@')[1]
                company = Company.objects.filter(domain=company_domain).first()
                if not company:
                    company_name = request.data.get('company_name')
                    country = request.data.get('country')
                    company = Company.objects.create(name=company_name, domain=company_domain, country=country)
                contact_name = request.data.get('contact_name')
                contact = Contact.objects.create(name=contact_name, email=email, company=company)
            request.data['customer'] = contact.id
            request.data['company'] = contact.company.id if contact.company else None

        # create the RFQ
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # send the RFQ to the websocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)('rfq_updates', {
            'type': 'send_rfq_update',
            'message': serializer.data
        })

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)