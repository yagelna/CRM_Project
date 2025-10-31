from datetime import datetime
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.common.permissions import CanAccessCRM, StrictDjangoModelPermissions
from rest_framework.decorators import action
from django.db.models import Q
from django.conf import settings
from .models import CRMAccount, CRMInteraction, CRMTask
from .serializers import CRMAccountSerializer, CRMInteractionSerializer, CRMTaskSerializer, EmailPrecheckSerializer, AutomatedInteractionSerializer, IngestEmailSerializer
from django.utils import timezone
from apps.system_settings.models import SystemSettings
from apps.usersettings.models import UserSettings
from apps.email_connections.models import EmailConnection
from apps.email_connections.utils import refresh_google_token
from utils.email_utils import send_system_email
import requests
import base64
import html
# from google.auth.transport.requests import Request


def update_account_status(account, reference_date):
    if account.status == 'archived':
        return
    settings_obj = SystemSettings.get_solo()
    delta_days = (timezone.now() - reference_date).days
    if delta_days > settings_obj.inactive_threshold_days:
        new_status = 'inactive'
    elif delta_days > settings_obj.slow_threshold_days:
        new_status = 'slow'
    else:
        new_status = 'active'
    if account.status != new_status:
        account.status = new_status

class CRMAccountViewSet(viewsets.ModelViewSet):
    queryset = CRMAccount.objects.all().order_by('-created_at')
    serializer_class = CRMAccountSerializer
    permission_classes = [IsAuthenticated, CanAccessCRM]

class CRMInteractionViewSet(viewsets.ModelViewSet):
    queryset = CRMInteraction.objects.all().order_by('-timestamp')
    serializer_class = CRMInteractionSerializer
    permission_classes = [IsAuthenticated, CanAccessCRM]
    
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

        interaction = serializer.save(
            added_by=self.request.user,
            timestamp=timestamp
        )
        
        # update the account's last interaction based on the interaction timestamp and status if needed
        account = interaction.account
        account.refresh_from_db()
        latest = account.last_interaction
        print(f"Latest interaction timestamp: {latest} and current interaction timestamp: {interaction.timestamp}")
        if not latest or latest < timestamp:
            account.last_interaction = timestamp
        update_account_status(account, timestamp)

        account.save()
        
    def perform_update(self, serializer):
        interaction = serializer.save()
        account = interaction.account
        latest = account.interactions.order_by('-timestamp').first()
        if latest and account.last_interaction != latest.timestamp:
            account.last_interaction = latest.timestamp
            update_account_status(account, interaction.timestamp)
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
                
    def get_queryset(self):
        queryset = super().get_queryset()
        crm_account_id = self.request.query_params.get('crm_account')
        if crm_account_id:
            queryset = queryset.filter(account_id=crm_account_id)
        return queryset

    @action(detail=False, methods=['post'], url_path='ingest-email')
    def ingest_email(self, request):
        serializer = IngestEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if not data.get('matches_watched', True):
            return Response({"status": "ignored_non_matching_mailbox"}, status=status.HTTP_200_OK)

        message_id = data['message_id']
        thread_id = data.get('thread_id')
        direction = data['direction']
        subject = data.get('subject', '')[:255]
        timestamp = data['timestamp']
        all_emails = set([data['from_email'], data['watched_email'], *data['to_emails'], *data.get('cc_emails', [])])

        # Check if the message ID already exists
        if CRMInteraction.objects.filter(message_id=message_id).exists():
            return Response( {"status": "duplicate"}, status=status.HTTP_200_OK)
        
        # Check if any of the emails match existing CRM accounts
        matching_accounts = CRMAccount.objects.filter(email__in=all_emails)
        if not matching_accounts.exists():
            return Response({ "status": "not_strategic" }, status=status.HTTP_200_OK)
        account = matching_accounts.first() # in the future, we might want to handle multiple matches differently.
        if thread_id:
            existing = CRMInteraction.objects.filter(thread_id=thread_id, account=account).order_by('-timestamp').first()
            if existing:
                if existing.direction and existing.direction != direction:
                    existing.direction = 'mixed'
                else:
                    existing.direction = direction

                if not existing.timestamp or existing.timestamp < timestamp:
                    existing.timestamp = timestamp
                existing.save()

                account.last_interaction = existing.timestamp
                account.status = 'active'
                account.save()

                return Response({
                    "status": "updated_existing",
                    "account_id": account.id,
                    "interaction_id": existing.id
                }, status=status.HTTP_200_OK)
            
        # create a new interaction
        interaction = CRMInteraction.objects.create(
            account=account,
            type='email',
            is_auto_generated=True,
            message_id=message_id,
            thread_id=thread_id,
            direction=direction,
            title=subject,
            summary="", # we might want to add more details in the future
            timestamp=timestamp,
            added_by=request.user
        )
        account.last_interaction = interaction.timestamp
        account.status = 'active'
        account.save()

        return Response({
            "status": "created",
            "account_id": account.id,
            "interaction_id": interaction.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
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

    @action(detail=False, methods=['post'], url_path='automated-interaction')
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
        
    @action(detail=False, methods=['post'], url_path='refresh-status')
    def refresh_statuses(self, request):
        print("Refreshing CRM account statuses...")
        settings_obj = SystemSettings.get_solo()
        now_ts = timezone.now()
        updated = []
        new_accounts_no_interaction = []
        
        print(f"Current time: {now_ts}, Inactive threshold: {settings_obj.inactive_threshold_days} days, Slow threshold: {settings_obj.slow_threshold_days} days")
        for account in CRMAccount.objects.exclude(status='archived'):
            last_interaction = account.last_interaction
            if not last_interaction and account.status == 'new':
                new_accounts_no_interaction.append(account)
                continue
            if not last_interaction:
                continue
            
            delta_days  = (now_ts - last_interaction).days
            prev_status = account.status
            
            if delta_days > settings_obj.inactive_threshold_days:
                new_status = 'inactive'
            elif delta_days > settings_obj.slow_threshold_days:
                new_status = 'slow'
            else:
                continue
            
            if prev_status != new_status:
                account.status = new_status
                account.save()
                updated.append({
                    "name": account.name,
                    "email": account.email,
                    "from_status": prev_status,
                    "to_status": new_status,
                    "last_interaction": last_interaction.strftime('%Y-%m-%d')
                })
            
            account.save()
            
        # send email notification if there are changes
        if updated or new_accounts_no_interaction:
            send_system_email(
                to_email=settings.SYSTEM_EMAIL_RECIPIENTS,
                subject="DotzHub CRM Status Update - {}".format(datetime.now().strftime("%Y-%m-%d")),
                template_path="../templates/emails/crm_status_report.html",
                context={
                    "updated_accounts": updated,
                    "new_accounts_no_interaction": new_accounts_no_interaction,
                    "year": datetime.now().year,
                }
            )
            
        return Response({
            "updated": len(updated),
            "message": "CRM accounts statuses updated successfully.",
            "sent_email": bool(updated)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='send-test-email')
    def send_test_email(self, request):
        import base64
        import requests

        message_id = "CAJPdHdrkhxa0N6FkJ=zMRxhCS+5CfNM2+V3CMRowkMJx+5JoSQ@mail.gmail.com"
        thread_id = "198327655501bd42"
        to_email = "yagelnahshon@gmail.com"
        # access_token = ".........."
        subject_text = "Re: שלום"
        subject_encoded = base64.b64encode(subject_text.encode("utf-8")).decode("utf-8")
        subject_header = f"=?UTF-8?B?{subject_encoded}?="

        email_raw = f"""To: {to_email}
Subject: {subject_header}
In-Reply-To: <{message_id}>
References: <{message_id}>
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: 7bit

<p>This is a <b>test reply</b> using Gmail API!</p>
"""

        raw_base64 = base64.urlsafe_b64encode(email_raw.encode("utf-8")).decode("utf-8")

        url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "raw": raw_base64,
            "threadId": thread_id
        }

        response = requests.post(url, headers=headers, json=payload)

        if response.status_code == 200:
            return Response({"status": "Email sent successfully"})
        else:
            return Response({
                "error": "Failed to send email",
                "details": response.json()
            }, status=status.HTTP_400_BAD_REQUEST)
                   
class GmailThreadView(APIView):
    permission_classes = [IsAuthenticated, CanAccessCRM]

    def get(self, request, thread_id):
        try:
            user_settings = UserSettings.objects.get(user=request.user)
            conn: EmailConnection = user_settings.crm_email_connection

            if not conn or conn.provider != 'google':
                print(f"conn: {conn}")
                print(f"conn.provider: {conn.provider if conn else 'None'}")
                return Response({"error": "No valid Google email connection found."}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                access_token = refresh_google_token(conn)
            except Exception as e:
                return Response({"error": f"Token refresh failed: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)
            
            url = f"https://gmail.googleapis.com/gmail/v1/users/me/threads/{thread_id}?format=full"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                return Response({"error": "Failed to fetch thread data", "details": response.json()}, status=response.status_code)
            
            thread_data = response.json()
            messages = []

            for msg in thread_data.get('messages', []):
                headers_map = {header['name']: header['value'] for header in msg.get('payload', {}).get('headers', [])}
                body = extract_body_from_payload(
                    msg.get('payload', {}),
                    message_id=msg.get('id'),
                    access_token=access_token
                )
                messages.append({
                    "message_id": msg.get('id'),
                    "real_message_id": headers_map.get('Message-ID', ''),
                    "from": headers_map.get('From', ''),
                    "to": headers_map.get('To', ''),
                    "subject": headers_map.get('Subject', ''),
                    "date": headers_map.get('Date', ''),
                    "body": body,
                })
            return Response({
                "thread_id": thread_data.get('id'),
                "messages": messages
            }, status=status.HTTP_200_OK)
        except UserSettings.DoesNotExist:
            return Response({"error": "User settings not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
def extract_body_from_payload(payload, message_id, access_token):
    """
    Recursively search for body; prefer text/html, then text/plain.
    If the content sits behind attachmentId (not a real file, often Gmail stores big bodies this way),
    fetch it via the attachments API. Returns a single string.
    """
    html_candidates = []
    text_candidates = []
    
    data, mt = _get_part_text(payload, message_id, access_token)

    if data:
        if mt == "text/html":
            return data
        elif mt == "text/plain":
            text_candidates.append(data)

    for part in payload.get("parts", []) or []:
        mt = (part.get("mimeType") or "").lower()

        # dive into multipart/*
        if mt.startswith("multipart/"):
            inner = extract_body_from_payload(part, message_id, access_token)
            if inner:
                # we don't guess by tags; we just keep order and prefer html later
                # keep as text candidate unless explicit html was returned
                if "<" in inner and ">" in inner:
                    html_candidates.append(inner)
                else:
                    text_candidates.append(inner)
            continue

        # leaf: fetch data or attachment only for text types
        if mt in ("text/html", "text/plain"):
            data, _ = _get_part_text(part, message_id, access_token)
            if data:
                if mt == "text/html":
                    html_candidates.append(data)
                else:
                    text_candidates.append(data)

    # 3) preference
    return (html_candidates[0] if html_candidates else
            (text_candidates[0] if text_candidates else "[No body found]"))
    

def _get_part_text(part, message_id, access_token):
    """
    Returns (text, mimeType) for text parts.
    - If body.data exists -> decode and return.
    - If body.attachmentId exists and mimeType is text/* -> fetch attachment and decode.
    - Otherwise -> (None, mimeType)
    """
    mt = (part.get("mimeType") or "").lower()
    body = part.get("body", {}) or {}

    # direct data
    raw = body.get("data")
    if raw:
        return _decode_body(raw), mt

    attachment_id = body.get("attachmentId")
    if attachment_id and mt.startswith("text/"):
        try:
            url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/attachments/{attachment_id}"
            headers = {"Authorization": f"Bearer {access_token}"}
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 200:
                data = resp.json().get("data")
                if data:
                    return _decode_body(data), mt
        except Exception:
            pass

    return None, mt

def _decode_body(data):
    """Decode base64url safely (add padding) and unescape HTML."""
    if not data:
        return ""
    try:
        pad = len(data) % 4
        if pad:
            data += "=" * (4 - pad)
        decoded_bytes = base64.urlsafe_b64decode(data.encode("utf-8"))
        return html.unescape(decoded_bytes.decode("utf-8", errors="replace"))
    except Exception:
        return "[Body decode error]"

# def decode_body(data):
#     if not data:
#         return ""
#     try:
#         decoded_bytes = base64.urlsafe_b64decode(data.encode('UTF-8'))
#         return html.unescape(decoded_bytes.decode('UTF-8'))
#     except Exception:
#         return "[Body decode error]"
    
class CRMTaskViewSet(viewsets.ModelViewSet):
    queryset = CRMTask.objects.all().order_by('-due_date')
    serializer_class = CRMTaskSerializer
    permission_classes = [IsAuthenticated, CanAccessCRM]

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

    