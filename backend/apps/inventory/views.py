from rest_framework import viewsets
from .models import InventoryItem
from .serializers import InventoryItemSerializer
import pandas as pd
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView # import the APIView class for handling file uploads
from rest_framework.decorators import api_view
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser
from django.db import connection
import logging
from django.http import HttpResponse
from django.db.models import Case, When
from import_export.formats.base_formats import XLSX, CSV
from .resources import InventoryResource, NetComponentsResource, ICSourceResource
import zipfile
import pandas as pd
import io
import time
logger = logging.getLogger('myapp')


# search_parts view to search for parts by MPN
@api_view(['GET'])
def search_parts(request, mpn):
    """
    Search for parts in the inventory by MPN.
    Return all parts that match the exact MPN.
    """
    try:
        print(f"Searching for parts with MPN: {mpn}")
        items = InventoryItem.objects.filter(mpn=mpn)
        serializer = InventoryItemSerializer(items, many=True)
        return Response(serializer.data)
    except InventoryItem.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND) 

# search_similar_parts view to search for similar parts by MPN
@api_view(['GET'])
def search_similar_parts(request, mpn):
    """
    Search for similar parts based on MPN similarity using raw SQL.
    """
    query = """
        SELECT 
            mpn,
            SUM(quantity) AS total_quantity,
            STRING_AGG(supplier || '(' || quantity || ')', ', ') AS supplier_quantities,
            STRING_AGG(supplier || '(' || date_code || ')', ', ') AS supplier_dc,
            MAX(manufacturer) AS manufacturer,
            similarity(mpn, %s) AS similarity_score
        FROM 
            inventory_inventoryitem
        WHERE 
            similarity(mpn, %s) > 0.5
        GROUP BY 
            mpn
        ORDER BY 
            similarity_score DESC
        LIMIT 10;
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, [mpn, mpn])
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return Response(results, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# get_suppliers view to get a list of unique suppliers
@api_view(['GET'])
def get_suppliers(request):
    """
    Get a list of unique suppliers in the inventory.
    """
    query = """
        SELECT supplier, COUNT(*) AS total_parts
        FROM public.inventory_inventoryitem
        GROUP BY supplier
        ORDER BY MIN(id);
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = [
                {
                    "supplier": row[0],
                    "total_parts": row[1]
                } for row in cursor.fetchall()
            ]
        
        return Response({"suppliers": results}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
def export_inventory(request):
    """
    Export inventory data to a CSV/Excel file using Pandas.
    """
    start_time = time.time()
    print("Starting export process...")

    # Parse JSON data from the request body
    data = request.data

    suppliers = data.get("selectedSuppliers", [])
    format_type = data.get("fileFormat", "csv")
    net_components = data.get("netComponents", {}).get("enabled", False)
    ic_source = data.get("icSource", {}).get("enabled", False)
    inventory = data.get("inventory", {}).get("enabled", False)
    max_rows = {
        "net_components_stock": data.get("netComponents", {}).get("max_stock_rows", 0),
        "net_components_available": data.get("netComponents", {}).get("max_available_rows", 0),
        "ic_source_stock": data.get("icSource", {}).get("max_stock_rows", 0),
        "ic_source_available": data.get("icSource", {}).get("max_available_rows", 0),
    }

    # Create a zip file buffer to store the exported files
    zip_buffer = io.BytesIO()
    zip_file = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)

    # Define a helper function for exporting data using Pandas with specific fields
    def export_data(queryset, filename, fields, column_names):
        print(f"Exporting data to {filename}...")
        curr_time = time.time()
        
        # Convert QuerySet to DataFrame with specific fields
        df = pd.DataFrame.from_records(queryset.values(*fields))
        df.columns = column_names
        
        output_buffer = io.BytesIO()
        if format_type == "xlsx":
            df.to_excel(output_buffer, index=False, engine='xlsxwriter')
        else: # CSV
            df.to_csv(output_buffer, index=False, encoding='utf-8-sig')
        
        output_buffer.seek(0)
        zip_file.writestr(filename, output_buffer.getvalue())
        print(f"Exported {len(df)} rows to {filename} in {time.time() - curr_time:.2f} seconds")

    if net_components:
        print("Starting NetComponents data export")
        net_start_time = time.time()

        stock_limit = max_rows["net_components_stock"]
        available_limit = max_rows["net_components_available"]
        total_limit = stock_limit + available_limit

        fields = ["mpn", "description", "manufacturer", "quantity", "url"]
        column_names = ["P/N", "DESCRIPTION", "MFG", "QTY", "Shopping Cart URL"]

        stock_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[:stock_limit]
        available_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[stock_limit:total_limit]

        print(f"NetComponents query time: {time.time() - net_start_time:.2f} seconds")

        file_creation_start = time.time()
        export_data(stock_data, f"netcomponents_stock.{format_type}", fields, column_names)
        export_data(available_data, f"netcomponents_available.{format_type}", fields, column_names)
        print(f"NetComponents file creation time: {time.time() - file_creation_start:.2f} seconds")

    if ic_source:
        print("Starting IC Source data export")
        ic_start_time = time.time()
        
        stock_limit = max_rows["ic_source_stock"]
        available_limit = max_rows["ic_source_available"]
        total_limit = stock_limit + available_limit

        fields = ["mpn", "description", "manufacturer", "quantity"]
        column_names = ["P/N", "DESCRIPTION", "MFG", "QTY"]

        stock_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[:stock_limit]
        available_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[stock_limit:total_limit]

        print(f"IC Source query time: {time.time() - ic_start_time:.2f} seconds")

        file_creation_start = time.time()
        export_data(stock_data, f"icsource_stock.{format_type}", fields, column_names)
        export_data(available_data, f"icsource_available.{format_type}", fields, column_names)
        print(f"IC Source file creation time: {time.time() - file_creation_start:.2f} seconds")

    if inventory:
        print("Starting Inventory data export")
        inventory_start_time = time.time()
        
        data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])
        fields = ["mpn", "description", "manufacturer", "quantity", "supplier", "location", "date_code", "cost", "url"]
        print(f"Inventory query time: {time.time() - inventory_start_time:.2f} seconds")

        file_creation_start = time.time()
        export_data(data, f"inventory.{format_type}", fields, fields)
        print(f"Inventory file creation time: {time.time() - file_creation_start:.2f} seconds")

    zip_file.close()
    zip_buffer.seek(0)

    print(f"Total export time: {time.time() - start_time:.2f} seconds")

    # Return the zip file as a response
    response = HttpResponse(zip_buffer, content_type="application/zip")
    response["Content-Disposition"] = "attachment; filename=export.zip"
    return response

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

class BulkUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser, FileUploadParser)

    def post(self, request):
        print("Starting bulk upload...")
        file = request.FILES.get('file')

        if not file:
            print("No file provided")
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_excel(file)
            print(f"File uploaded with {len(df)} rows")
            chunk_size = 1000
            successful_rows = 0
            failed_rows = 0
            failed_rows_details = []

            for i in range(0, len(df), chunk_size):
                chunk = df[i:i + chunk_size]
                print("Processing chunk...")
                inventory_items = []
                for index, row in chunk.iterrows():
                    try:
                        #validate the row
                        if not row['mpn'] or not row['quantity'] or not row['supplier']:
                            raise ValueError("MPN, quantity, and supplier are required fields")
                        try:
                            quantity = int(row['quantity'])
                        except ValueError:
                            raise ValueError(f"Invalid quantity value: {row['quantity']}")
                        item = InventoryItem(
                            mpn = row['mpn'],
                            quantity = quantity,
                            manufacturer = row.get('manufacturer', ''),
                            location = row.get('location', ''),
                            supplier = row.get('supplier', ''),
                            description = row.get('description', ''),
                            date_code = row.get('dc', ''),
                        )
                        print(f"Adding item {item.mpn}")
                        inventory_items.append(item)
                        successful_rows += 1
                    except Exception as e:
                        print(f"Error processing row {index}: {str(e)}")
                        failed_rows += 1
                        failed_rows_details.append({"row": index, "error": str(e)})
                
                InventoryItem.objects.bulk_create(inventory_items)
                print(f"Added {len(inventory_items)} items")
                
            logger.debug(f"Successfully uploaded {successful_rows} items")
            logger.debug(f"{failed_rows} rows failed to upload")
            logger.debug(f"Failed details: {failed_rows_details}")

            return Response({
                "success": f"Successfully uploaded {successful_rows} items",
                "failed": f"{failed_rows} rows failed to upload",
                "failed_details": failed_rows_details
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error uploading file: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    
 
