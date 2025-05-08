from django.shortcuts import render
from rest_framework import viewsets, status
from .models import Contact
from .serializers import ContactSerializer
from rest_framework.response import Response
from ..rfqs.serializers import RFQSerializer
from ..rfqs.models import RFQ
import pandas as pd
from django.http import HttpResponse
import io

from rest_framework.decorators import api_view

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
    
@api_view(['GET'])
def contact_rfqs(request, contact_id):
    try:
        rfqs = RFQ.objects.filter(customer=contact_id)
        serializer = RFQSerializer(rfqs, many=True)
        return Response(serializer.data)
    except RFQ.DoesNotExist:
        return Response({'error': 'No RFQs found for this contact'}, status=404)
    
@api_view(['DELETE'])
def bulk_delete_contacts(request):
    """
    Bulk delete contacts by ids
    """
    data = request.data
    ids = data.get('ids', [])
    print(f"Deleting contacts with IDs: {ids}")
    if not ids:
        return Response({"error": "No IDs provided"}, status=400)
    try:
        deleted_count, _ = Contact.objects.filter(id__in=ids).delete()
        return Response({"success": f"Deleted {deleted_count} items successfully"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def export_contacts(request):
    """
    Export contacts to CSV or Excel based on incoming JSON:
      {
        "format": "csv" | "xlsx",
        "scope":  "all" | "selected",
        "fields": ["name", "email", ...],
        "ids":    [1,2,3]            # only if scope=="selected"
      }
    """
    data = request.data
    export_format = data.get('format', 'csv')
    scope = data.get('scope', 'all')
    fields = data.get('fields', [])
    ids = data.get('ids', [])

    print(f"Exporting contacts with format: {export_format}, scope: {scope}, fields: {fields}, ids: {ids}")

    #basic validation
    if export_format not in ['csv', 'xlsx']:
        return Response({'error': 'Invalid format'}, status=400)
    if scope == 'selected' and not ids:
        return Response({'error': 'IDs required for selected scope'}, status=400)
    if not fields:
        return Response({'error': 'Fields required'}, status=400)
    
    qs = Contact.objects.all()
    if scope == 'selected':
        qs = qs.filter(id__in=ids)

    qs = qs.values(*fields)
    df = pd.DataFrame.from_records(qs)
    for col in df.columns:
        if pd.api.types.is_datetime64tz_dtype(df[col]):
            df[col] = df[col].dt.tz_localize(None)
    df.columns = [col.replace('__', '_') for col in df.columns]

    buffer = io.BytesIO()
    if export_format == 'csv':
        df.to_csv(buffer, index=False, encoding='utf-8-sig')
        content_type = 'text/csv; charset=utf-8-sig'
    else:
        df.to_excel(buffer, index=False, engine='xlsxwriter')
        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    buffer.seek(0)
    filename = f"contacts_export.{export_format}"

    response = HttpResponse(buffer.getvalue(), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
