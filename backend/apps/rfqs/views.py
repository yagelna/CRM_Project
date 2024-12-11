from django.shortcuts import render
from rest_framework import viewsets
from .models import RFQ
from .serializers import RFQSerializer

class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer
