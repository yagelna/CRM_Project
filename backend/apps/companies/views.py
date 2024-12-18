from rest_framework.response import Response
from rest_framework import viewsets
from .models import Company
from .serializers import CompanySerializer
from rest_framework.decorators import api_view

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

@api_view(['GET'])
def company_search(request):
    query = request.GET.get('q', '')
    companies = Company.objects.filter(name__icontains=query)
    serializer = CompanySerializer(companies, many=True)
    return Response(serializer.data)