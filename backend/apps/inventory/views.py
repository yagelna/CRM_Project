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

# ---- shared download fields  ----
DB_FIELDS = [
    "mpn",
    "description",
    "manufacturer",
    "quantity",
    "supplier",
    "location",
    "date_code",
    "price",
    "url",
]

DOWNLOAD_COLUMNS = [
    "MPN",
    "Description",
    "Manufacturer",
    "Quantity",
    "Supplier",
    "Location",
    "Date Code",
    "Price",
    "URL",
]


def _df_from_queryset(qs, fields, columns):
    rows = list(qs.values(*fields))
    df = pd.DataFrame(rows)
    # Ensure all columns exist (even if queryset returned empty)
    for f in fields:
        if f not in df.columns:
            df[f] = None
    df = df[fields]
    df.columns = columns
    return df


def _zip_single_file_response(df: pd.DataFrame, base_name: str, format_type: str):
    """
    Returns a ZIP (export.zip) that contains a single file: {base_name}.{csv|xlsx}
    """
    zip_buffer = io.BytesIO()
    ext = "xlsx" if format_type == "xlsx" else "csv"
    filename = f"{base_name}.{ext}"

    with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        if format_type == "xlsx":
            file_buffer = io.BytesIO()
            with pd.ExcelWriter(file_buffer, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name="Inventory")
            zf.writestr(filename, file_buffer.getvalue())
        else:
            zf.writestr(filename, df.to_csv(index=False))

    zip_buffer.seek(0)
    resp = HttpResponse(zip_buffer.getvalue(), content_type="application/zip")
    resp["Content-Disposition"] = 'attachment; filename="export.zip"'
    return resp


@api_view(["POST"])
def download_inventory_all(request):
    """
    Download ALL inventory (no supplier filter).
    Body: { "fileFormat": "csv" | "xlsx" }
    """
    data = request.data or {}
    fmt = data.get("fileFormat", "csv")

    qs = InventoryItem.objects.all().order_by("id")
    df = _df_from_queryset(qs, DB_FIELDS, DOWNLOAD_COLUMNS)
    return _zip_single_file_response(df, "inventory_all", fmt)


@api_view(["POST"])
def download_inventory_suppliers(request):
    """
    Download inventory by selected suppliers.
    Body: { "suppliers": ["A", "B"], "fileFormat": "csv" | "xlsx" }
    """
    data = request.data or {}
    fmt = data.get("fileFormat", "csv")
    suppliers = data.get("suppliers") or []

    if not suppliers:
        return Response({"error": "No suppliers provided"}, status=400)

    qs = InventoryItem.objects.filter(supplier__in=suppliers).order_by("supplier", "id")
    df = _df_from_queryset(qs, DB_FIELDS, DOWNLOAD_COLUMNS)
    return _zip_single_file_response(df, "inventory_suppliers", fmt)


