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
from import_export.formats.base_formats import XLSX, CSV, XLS
from .resources import InventoryResource, NetComponentsResource, ICSourceResource
import zipfile
import io
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
        SELECT supplier
        FROM public.inventory_inventoryitem
        GROUP BY supplier
        ORDER BY MIN(id);
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = [row[0] for row in cursor.fetchall()]
        
        return Response({"suppliers": results}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# export_data view to export inventory data to a CSV/Excel file
@api_view(['POST'])
def export_inventory(request):
    """
    Export inventory data to a CSV/Excel file.
    """
    # get suppliers from request query params 
    # if inventory format is enabled, get all fields where supplier is in the list of suppliers (by the same order)
    # else, get only necessary fields for icsource/netcomponents format where supplier is in the list of suppliers (by the same order)
    # create a pandas DataFrame from the filtered data according to the requsted files
    # if there is more then one data format requested, create multiple files and zip them together
    # return the zip file as a response

    # Parse JSON data from the request body
    data = request.data

    # Extract data from the JSON body
    suppliers = data.get("selectedSuppliers", [])
    format_type = data.get("fileFormat", "xlsx")
    net_components = data.get("netComponents", {}).get("enabled", False)
    ic_source = data.get("icSource", {}).get("enabled", False)
    inventory = data.get("inventory", {}).get("enabled", False)
    max_rows = {
        "net_components_stock": data.get("netComponents", {}).get("max_stock_rows", 0),
        "net_components_available": data.get("netComponents", {}).get("max_available_rows", 0),
        "ic_source_stock": data.get("icSource", {}).get("max_stock_rows", 0),
        "ic_source_available": data.get("icSource", {}).get("max_available_rows", 0),
    }

    # Debugging
    print("Suppliers:", suppliers)
    print("Format:", format_type)
    print("NetComponents Enabled:", net_components)
    print("IC Source Enabled:", ic_source)
    print("Inventory Enabled:", inventory)
    print("Max Rows:", max_rows)

    #export logic here (e.g., generate files based on data)
    zip_buffer = io.BytesIO()
    zip_file = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)

    # Define a helper function for data export with parameters for queryset, filename, and default resource of InventoryResource
    def export_data(queryset, filename, resource=InventoryResource):
        resource = resource()
        dataset = resource.export(queryset)
        if format_type == "xlsx":
            file_format = XLSX
        elif format_type == "csv":
            file_format = CSV
        elif format_type == "xls":
            file_format = XLS
        content = file_format().export_data(dataset)
        zip_file.writestr(filename, content)

    if net_components:
        stock_limit = max_rows["net_components_stock"]
        available_limit = max_rows["net_components_available"]
        total_limit = stock_limit + available_limit
        # Get the data for NetComponents format (stock and available rows) by same order of suppliers and then separate them
        stock_data = InventoryItem.objects.filter(supplier__in=suppliers).only("mpn", "description", "manufacturer", "quantity", "url").order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[:stock_limit]
        available_data = InventoryItem.objects.filter(supplier__in=suppliers).only("mpn", "description", "manufacturer", "quantity", "url").order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[stock_limit:total_limit]
        print(stock_data)
        print(available_data)
        export_data(stock_data, f"netcomponents_stock.{format_type}", NetComponentsResource)
        export_data(available_data, f"netcomponents_available.{format_type}", NetComponentsResource)

    if ic_source:
        stock_limit = max_rows["ic_source_stock"]
        available_limit = max_rows["ic_source_available"]
        total_limit = stock_limit + available_limit
        # Get the data for IC Source format (stock and available rows) by same order of suppliers and then separate them
        stock_data = InventoryItem.objects.filter(supplier__in=suppliers).only("mpn", "description", "manufacturer", "quantity").order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[:stock_limit]
        available_data = InventoryItem.objects.filter(supplier__in=suppliers).only("mpn", "description", "manufacturer", "quantity").order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[stock_limit:total_limit]
        export_data(stock_data, f"icsource_stock.{format_type}")
        export_data(available_data, f"icsource_available.{format_type}", ICSourceResource)

    if inventory:
        # Get the data for inventory format by same order of suppliers
        data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])
        export_data(data, f"inventory.{format_type}", InventoryResource)

    zip_file.close()
    zip_buffer.seek(0)

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
        
    
 
