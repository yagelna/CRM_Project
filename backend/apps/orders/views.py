from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import viewsets, permissions, decorators, response, status
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Prefetch
from django.utils.dateparse import parse_date
from rest_framework.decorators import action
from openai import OpenAI
import mimetypes, json, re, os
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer

MAX_PDF_BYTES = 5 * 1024 * 1024  # 5MB

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

    @action(detail=True, methods=["post"], url_path="recalc-totals", url_name="recalc_totals")
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
    
    @action(detail=False, methods=["post"], url_path="upload_po", parser_classes=[MultiPartParser, FormParser])
    def upload_po(self, request, *args, **kwargs):
        """
        Accepts a PDF PO file, extracts structured data via OpenAI, and returns {form, items}.
        """

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "Missing file"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate PDF + size
        mt = (file_obj.content_type or "").lower() or (mimetypes.guess_type(file_obj.name)[0] or "").lower()
        if mt != "application/pdf" or not file_obj.name.lower().endswith(".pdf"):
            return Response({"detail": "Only PDF files are supported."}, status=status.HTTP_400_BAD_REQUEST)
        if file_obj.size and file_obj.size > MAX_PDF_BYTES:
            return Response({"detail": f"PDF too large (>{MAX_PDF_BYTES//1024//1024}MB)."}, status=status.HTTP_400_BAD_REQUEST)
        
        OPENAI_KEY = settings.OPENAI_KEY

        client = OpenAI(api_key=OPENAI_KEY, timeout=60)

        uploaded_id = None
        try:
            # 1) Upload file to OpenAI
            up = client.files.create(
                file=(file_obj.name, file_obj, "application/pdf"),
                purpose="user_data"
            )
            uploaded_id = up.id

            # 2) Prompt + instructions
            user_instructions = (
                "You are an expert PO (purchase order) parser.\n"
                "Return ONLY a single JSON object, no extra text, no code fences.\n"
                "Fields:\n"
                "{\n"
                '  "form": {\n'
                '    "customer_order_number": string?,\n'
                '    "currency": "USD"|"EUR"|"ILS"?,\n'
                '    "shipping_address": string?\n'
                "  },\n"
                '  "items": [\n'
                "    {\n"
                '      "mpn": string,\n'
                '      "customer_part_number": string?,\n'
                '      "manufacturer": string?,\n'
                '      "description": string?,\n'
                '      "qty_ordered": integer>=1,\n'
                '      "unit_price": number>=0,\n'
                '      "date_code": string?,\n'
                '      "requested_date": "YYYY-MM-DD"?,\n'
                '      "status": "new"|"reserved"|"awaiting"|"picked"|"shipped"|"cancelled"|"returned"?\n'
                "    }\n"
                "  ]\n"
                "}\n"
            )

            
            # 3) Responses API call

            resp = client.responses.create(
                model="gpt-4o",
                input=[{
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": user_instructions},
                        {"type": "input_file", "file_id": uploaded_id}
                    ]
                }],
                temperature=0
            )

            # 4) Extract and parse response JSON
            def extract_text(r):
                try:
                    chunks = []
                    for msg in getattr(r, "output", []) or []:
                        for c in getattr(msg, "content", []) or []:
                            if getattr(c, "type", None) in ("output_text", "text"):
                                t = getattr(c, "text", None)
                                val = getattr(t, "value", t)
                                if isinstance(val, str) and val.strip():
                                    chunks.append(val)
                    if chunks:
                        return "\n".join(chunks)
                except Exception:
                    pass
                try:
                    ot = getattr(r, "output_text", "")
                    return ot if isinstance(ot, str) else ""
                except Exception:
                    return ""

            raw = extract_text(resp).strip()

            # strip ```json ... ```
            m = re.match(r"^```(?:json)?\s*(.*?)\s*```$", raw, flags=re.DOTALL|re.IGNORECASE)
            if m:
                raw = m.group(1).strip()

            try:
                data = json.loads(raw)
            except Exception:
                # Attempt to extract JSON object from text
                depth = 0; start = -1; in_str = False; esc = False; snippet = None
                for i, ch in enumerate(raw):
                    if in_str:
                        if esc: esc = False
                        elif ch == "\\": esc = True
                        elif ch == '"': in_str = False
                    else:
                        if ch == '"': in_str = True
                        elif ch == '{':
                            if depth == 0: start = i
                            depth += 1
                        elif ch == '}':
                            if depth > 0:
                                depth -= 1
                                if depth == 0 and start != -1:
                                    snippet = raw[start:i+1]; break
                data = json.loads(snippet) if snippet else None

            if not isinstance(data, dict):
                return Response({"detail": "Failed to parse OpenAI response as JSON."}, status=status.HTTP_502_BAD_GATEWAY)

            # 5) Normalize
            form_out = (data.get("form") or {})
            items_in = (data.get("items") or [])

            cur = (form_out.get("currency") or "").upper()
            if cur not in ("USD", "EUR", "ILS"):
                cur = None

            def cut_date(s):
                s = (s or "").strip()
                return s[:10] if len(s) >= 10 else s

            normalized_items = []
            for it in items_in:
                mpn = (it.get("mpn") or "").strip()
                qty = int(it.get("qty_ordered") or 0)
                price = float(it.get("unit_price") or 0)
                if not mpn or qty < 1 or price < 0:
                    continue
                normalized_items.append({
                    "mpn": mpn,
                    "customer_part_number": it.get("customer_part_number") or "",
                    "manufacturer": it.get("manufacturer") or "",
                    "description": it.get("description") or "",
                    "qty_ordered": qty,
                    "unit_price": price,
                    "date_code": it.get("date_code") or "",
                    "requested_date": cut_date(it.get("requested_date")),
                    "status": it.get("status", "new")
                })

            payload = {
                "form": {
                    **({"customer_order_number": form_out.get("customer_order_number")} if form_out.get("customer_order_number") else {}),
                    **({"currency": cur} if cur else {}),
                    **({"shipping_address": form_out.get("shipping_address")} if form_out.get("shipping_address") else {}),
                },
                "items": normalized_items
            }

            return Response(payload, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Upload/parse failed: {e}"}, status=status.HTTP_502_BAD_GATEWAY)

        finally:
            if uploaded_id:
                try: client.files.delete(uploaded_id)
                except Exception: pass

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