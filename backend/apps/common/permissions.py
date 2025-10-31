# apps/common/permissions.py
from apps.crm_accounts.models import CRMAccount
from rest_framework.permissions import DjangoModelPermissions, BasePermission

class StrictDjangoModelPermissions(DjangoModelPermissions):
    """
    implements DjangoModelPermissions but requires explicit permissions for each action.
    By default, DjangoModelPermissions allows read-only access without any permissions.
    """
    perms_map = {
        'GET':     ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': [],
        'HEAD':    [],
        'POST':    ['%(app_label)s.add_%(model_name)s'],
        'PUT':     ['%(app_label)s.change_%(model_name)s'],
        'PATCH':   ['%(app_label)s.change_%(model_name)s'],
        'DELETE':  ['%(app_label)s.delete_%(model_name)s'],
    }

class CanAccessInventory(BasePermission):
    """
    Permission class to check access to inventory-related views or actions 
    that are not direct CRUD on the model (FBV/custom Actions).
    approves access if the user has view on InventoryItem or is in 'Inventory' group or superuser.
    """
    message = "You don't have permission to access inventory."

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return (
            u.is_superuser
            or u.has_perm('inventory.view_inventoryitem')
            or u.groups.filter(name__iexact='Inventory').exists()
        )
    
class CanAccessCRM(BasePermission):
    """
    Permission class to check access to CRM-related views or actions 
    that are not direct CRUD on the model (FBV/custom Actions).
    approves access if the user has view on Customer or is in 'CRM' group or superuser.
    """
    message = "You don't have permission to access CRM."

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        app_label = CRMAccount._meta.app_label
        return (
            u.is_superuser
            or u.has_perm(f'{app_label}.access_crm')
            or u.groups.filter(name__iexact='crm_access').exists()
        )