@api_view(["POST"])
def download_inventory_selected(request):
    """
    Download inventory by selected row IDs.
    Body: { "ids": [1,2,3], "fileFormat": "csv" | "xlsx" }
    """
    data = request.data or {}
    fmt = data.get("fileFormat", "csv")
    ids_list = data.get("ids") or []

    if not ids_list:
        return Response({"error": "No ids provided"}, status=400)

    qs = InventoryItem.objects.filter(id__in=ids_list).order_by("id")
    df = _df_from_queryset(qs, DB_FIELDS, DOWNLOAD_COLUMNS)
    return _zip_single_file_response(df, "inventory_selected_rows", fmt)

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

    NEW:
    - Use separate stockSuppliers and availableSuppliers lists.
    - For each platform (NC/ICS): fill stock first, overflow to available,
      then process available suppliers.
    """
    start_time = time.time()
    print("Starting export process...")

    # ---------- Parse input / system settings ----------

    data = request.data
    source = data.get("source", "web") # "web" | "make"
    action = data.get("action", "send")  # "send" | "download" | "both"

    # When triggered from Make.com – read from SystemSettings
    if source == "make":
        system_settings = SystemSettings.get_solo()
        if not system_settings:
            return Response({"error": "System settings not found"}, status=500)

        if not system_settings.auto_update:
            return Response({"message": "Auto update disabled"}, status=200)

        net_components_enabled = system_settings.export_netcomponents
        ic_source_enabled = system_settings.export_icsource
        # You can decide default action for make:
        action = "send"

        stock_suppliers = system_settings.stock_suppliers or []
        available_suppliers = system_settings.available_suppliers or []

        file_format = system_settings.export_file_format or "csv"

        max_nc_stock = system_settings.netcomponents_max_stock or 0
        max_nc_avail = system_settings.netcomponents_max_available or 0
        max_ics_stock = system_settings.icsource_max_stock or 0
        max_ics_avail = system_settings.icsource_max_available or 0

    else:
        # Web: use payload
        net_components_enabled = data.get("netCOMPONENTS", {}).get("enabled", False)
        ic_source_enabled = data.get("icSource", {}).get("enabled", False)

        stock_suppliers = data.get("stockSuppliers", []) or []
        available_suppliers = data.get("availableSuppliers", []) or []

        file_format = data.get("fileFormat", "csv")

        max_nc_stock = data.get("netCOMPONENTS", {}).get("max_stock_rows", 0) or 0
        max_nc_avail = data.get("netCOMPONENTS", {}).get("max_available_rows", 0) or 0
        max_ics_stock = data.get("icSource", {}).get("max_stock_rows", 0) or 0
        max_ics_avail = data.get("icSource", {}).get("max_available_rows", 0) or 0

    # Validate platforms
    if not net_components_enabled and not ic_source_enabled:
        return Response({"error": "Please enable at least one platform"}, status=400)

    # Map action to booleans
    send_to_nc = action in ("send", "both") and net_components_enabled
    send_to_ics = action in ("send", "both") and ic_source_enabled
    download = action in ("download", "both")

    # Must have at least one supplier if any export is enabled
    if not (stock_suppliers or available_suppliers):
        if net_components_enabled or ic_source_enabled:
            return Response({"error": "No suppliers selected"}, status=400)

    # Union of all suppliers for inventory export / DB fetch
    all_suppliers = []
    for s in stock_suppliers + available_suppliers:
        if s not in all_suppliers:
            all_suppliers.append(s)

    # ---------- Prepare zip / email attachments ----------
    zip_buffer = io.BytesIO()
    zip_file = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)
    nc_attachments, ics_attachments = [], []

    # ---------- Columns per destination ----------
    NC_FIELDS   = ["mpn", "description", "manufacturer", "quantity", "url", "break_qty_a", "price_a"]
    NC_COLUMNS  = ["P/N", "DESCRIPTION", "MFG", "QTY", "Shopping Cart URL", "BreakQtyA", "PriceA"]

    ICS_FIELDS  = ["mpn", "description", "manufacturer", "quantity"]
    ICS_COLUMNS = ["P/N", "DESCRIPTION", "MFG", "QTY"]

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
        if file_format == "xlsx":
            df.to_excel(out, index=False, engine="xlsxwriter")
        else:
            df.to_csv(out, index=False, encoding="utf-8-sig")
        out.seek(0)

        zip_file.writestr(filename, out.getvalue())

        if recipient == "netcomponents":
            nc_attachments.append((filename, out.getvalue()))
        elif recipient == "icsource":
            ics_attachments.append((filename, out.getvalue()))

    # ---------- Fetch rows once for all suppliers (for NC/ICS) ----------
    rows_by_supplier = {}
    need_any_platform = (net_components_enabled or ic_source_enabled) and all_suppliers

    if need_any_platform:
        union_fields = sorted(set(NC_FIELDS) | set(ICS_FIELDS) | {"supplier"})

        print(f"Shared fetch start. Suppliers={len(all_suppliers)}")
        t0 = time.time()

        qs = (
            InventoryItem.objects
            .filter(supplier__in=all_suppliers)
            .order_by("supplier", "id")
            .values(*union_fields)
        )

        CHUNK_SIZE = 10000
        for row in qs.iterator(chunk_size=CHUNK_SIZE):
            s = row["supplier"]
            rows_by_supplier.setdefault(s, []).append(row)

        print(
            f"Shared fetch done in {time.time() - t0:.2f}s; "
            f"collected rows for {len(rows_by_supplier)} suppliers."
        )

    # ---------- Helper: build stock/available rows for a single platform ----------
    def build_platform_rows(stock_list, avail_list, stock_limit, avail_limit):
        """
        Fill stock rows first, overflow to available, then process available suppliers.
        """
        stock_rows = []
        avail_rows = []

        # Phase 1: STOCK suppliers
        for s in stock_list:
            supplier_rows = rows_by_supplier.get(s, [])
            for row in supplier_rows:
                if len(stock_rows) < stock_limit:
                    stock_rows.append(row)
                elif len(avail_rows) < avail_limit:
                    # overflow from stock → available
                    avail_rows.append(row)
                else:
                    return stock_rows, avail_rows

        # Phase 2: AVAILABLE suppliers
        for s in avail_list:
            supplier_rows = rows_by_supplier.get(s, [])
            for row in supplier_rows:
                if len(avail_rows) < avail_limit:
                    avail_rows.append(row)
                else:
                    return stock_rows, avail_rows

        return stock_rows, avail_rows

    # ---------- Build NC exports ----------
    if net_components_enabled:
        t1 = time.time()

        nc_stock_rows, nc_avail_rows = build_platform_rows(
            stock_suppliers,
            available_suppliers,
            max_nc_stock,
            max_nc_avail
        )

        write_rows(
            nc_stock_rows,
            f"netcomponents_stock.{file_format}",
            NC_FIELDS,
            NC_COLUMNS,
            "netcomponents",
        )
        write_rows(
            nc_avail_rows,
            f"netcomponents_available.{file_format}",
            NC_FIELDS,
            NC_COLUMNS,
            "netcomponents",
        )
        print(f"NC file creation time: {time.time() - t1:.2f}s")

    # ---------- Build ICS exports ----------
    if ic_source_enabled:
        t2 = time.time()

        ics_stock_rows, ics_avail_rows = build_platform_rows(
            stock_suppliers,
            available_suppliers,
            max_ics_stock,
            max_ics_avail,
        )

        write_rows(
            ics_stock_rows,
            f"icsource_stock.{file_format}",
            ICS_FIELDS,
            ICS_COLUMNS,
            "icsource",
        )
        write_rows(
            ics_avail_rows,
            f"icsource_available.{file_format}",
            ICS_FIELDS,
            ICS_COLUMNS,
            "icsource",
        )
        print(f"ICS file creation time: {time.time() - t2:.2f}s")

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
                (
                    fname,
                    io.BytesIO(content),
                    "text/csv"
                    if fname.endswith(".csv")
                    else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
                for (fname, content) in nc_attachments
            ],
        )

    if send_to_ics and ics_attachments:
        print("Sending IC Source email...")
        send_html_email(
            data={"email": settings.ICS_INVENTORY_UPDATE_EMAIL, "my_company": settings.COMPANY_NAME},
            template="icsupdate",
            from_account="inventory",
            attachments=[
                (
                    fname,
                    io.BytesIO(content),
                    "text/csv"
                    if fname.endswith(".csv")
                    else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
                for (fname, content) in ics_attachments
            ],
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