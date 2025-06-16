from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from .models import CRMAccount, CRMInteraction, CRMTask
from .serializers import CRMAccountSerializer, CRMInteractionSerializer, CRMTaskSerializer, EmailPrecheckSerializer, AutomatedInteractionSerializer
from django.utils import timezone

class CRMAccountViewSet(viewsets.ModelViewSet):
    queryset = CRMAccount.objects.all().order_by('-created_at')
    serializer_class = CRMAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

class CRMInteractionViewSet(viewsets.ModelViewSet):
    queryset = CRMInteraction.objects.all().order_by('-timestamp')
    serializer_class = CRMInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        raw_timestamp = self.request.data.get('timestamp')
        print(f"Raw timestamp received: {raw_timestamp}")

        if raw_timestamp:
            try:
                naive_datetime = datetime.strptime(raw_timestamp, "%Y-%m-%dT%H:%M")
                timestamp = timezone.make_aware(naive_datetime, timezone.get_current_timezone())
            except Exception as e:
                print(f"Failed to parse timestamp: {e}")
                timestamp = timezone.now()
        else:
            timestamp = timezone.now()

        print(f"raw_timestamp: {raw_timestamp}, parsed timestamp: {timestamp}")

        interaction = serializer.save(
            added_by=self.request.user,
            timestamp=timestamp
        )
        account = interaction.account
        account.refresh_from_db()
        latest = account.last_interaction
        print(f"Latest interaction timestamp: {latest} and current interaction timestamp: {interaction.timestamp}")
        if not latest or account.last_interaction < interaction.timestamp:
            print(f"Updating last interaction timestamp for account {account.id} from {account.last_interaction} to {interaction.timestamp}")
            account.last_interaction = interaction.timestamp
            account.save()
        elif latest and account.last_interaction >= interaction.timestamp:
            print(f"No update needed for last interaction timestamp for account {account.id}, current: {account.last_interaction}, new: {interaction.timestamp}")
        else:
            print(f"Unexpected case for account {account.id}, last interaction: {account.last_interaction}, new interaction timestamp: {interaction.timestamp}")
        
    def perform_update(self, serializer):
        interaction = serializer.save()
        account = interaction.account
        latest = account.interactions.order_by('-timestamp').first()
        if latest and account.last_interaction != latest.timestamp:
            account.last_interaction = latest.timestamp
            account.save()
    
    def perform_destroy(self, instance):
        account = instance.account
        timestamp_being_deleted = instance.timestamp
        instance.delete()
        latest = account.interactions.order_by('-timestamp').first()
        if latest:
            if account.last_interaction != latest.timestamp:
                account.last_interaction = latest.timestamp
                account.save()
        else:
            if account.last_interaction:
                account.last_interaction = None
                account.save()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def precheck(self, request):
        serializer = EmailPrecheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        message_id = data['message_id']
        thread_id = data.get('thread_id')
        from_email = data['from_email']
        to_emails = data['to_emails']
        cc_emails = data['cc_emails']
        watched_email = data['watched_email']
        direction = data['direction']

        all_emails = set([from_email] + to_emails + cc_emails)

        # Check if the message ID already exists
        if CRMInteraction.objects.filter(message_id=message_id).exists():
            return Response( {"status": "duplicate"}, status=status.HTTP_200_OK)
        
        # Check if any of the emails match existing CRM accounts
        matching_accounts = CRMAccount.objects.filter(email__in=all_emails)

        if not matching_accounts.exists():
            return Response({ "status": "not_strategic" }, status=status.HTTP_200_OK)
        
        account = matching_accounts.first() # in the future, we might want to handle multiple matches differently.

        if thread_id:
            existing = CRMInteraction.objects.filter(thread_id=thread_id, account=account).first()
            if existing:
                return Response({
                    "status": "process_existing_interaction",
                    "account_id": account.id,
                    "interaction_id": existing.id,
                    "direction": direction
                })

        return Response({
            "status": "process_new_interaction",
            "account_id": account.id,
            "direction": direction
        })
        
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='automated-interaction')
    def automated(self, request):
        serializer = AutomatedInteractionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            account = CRMAccount.objects.get(id=data['account_id'])
        except CRMAccount.DoesNotExist:
            return Response({"error": "Account not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # if the interaction_id is provided, we will update the existing interaction
        interaction_id = data.get('interaction_id')
        message_id = data['message_id']
        if interaction_id:
            if CRMInteraction.objects.filter(message_id=message_id).exists():
                return Response({"status": "duplicate"}, status=status.HTTP_200_OK)
            interaction = CRMInteraction.objects.filter(id=interaction_id, account=account).first()
            if interaction:
                interaction.summary += f"\n\n[+] {data['summary']}"
                if interaction.direction and interaction.direction != data['direction']:
                    interaction.direction = 'mixed'
                else:
                    interaction.direction = data['direction']
                interaction.updated_at = timezone.now()
                interaction.save()

                account.last_interaction = interaction.timestamp
                account.status = 'active'
                account.save()

                return Response({
                    "status": "updated_existing",
                    "interaction_id": interaction.id,
                    "account_id": account.id
                }, status=status.HTTP_200_OK)
        
        if CRMInteraction.objects.filter(message_id=message_id).exists():
            return Response({"status": "duplicate"}, status=status.HTTP_200_OK)
        
        # if the interaction_id is not provided, we will create a new interaction
        interaction = CRMInteraction.objects.create(
            account=account,
            type='email',
            is_auto_generated=True,
            message_id=message_id,
            thread_id=data.get('thread_id'),
            direction=data['direction'],
            title=data.get('subject', '')[:255],
            summary=data['summary'],
            timestamp=data['timestamp'],
            added_by=request.user
        )
        account.last_interaction = interaction.timestamp # in the future, we might check if this is the latest interaction
        account.status = 'active'
        account.save()

        return Response({
            "status": "created",
            "interaction_id": interaction.id,
            "account_id": account.id
        }, status=status.HTTP_201_CREATED)


                

class CRMTaskViewSet(viewsets.ModelViewSet):
    queryset = CRMTask.objects.all().order_by('-due_date')
    serializer_class = CRMTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

    