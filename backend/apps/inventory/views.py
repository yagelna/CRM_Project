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
    Supports NetComponents and IC Source exports.
    Can be triggered from the web or Make.com.
    """
    start_time = time.time()
    print("Starting export process...")
  
    # ---------- Parse input / system settings ----------
    data = request.data
    source = data.get("source", "web")
    print(f"Export source: {source}")

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
    inventory_export = data.get("inventory", {}).get("enabled", False)

    limits = {
        "nc_stock": data.get("netCOMPONENTS", {}).get("max_stock_rows", 0),
        "nc_avail": data.get("netCOMPONENTS", {}).get("max_available_rows", 0),
        "ics_stock": data.get("icSource", {}).get("max_stock_rows", 0),
        "ics_avail": data.get("icSource", {}).get("max_available_rows", 0),
    }

        # ---------- Prepare zip / email attachments ----------
    zip_buffer = io.BytesIO()
    zip_file = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)
    nc_attachments, ics_attachments = [], []

    # ---------- Columns per destination ----------
    NC_FIELDS   = ["mpn", "description", "manufacturer", "quantity", "url", "break_qty_a", "price_a"]
    NC_COLUMNS  = ["P/N", "DESCRIPTION", "MFG", "QTY", "Shopping Cart URL", "BreakQtyA", "PriceA"]

    ICS_FIELDS  = ["mpn", "description", "manufacturer", "quantity"]
    ICS_COLUMNS = ["P/N", "DESCRIPTION", "MFG", "QTY"]

    INV_FIELDS  = ["mpn", "description", "manufacturer", "quantity", "supplier", "location", "date_code", "price", "url"]

    # ---------- Helper to write a dataframe into the zip & attachments ----------

    def write_rows(rows, filename, fields, column_names, recipient=None):
        print(f"Exporting {filename} ({len(rows)} rows)...")
        if not rows:
            return
        df = pd.DataFrame(rows)
        # make sure all columns exist (in case some fields absent)
        for f in fields:
            if f not in df.columns:
                df[f] = ""
        df = df[fields]
        df.columns = column_names

        out = io.BytesIO()
        if format_type == "xlsx":
            df.to_excel(out, index=False, engine="xlsxwriter")
        else:
            df.to_csv(out, index=False, encoding="utf-8-sig")
        out.seek(0)

        zip_file.writestr(filename, out.getvalue())

        if recipient == "netcomponents":
            nc_attachments.append((filename, out.getvalue()))
        elif recipient == "icsource":
            ics_attachments.append((filename, out.getvalue()))

    # we need up to the maximum total rows across both sites.
    need_shared = (net_components or ic_source) and suppliers
    total_nc  = limits["nc_stock"]  + limits["nc_avail"]  if net_components else 0
    total_ics = limits["ics_stock"] + limits["ics_avail"] if ic_source       else 0
    required_total = max(total_nc, total_ics)

    ordered_rows = []  # list of dicts (union of fields)
    if need_shared and required_total > 0:
        UNION_FIELDS = sorted(set(NC_FIELDS) | set(ICS_FIELDS))
        CHUNK_SIZE = 10000

        print(f"Shared fetch start. Suppliers={len(suppliers)}, target rows={required_total}")
        t0 = time.time()

        # iterate suppliers in the user-defined order; stop once enough rows collected
        for s in suppliers:
            qs = InventoryItem.objects.filter(supplier=s).values(*UNION_FIELDS).order_by('id')
            cnt_before = len(ordered_rows)
            for row in qs.iterator(chunk_size=CHUNK_SIZE):
                ordered_rows.append(row)
                if len(ordered_rows) >= required_total:
                    break
            print(f"  supplier='{s}': +{len(ordered_rows)-cnt_before} rows (total {len(ordered_rows)})")
            if len(ordered_rows) >= required_total:
                break

        print(f"Shared fetch done in {time.time() - t0:.2f}s; collected {len(ordered_rows)} rows.")

    # ---------- Build NC exports ----------
    if net_components:
        t1 = time.time()
        rows_nc_full = ordered_rows[:total_nc] if need_shared else list(
            InventoryItem.objects.filter(supplier__in=suppliers)
            .order_by('supplier', 'id')
            .values(*NC_FIELDS)[:total_nc]
        )

        nc_stock_rows = rows_nc_full[:limits["nc_stock"]]
        nc_avail_rows = rows_nc_full[limits["nc_stock"]: total_nc]

        write_rows(nc_stock_rows,  f"netcomponents_stock.{format_type}",    NC_FIELDS, NC_COLUMNS, "netcomponents")
        write_rows(nc_avail_rows,  f"netcomponents_available.{format_type}", NC_FIELDS, NC_COLUMNS, "netcomponents")
        print(f"NC file creation time: {time.time() - t1:.2f}s")

    # ---------- Build ICS exports ----------
    if ic_source:
        t2 = time.time()
        rows_ics_full = ordered_rows[:total_ics] if need_shared else list(
            InventoryItem.objects.filter(supplier__in=suppliers)
            .order_by('supplier', 'id')
            .values(*ICS_FIELDS)[:total_ics]
        )

        ics_stock_rows = rows_ics_full[:limits["ics_stock"]]
        ics_avail_rows = rows_ics_full[limits["ics_stock"]: total_ics]

        write_rows(ics_stock_rows, f"icsource_stock.{format_type}",     ICS_FIELDS, ICS_COLUMNS, "icsource")
        write_rows(ics_avail_rows, f"icsource_available.{format_type}", ICS_FIELDS, ICS_COLUMNS, "icsource")
        print(f"ICS file creation time: {time.time() - t2:.2f}s")

    # ---------- Optional full inventory export ----------
    if inventory_export:
        t3 = time.time()
        qs = (InventoryItem.objects
              .filter(supplier__in=suppliers)
              .values(*INV_FIELDS)
              .order_by('supplier', 'id'))
        inv_rows = list(qs)  # אם תרצה: לעבור עם iterator ולכתוב בקבצים חלקיים
        write_rows(inv_rows, f"inventory.{format_type}", INV_FIELDS, INV_FIELDS, None)
        print(f"Inventory file creation time: {time.time() - t3:.2f}s")

    # ---------- Finish up ----------
    zip_file.close()
    zip_buffer.seek(0)
    print(f"Total export time: {time.time() - start_time:.2f} seconds")

    # send emails if needed
    if send_to_nc and nc_attachments:
        print("Sending NetComponents email...")
        send_html_email(
            data={"email": settings.NC_INVENTORY_UPDATE_EMAIL, "my_company": settings.COMPANY_NAME},
            template="ncupdate",
            from_account="inventory",
            attachments=[
                (fname, io.BytesIO(content), "text/csv" if fname.endswith(".csv") else
                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                for (fname, content) in nc_attachments
            ]
        )

    if send_to_ics and ics_attachments:
        print("Sending IC Source email...")
        send_html_email(
            data={"email": settings.ICS_INVENTORY_UPDATE_EMAIL, "my_company": settings.COMPANY_NAME},
            template="icsupdate",
            from_account="inventory",
            attachments=[
                (fname, io.BytesIO(content), "text/csv" if fname.endswith(".csv") else
                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                for (fname, content) in ics_attachments
            ]
        )

    if download:
        resp = HttpResponse(zip_buffer, content_type="application/zip")
        resp["Content-Disposition"] = "attachment; filename=export.zip"
        return resp

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