from django.shortcuts import render
from rest_framework import viewsets
from .models import Contact
from .serializers import ContactSerializer
from rest_framework.response import Response

class ContactViewSet(viewsets.ModelViewSet):    
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

    def list(self, request, *args, **kwargs):
        company_id = request.query_params.get('company_id')
        if company_id:
            contacts = self.queryset.filter(company=company_id)
            serializer = self.get_serializer(contacts, many=True)
            return Response(serializer.data)
        return super().list(request, *args, **kwargs) 
    