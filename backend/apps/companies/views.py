from rest_framework.response import Response
from rest_framework import viewsets
from .models import Company
from ..contacts.models import Contact
from ..rfqs.models import RFQ
from .serializers import CompanySerializer
from ..contacts.serializers import ContactSerializer
from ..rfqs.serializers import RFQSerializer
from rest_framework.decorators import api_view
from apps.common.permissions import CanAccessCompanies
from rest_framework.permissions import IsAuthenticated

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, CanAccessCompanies]

@api_view(['GET'])
def company_search(request):
    query = request.GET.get('q', '')
    companies = Company.objects.filter(name__icontains=query)
    serializer = CompanySerializer(companies, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def company_contacts(request, company_id):
    try:
        contacts = Contact.objects.filter(company_id=company_id)
        serializer = ContactSerializer(contacts, many=True)
        return Response(serializer.data)
    except Contact.DoesNotExist:
        return Response({'error': 'No contacts found for this company'}, status=404)
    
@api_view(['GET'])
def company_rfqs(request, company_id):
    try:
        rfqs = RFQ.objects.filter(company_id=company_id)
        serializer = RFQSerializer(rfqs, many=True)
        return Response(serializer.data)
    except RFQ.DoesNotExist:
        return Response({'error': 'No RFQs found for this company'}, status=404)            