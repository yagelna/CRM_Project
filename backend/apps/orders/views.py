from django.shortcuts import render
from httpcore import Response
from rest_framework import viewsets, permissions, decorators, response, status
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Prefetch
from django.utils.dateparse import parse_date
from rest_framework.decorators import action

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer

class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing orders.
    Orders API with nested items read-only and items_payload write (upsert + implicit delete).
    Supports simple filtering, search, ordering.
    """

    queryset = (
        Order.objects
        .select_related('company', 'contact',"created_by", "updated_by")
        .prefetch_related(Prefetch('items', queryset=OrderItem.objects.order_by('id')))
    )

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["order_number", "customer_order_number", "company__name", "contact__name", "notes"]
    ordering_fields = ["created_at", "grand_total", "status", "payment_status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        status_val = params.get("status")
        pay_status = params.get("payment_status")
        company_id = params.get("company")
        contact_id = params.get("contact")
        created_from = params.get("created_from")
        created_to   = params.get("created_to")

        if status_val:
            qs = qs.filter(status=status_val)
        if pay_status:
            qs = qs.filter(payment_status=pay_status)
        if company_id:
            qs = qs.filter(company_id=company_id)
        if contact_id:
            qs = qs.filter(contact_id=contact_id)

        if created_from:
            d = parse_date(created_from)
            if d: qs = qs.filter(created_at__date__gte=d)
        if created_to:
            d = parse_date(created_to)
            if d: qs = qs.filter(created_at__date__lte=d)

        return qs

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        serializer.save(created_by=user if user and user.is_authenticated else None)

    def perform_update(self, serializer):
        user = getattr(self.request, "user", None)
        serializer.save(updated_by=user if user and user.is_authenticated else None)

    @decorators.action(detail=True, methods=["post"], url_path="recalc-totals", url_name="recalc_totals")
    def recalc_totals(self, request, pk=None):
        """Recalculate order totals."""
        order = self.get_object()
        order.recalc_totals(save=True)
        return response.Response({"detail": "Totals recalculated."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["delete"], url_path="bulk-delete")
    def bulk_delete(self, request, *args, **kwargs):
        """Bulk delete orders by IDs."""
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"error": "No Order IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
            return Response({"detail": "Invalid 'ids' parameter."}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = Order.objects.filter(id__in=ids).delete()
        return Response({"success": f"{deleted} orders deleted successfully"})

class OrderItemViewSet(viewsets.ModelViewSet):
    """
    Optional: direct CRUD for items (useful for admin tools).
    In regular UI, prefer writing via Order.items_payload.
    """

    queryset = OrderItem.objects.select_related('order').all()
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["mpn", "manufacturer", "description", "source", "notes"]
    ordering_fields = ["created_at", "unit_price", "line_subtotal", "status"]
    ordering = ["-created_at"]