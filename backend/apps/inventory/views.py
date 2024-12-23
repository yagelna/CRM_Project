from rest_framework import viewsets
from .models import InventoryItem
from .serializers import InventoryItemSerializer
import pandas as pd
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

class BulkUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser, FileUploadParser)

    def post(self, request):
        print("first debug check")
        file = request.FILES.get('file')
        print("second debug check")

        if not file:
            print("there is no file")
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            print("file exists")
            df = pd.read_excel(file)
            print("file read")
        try:
            for index, row in df.iterrows():
                InventoryItem.objects.create(
                    mpn = row['mpn'],
                    quantity = row['quantity'],
                    manufacturer = row.get('manufacturer', ''),
                    location = row.get('location', ''),
                    supplier = row.get('supplier', ''),
                    description = row.get('description', ''),
                    date_code = row.get('date_code', ''),
                )
            return Response({"success": f"{len(df)} items successfully added"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    
 
