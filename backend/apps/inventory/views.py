from rest_framework import viewsets
from .models import InventoryItem
from .serializers import InventoryItemSerializer
import pandas as pd
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView # import the APIView class for handling file uploads
from rest_framework.decorators import api_view
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser
from elasticsearch import Elasticsearch

es = Elasticsearch(hosts=["http://localhost:9200"])

@api_view(['GET'])
def search_parts(request, mpn):
    """
    Search for parts in the inventory by MPN.
    Return all parts that match the exact MPN and the 7 most similar MPNs using Elasticsearch.
    """
    try:
        query = {
            "size": 50,
            "query": {
                "bool": {
                    "should": [
                        {"match": {"mpn": {"query": mpn, "boost": 2}}},  # Exact match with higher priority
                        {"fuzzy": {"mpn": {"value": mpn, "fuzziness": "AUTO"}}}  # Similar parts
                    ]
                }
            }
        }

        res = es.search(index="inventory", body=query)
        hits = res['hits']['hits']

        # Process results
        exact_match = [hit['_source'] for hit in hits if hit['_source']['mpn'] == mpn]
        similar_parts = [
            hit['_source'] for hit in hits if hit['_source']['mpn'] != mpn
        ][:7]

        return Response(
            {"exact_match": exact_match, "similar_parts": similar_parts},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



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
        
    
 
