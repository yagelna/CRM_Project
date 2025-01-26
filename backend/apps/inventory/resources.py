from import_export import resources, fields
from .models import InventoryItem

class NetComponentsResource(resources.ModelResource):
    mpn = fields.Field(attribute='mpn', column_name='P/N')
    description = fields.Field(attribute='description', column_name='DESCRIPTION')
    manufacturer = fields.Field(attribute='manufacturer', column_name='MFG')
    quantity = fields.Field(attribute='quantity', column_name='QTY')
    url = fields.Field(attribute='url', column_name='Shopping Cart URL')

    class Meta:
        model = InventoryItem
        fields = ('mpn', 'description', 'manufacturer', 'quantity', 'url')
        export_order = ('mpn', 'description', 'manufacturer', 'quantity', 'url')

class ICSourceResource(resources.ModelResource):
    mpn = fields.Field(attribute='mpn', column_name='P/N')
    description = fields.Field(attribute='description', column_name='DESCRIPTION')
    manufacturer = fields.Field(attribute='manufacturer', column_name='MFG')
    quantity = fields.Field(attribute='quantity', column_name='QTY')

    class Meta:
        model = InventoryItem
        fields = ('mpn', 'description', 'manufacturer', 'quantity')
        export_order = ('mpn', 'description', 'manufacturer', 'quantity')

class InventoryResource(resources.ModelResource):
    class Meta:
        model = InventoryItem
        