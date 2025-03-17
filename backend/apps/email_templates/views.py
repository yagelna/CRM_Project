from rest_framework import viewsets
from .models import EmailTemplate
from .serializers import EmailTemplateSerializer

# Create your views here.
class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer