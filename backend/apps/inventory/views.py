import math
from rest_framework import viewsets
from .models import InventoryItem
from apps.system_settings.models import SystemSettings
from .serializers import InventoryItemSerializer
import pandas as pd
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView # import the APIView class for handling file uploads
from rest_framework.decorators import api_view
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser
from django.db import connection
import logging
from utils.email_utils import send_html_email
from django.http import HttpResponse
from django.db.models import Case, When
from import_export.formats.base_formats import XLSX, CSV
from .resources import InventoryResource, NetComponentsResource, ICSourceResource
from django.conf import settings
import zipfile
import pandas as pd
import io
import time
from decimal import Decimal

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
            STRING_AGG(supplier || '(' || cost || ')', ', ') AS supplier_cost,
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
    
@api_view(['DELETE'])
def bulk_delete_inventory(request):
    """
    Bulk delete inventory items by ids.
    """
    data = request.data
    print(f"Deleting items with IDs: {data.get('ids', [])}")
    ids_to_delete = data.get("ids", [])
    if not ids_to_delete:
        return Response({"error": "No IDs provided"}, status=400)
    try:
        deleted_count, _ = InventoryItem.objects.filter(id__in=ids_to_delete).delete()
        return Response({"success": f"Deleted {deleted_count} items successfully"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['PATCH'])
def bulk_edit_inventory(request):
    """
    Bulk edit inventory items by ids.
    """
    data = request.data
    print(f"Editing items with data: {data}")
    ids_to_edit = data.get("ids", [])
    if not ids_to_edit:
        return Response({"error": "No IDs provided"}, status=400)
    updates = data.get("updates", {})
    if not updates:
        return Response({"error": "No Fields to update provided"}, status=400)
    print(f"Updating items with IDs: {ids_to_edit} with updates: {updates}")
    try:
        updated_count = InventoryItem.objects.filter(id__in=ids_to_edit).update(**updates)
        return Response({"success": f"Updated {updated_count} items successfully"}, status=200)
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
    source = data.get("source", "web")
    print(f"Export source: {source}")

    # Get the export settings from the latest UserSettings object in the database if source is "make".
    # Otherwise, use the data from the request body. (source is "web")
    if (source == "make"):
        system_settings = SystemSettings.get_solo()
        if not system_settings:
            return Response({"error": "No settings found"}, status=400)
        data = {
            "actions": {
                "sendToNC": system_settings.export_netcomponents,
                "sendToICS": system_settings.export_icsource,
                "download": False,
            },
            "selectedSuppliers": system_settings.selected_suppliers,
            "fileFormat": system_settings.export_file_format,
            "netCOMPONENTS": {
                "enabled": system_settings.export_netcomponents,
                "max_stock_rows": system_settings.netcomponents_max_stock,
                "max_available_rows": system_settings.netcomponents_max_available,
            },
            "icSource": {
                "enabled": system_settings.export_icsource,
                "max_stock_rows": system_settings.icsource_max_stock,
                "max_available_rows": system_settings.icsource_max_available,
            },
            "inventory": {
                "enabled": False,
            }
        }
    print(f"Export data: {data}")    
    actions = data.get("actions", {})
    send_to_nc = actions.get("sendToNC", False)
    send_to_ics = actions.get("sendToICS", False)
    download = actions.get("download", False)
    suppliers = data.get("selectedSuppliers", [])
    format_type = data.get("fileFormat", "csv")
    net_components = data.get("netCOMPONENTS", {}).get("enabled", False)
    ic_source = data.get("icSource", {}).get("enabled", False)
    inventory = data.get("inventory", {}).get("enabled", False)

    max_rows = {
        "net_components_stock": data.get("netCOMPONENTS", {}).get("max_stock_rows", 0),
        "net_components_available": data.get("netCOMPONENTS", {}).get("max_available_rows", 0),
        "ic_source_stock": data.get("icSource", {}).get("max_stock_rows", 0),
        "ic_source_available": data.get("icSource", {}).get("max_available_rows", 0),
    }

    # Create a zip file buffer to store the exported files for download
    zip_buffer = io.BytesIO()
    zip_file = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)

    nc_attachments = []
    ics_attachments = []

    # Define a helper function for exporting data using Pandas with specific fields
    def export_data(queryset, filename, fields, column_names, recipient=None):
        print(f"Exporting data to {filename}...")
        curr_time = time.time()
        
        # Convert QuerySet to DataFrame with specific fields
        df = pd.DataFrame.from_records(queryset.values(*fields))

        if df.empty:
            print(f"No data found for {filename}")
            return

        # Rename columns to match the specified column names
        df.columns = column_names
        
        output_buffer = io.BytesIO()
        if format_type == "xlsx":
            df.to_excel(output_buffer, index=False, engine='xlsxwriter')
        else: # CSV
            df.to_csv(output_buffer, index=False, encoding='utf-8-sig')
        
        output_buffer.seek(0)
        zip_file.writestr(filename, output_buffer.getvalue())

        if recipient == "netcomponents":
            nc_attachments.append((filename, output_buffer.getvalue()))
        elif recipient == "icsource":
            ics_attachments.append((filename, output_buffer.getvalue()))

        print(f"Exported {len(df)} rows to {filename} in {time.time() - curr_time:.2f} seconds")

    if net_components:
        print("Starting NetComponents data export")
        net_start_time = time.time()

        stock_limit = max_rows["net_components_stock"]
        available_limit = max_rows["net_components_available"]
        total_limit = stock_limit + available_limit

        fields = ["mpn", "description", "manufacturer", "quantity", "url", "break_qty_a", "price_a"]
        column_names = ["P/N", "DESCRIPTION", "MFG", "QTY", "Shopping Cart URL", "BreakQtyA", "PriceA"]

        stock_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[:stock_limit]
        available_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[stock_limit:total_limit]

        print(f"NetComponents query time: {time.time() - net_start_time:.2f} seconds")

        file_creation_start = time.time()
        export_data(stock_data, f"netcomponents_stock.{format_type}", fields, column_names, "netcomponents")
        export_data(available_data, f"netcomponents_available.{format_type}", fields, column_names, "netcomponents")
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
        export_data(stock_data, f"icsource_stock.{format_type}", fields, column_names, "icsource")
        export_data(available_data, f"icsource_available.{format_type}", fields, column_names, "icsource")
        print(f"IC Source file creation time: {time.time() - file_creation_start:.2f} seconds")

    if inventory:
        print("Starting Inventory data export")
        inventory_start_time = time.time()
        
        data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])
        fields = ["mpn", "description", "manufacturer", "quantity", "supplier", "location", "date_code", "price", "url"]
        print(f"Inventory query time: {time.time() - inventory_start_time:.2f} seconds")

        file_creation_start = time.time()
        export_data(data, f"inventory.{format_type}", fields, fields)
        print(f"Inventory file creation time: {time.time() - file_creation_start:.2f} seconds")

    zip_file.close()
    zip_buffer.seek(0)

    print(f"Total export time: {time.time() - start_time:.2f} seconds")

    if send_to_nc and nc_attachments:
        print("Sending NetComponents email...")
        send_html_email(
            data={
                "email": settings.NC_INVENTORY_UPDATE_EMAIL,
                "my_company": settings.COMPANY_NAME,
            },
            template="ncupdate",
            from_account="inventory",
            attachments=[
                (file_name, io.BytesIO(file_content), "text/csv" if file_name.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                for file_name, file_content in nc_attachments
            ]
        )

    if send_to_ics and ics_attachments:
        print("Sending IC Source email...")
        send_html_email(
            data={
                "email": settings.ICS_INVENTORY_UPDATE_EMAIL,
                "my_company": settings.COMPANY_NAME,
            },
            template="icsupdate",
            from_account="inventory",
            attachments = [
                (file_name, io.BytesIO(file_content), "text/csv" if file_name.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                for file_name, file_content in ics_attachments
            ]
        )
    if download:
        response = HttpResponse(zip_buffer, content_type="application/zip")
        response["Content-Disposition"] = "attachment; filename=export.zip"
        return response
    
    return Response({"success": "Export completed successfully"}, status=200)

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
                        #validate required fields
                        if pd.isna(row['mpn']) or pd.isna(row['quantity']) or pd.isna(row['supplier']):
                            raise ValueError("MPN, quantity, and supplier are required fields")
                        try:
                            quantity = int(row['quantity'])
                        except ValueError:
                            raise ValueError(f"Invalid quantity value: {row['quantity']}")
                        
                        # price      = self.clean_value(row, 'price')
                        # cost       = self.clean_value(row, 'cost')
                        # break_qty_a= self.clean_value(row, 'BreakQtyA', to_int=True)
                        # price_a    = self.clean_value(row, 'PriceA')

                        field_map = {
                            'manufacturer': {'column': 'manufacturer'},
                            'location':     {'column': 'location'},
                            'supplier':     {'column': 'supplier'},  # already validated
                            'description':  {'column': 'description'},
                            'date_code':    {'column': 'dc'},
                            'price':        {'column': 'price', 'type': 'decimal'},
                            'cost':         {'column': 'cost',  'type': 'decimal'},
                            'break_qty_a':  {'column': 'break_qty_a', 'type': 'int'},
                            'price_a':      {'column': 'price_a', 'type': 'decimal'},
                            'url':          {'column': 'url'},
                            'notes':        {'column': 'notes'},
                        }

                        # Clean and convert values
                        cleaned_fields = {}
                        for field_name, meta in field_map.items():
                            col = meta['column']
                            val = self.clean_value(row, col, meta.get('type'))
                            cleaned_fields[field_name] = val

                        item = InventoryItem(
                            mpn=row['mpn'],
                            quantity=quantity,
                            **cleaned_fields
                        )
                        print(f"Adding item {item.mpn}")
                        inventory_items.append(item)    
                        successful_rows += 1

                    except Exception as e:
                        print(f"Error processing row {index}: {str(e)}")
                        failed_rows += 1
                        failed_rows_details.append({"row": index, "error": str(e)})

                        
                        # price = row.get('price', None)
                        # if price is not None and isinstance(price, float) and math.isnan(price):
                        #     price = None

                        # cost = row.get('cost', None)
                        # if cost is not None and isinstance(cost, float) and math.isnan(cost):
                        #     cost = None

                        # break_qty_a = row.get('BreakQtyA', None)
                        # if break_qty_a is not None and isinstance(break_qty_a, float) and math.isnan(break_qty_a):
                        #     break_qty_a = None

                        # price_a = row.get('PriceA', None)
                        # if price_a is not None and isinstance(price_a, float) and math.isnan(price_a):
                        #     price_a = None

                        # Create InventoryItem instance

                        # item = InventoryItem(
                        #     mpn = row['mpn'],
                        #     quantity = quantity,
                        #     manufacturer = self.convert_nan_to_none(row.get('manufacturer', None)),
                        #     location = self.convert_nan_to_none(row.get('location', None)),
                        #     supplier = row.get('supplier', None),
                        #     description = self.convert_nan_to_none(row.get('description', None)),
                        #     date_code = self.convert_nan_to_none(row.get('dc', None)),
                        #     price = price,
                        #     cost = cost,
                        #     break_qty_a = break_qty_a,
                        #     price_a = price_a,
                        #     url = self.convert_nan_to_none(row.get('url', None))
                        # )
                        # print(f"Adding item {item.mpn}")
                        # inventory_items.append(item)
                        # successful_rows += 1
                    # except Exception as e:
                    #     print(f"Error processing row {index}: {str(e)}")
                    #     failed_rows += 1
                    #     failed_rows_details.append({"row": index, "error": str(e)})
                
                InventoryItem.objects.bulk_create(inventory_items)
                print(f"Added {len(inventory_items)} items")
                
            logger.debug(f"Successfully uploaded {successful_rows} items")
            logger.debug(f"{failed_rows} rows failed to upload")
            logger.debug(f"Failed details: {failed_rows_details}")

            return Response({
                "success_count": successful_rows,
                "failed_count": failed_rows,
                "failed_details": failed_rows_details
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error uploading file: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    # def convert_nan_to_none(self, value):
    #     if pd.isna(value):
    #         return None
    #     return value
    
    def clean_value(self, row, col_name, val_type=None):
        val = row.get(col_name, None)
        if pd.isna(val):
            return None
        if val_type == 'int':
            return int(val)
        if val_type == 'decimal':
            return Decimal(str(val))
        return val