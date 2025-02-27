# from celery import shared_task
# from utils.email_utils import send_html_email
# from apps.usersettings.models import UserSettings
# from apps.inventory.models import InventoryItem
# from django.db.models import Case, When
# import io
# import zipfile
# import pandas as pd
# from datetime import datetime

# @shared_task
# def send_test_email():
#     test_data = {
#         "email": "yagel@flychips.com",
#         "mpn": "TEST_PART",
#         "offered_price": "10",
#         "qty_offered": "5",
#     }
#     send_html_email(test_data, "quote-tab", from_account="default")

# @shared_task
# def scheduled_export_inventory():
#     users = UserSettings.objects.filter(export_netcomponents=True) | UserSettings.objects.filter(export_icsource=True)

#     for user_settings in users:
#         user = user_settings.user
#         export_file_format = user_settings.export_file_format
#         suppliers = user_settings.selected_suppliers

#         # Check what needs to be exported
#         send_to_nc = user_settings.export_netcomponents
#         send_to_ics = user_settings.export_icsource

#         # Limits for export
#         max_rows = {
#             "net_components_stock": user_settings.netcomponents_max_stock,
#             "net_components_available": user_settings.netcomponents_max_available,
#             "ic_source_stock": user_settings.icsource_max_stock,
#             "ic_source_available": user_settings.icsource_max_available,
#         }

#         # Create ZIP file buffer
#         zip_buffer = io.BytesIO()
#         zip_file = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)

#         nc_attachments = []
#         ics_attachments = []

#         def export_data(queryset, filename, fields, column_names, recipient):
#             df = pd.DataFrame.from_records(queryset.values(*fields))
#             df.columns = column_names
            
#             output_buffer = io.BytesIO()
#             if export_file_format == "xlsx":
#                 df.to_excel(output_buffer, index=False, engine='xlsxwriter')
#             else: # CSV
#                 df.to_csv(output_buffer, index=False, encoding='utf-8-sig')
            
#             output_buffer.seek(0)
#             zip_file.writestr(filename, output_buffer.getvalue())

#             if recipient == "netcomponents":
#                 nc_attachments.append((filename, output_buffer.getvalue()))
#             elif recipient == "icsource":
#                 ics_attachments.append((filename, output_buffer.getvalue()))

#         if send_to_nc:
#             fields = ["mpn", "description", "manufacturer", "quantity", "url"]
#             column_names = ["P/N", "DESCRIPTION", "MFG", "QTY", "Shopping Cart URL"]
   
#             stock_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[:max_rows["net_components_stock"]]
#             available_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[max_rows["net_components_stock"]:max_rows["net_components_stock"] + max_rows["net_components_available"]]

#             export_data(stock_data, f"netcomponents_stock.{export_file_format}", fields, column_names, "netcomponents")
#             export_data(available_data, f"netcomponents_available.{export_file_format}", fields, column_names, "netcomponents")

#         if send_to_ics:
#             fields = ["mpn", "description", "manufacturer", "quantity"]
#             column_names = ["P/N", "DESCRIPTION", "MFG", "QTY"]

#             stock_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[:max_rows["ic_source_stock"]]
#             available_data = InventoryItem.objects.filter(supplier__in=suppliers).order_by(*[Case(When(supplier=supplier, then=idx), default=999) for idx, supplier in enumerate(suppliers)])[max_rows["ic_source_stock"]:max_rows["ic_source_stock"] + max_rows["ic_source_available"]]

#             export_data(stock_data, f"icsource_stock.{export_file_format}", fields, column_names, "icsource")
#             export_data(available_data, f"icsource_available.{export_file_format}", fields, column_names, "icsource")

#         zip_file.close()
#         zip_buffer.seek(0)

#         if nc_attachments:
#             send_html_email(
#                 data={
#                     "email": "yagel@flychips.com", #datamaster@netcomponents.com
#                     "account": "939857",
#                 },
#                 template="nc-update",
#                 from_account="inventory",
#                 attachments=[
#                     (file_name, io.BytesIO(file_content), "text/csv" if file_name.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
#                     for file_name, file_content in nc_attachments
#                 ]
#             )
#         if send_to_ics and ics_attachments:
#             send_html_email(
#                 data={
#                     "email": "yagel@flychips.com", #post@icsource.com
#                 },
#                 template="ics-update",
#                 from_account="inventory",
#                 attachments = [
#                     (file_name, io.BytesIO(file_content), "text/csv" if file_name.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
#                     for file_name, file_content in ics_attachments
#                 ]
#             )

#         # Update last export date
#         user_settings.last_export_date = datetime.now()
#         user_settings.save()

#         print("Scheduled email sent successfully")
