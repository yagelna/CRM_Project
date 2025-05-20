from rest_framework import viewsets, permissions
from .models import CRMAccount, CRMInteraction, CRMTask
from .serializers import CRMAccountSerializer, CRMInteractionSerializer, CRMTaskSerializer

class CRMAccountViewSet(viewsets.ModelViewSet):
    queryset = CRMAccount.objects.all().order_by('-created_at')
    serializer_class = CRMAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

class CRMInteractionViewSet(viewsets.ModelViewSet):
    queryset = CRMInteraction.objects.all().order_by('-timestamp')
    serializer_class = CRMInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

class CRMTaskViewSet(viewsets.ModelViewSet):
    queryset = CRMTask.objects.all().order_by('-due_date')
    serializer_class = CRMTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)