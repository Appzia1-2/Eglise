from datetime import date, timedelta
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    UpdateAPIView,
)
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsChurchAuthenticated,IsChurchUser, IsMemberUser
from accounts.utils import create_family_head_user
from registry.services import calculate_new_bill_amount, calculate_prorated_upgrade_amount, generate_folio_number, get_next_subscription_action, handle_member_death
from .models import Baptism, Bill, Church, DeathRegister, Designation, DheshaKuri, Diocese, Events, Grade, Marriage, Priest,  RegisterSetting, Relationship, TombFee, TombType, UpgradeRequest,  Ward, Family, Member, Package, Offering, VisitorMaster, Subscription, AccountGroupMaster, AccountLedgerMaster, PaymentMaster, QurbanaReceipts, CommitteeMaster,  LegacyBaptism, LegacyMarriage, LegacyDeath, ReceiptMaster, ReceiptLine,  LedgerEntry
from .serializers import BaptismSerializer, BillDetailSerializer, BillListSerializer,LedgerEntrySerializer, ChurchDetailSerializer,MemberDetailSerializer, ChurchListSerializer, DeathRegisterSerializer, DesignationSerializer, DheshaKuriSerializer, DioceseSerializer, EventSerializer, FamilyHeadCreateSerializer, FamilyHeadUpdateSerializer, FamilyMemberSerializer, GradeSerializer, InactiveMemberSerializer, MarriageCertificateSerializer, MarriageSerializer, MemberProfileSerializer, MobileFamilyBaptismSerializer, MobileFamilyDetailSerializer, MobileFamilyListSerializer, MobileFamilyMemberSerializer,  PriestNameSerializer,PriestSerializer, RegisterSettingSerializer, RelationshipSerializer, SubscriptionExpirySerializer, TombFeeSerializer, TombTypeSerializer, UpgradeSerializer,  WardSerializer, FamilySerializer, MemberSerializer,PackageSerializer, WardWithFamilyCountSerializer, OfferingSerializer, VisitorMasterSerializer, SubscriptionSerializer, AccountGroupMasterSerializer, AccountLedgerMasterSerializer, PaymentMasterSerializer, QurbanaReceiptsSerializer, CommitteeMasterSerializer, MemberDirectorySerializer, LegacyBaptismSerializer, LegacyMarriageSerializer, LegacyDeathSerializer, LegacyBaptismListSerializer, LegacyMarriageListSerializer, LegacyDeathListSerializer,ReceiptMasterSerializer, ReceiptMasterListSerializer, ReceiptCancelSerializer
from rest_framework.generics import ListAPIView
from .models import ChurchSubscription
from .serializers import SubscribeSerializer,UpgradeRequestSerializer
from rest_framework.views import APIView
from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.db.models import Count,Sum
from django.db.models import Q,F
from registry.services import generate_register_number
from rest_framework.exceptions import NotFound
from django.db import transaction, IntegrityError
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminUser
from registry.models import Diocese
from registry.serializers import (
    DioceseSerializer,
    DioceseListSerializer,
    DioceseCreateUpdateSerializer
)
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)

class DioceseListCreateAPIView(APIView):
    """
    API View to list all dioceses and create new diocese
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Get all active dioceses"""
        try:
            dioceses = Diocese.objects.filter(is_active=True).order_by('name')
            serializer = DioceseListSerializer(dioceses, many=True)
            return Response({
                "status": "success",
                "count": dioceses.count(),
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching dioceses: {str(e)}")
            return Response({
                "status": "error",
                "message": "Failed to fetch dioceses"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Create a new diocese"""
        try:
            serializer = DioceseCreateUpdateSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response({
                    "status": "error",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Save the diocese
            diocese = serializer.save()
            
            # Return the created diocese details
            detail_serializer = DioceseSerializer(diocese)
            return Response({
                "status": "success",
                "message": "Diocese created successfully",
                "data": detail_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating diocese: {str(e)}")
            return Response({
                "status": "error",
                "message": "Failed to create diocese"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DioceseDetailAPIView(APIView):
    """
    API View to get, update, and delete a specific diocese
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        """Get a specific diocese by ID"""
        try:
            diocese = get_object_or_404(Diocese, pk=pk)
            serializer = DioceseSerializer(diocese)
            return Response({
                "status": "success",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching diocese {pk}: {str(e)}")
            return Response({
                "status": "error",
                "message": "Diocese not found or error occurred"
            }, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        """Update a specific diocese"""
        try:
            diocese = get_object_or_404(Diocese, pk=pk)
            serializer = DioceseCreateUpdateSerializer(diocese, data=request.data, partial=False)
            
            if not serializer.is_valid():
                return Response({
                    "status": "error",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the diocese
            updated_diocese = serializer.save()
            detail_serializer = DioceseSerializer(updated_diocese)
            
            return Response({
                "status": "success",
                "message": "Diocese updated successfully",
                "data": detail_serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating diocese {pk}: {str(e)}")
            return Response({
                "status": "error",
                "message": "Failed to update diocese"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, pk):
        """Partially update a specific diocese"""
        try:
            diocese = get_object_or_404(Diocese, pk=pk)
            serializer = DioceseCreateUpdateSerializer(diocese, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return Response({
                    "status": "error",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the diocese
            updated_diocese = serializer.save()
            detail_serializer = DioceseSerializer(updated_diocese)
            
            return Response({
                "status": "success",
                "message": "Diocese updated successfully",
                "data": detail_serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error partially updating diocese {pk}: {str(e)}")
            return Response({
                "status": "error",
                "message": "Failed to update diocese"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        """Soft delete a specific diocese (set is_active=False)"""
        try:
            diocese = get_object_or_404(Diocese, pk=pk)
            
            # Check if diocese has churches
            church_count = diocese.churches.filter(is_deleted=False).count()
            if church_count > 0:
                return Response({
                    "status": "error",
                    "message": f"Cannot deactivate diocese because it has {church_count} active churches. Please reassign or deactivate churches first."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            diocese.is_active = False
            diocese.save()
            
            return Response({
                "status": "success",
                "message": f"Diocese '{diocese.name}' deactivated successfully"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error deleting diocese {pk}: {str(e)}")
            return Response({
                "status": "error",
                "message": "Failed to deactivate diocese"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class ChurchContextMixin:

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    def get_queryset(self):
        if not hasattr(self.model, "church"):
            raise Exception(
                f"{self.model.__name__} must have a church field."
            )

        return self.model.objects.filter(
            church=self.request.user.church
        )


class ChurchList(ListAPIView):
    permission_classes=[IsAuthenticated]
    serializer_class = ChurchListSerializer
    queryset = Church.objects.all().order_by("-created_at")

class MyChurchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        church = request.user.church
        serializer = ChurchDetailSerializer(church)
        return Response(serializer.data)



class WardListCreateAPIView(ChurchContextMixin,ListCreateAPIView):
    model = Ward
    serializer_class = WardSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]


class WardDetailAPIView(ChurchContextMixin,RetrieveUpdateDestroyAPIView):
    model = Ward
    serializer_class = WardSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

class FamilyListCreateAPIView(ChurchContextMixin,ListCreateAPIView):
    model = Family
    serializer_class = FamilySerializer
    permission_classes = [IsAuthenticated, IsChurchUser]
    
class RelationshipListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = RelationshipSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = getattr(self.request.user, "church", None)

        if not church:
            return Relationship.objects.none()

        return Relationship.objects.filter(
            church=church
        ).order_by("name")

    def perform_create(self, serializer):
        church = getattr(self.request.user, "church", None)

        if not church:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {"detail": "Your user is not associated with a church."}
            )

        serializer.save(church=church)


class RelationshipDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = RelationshipSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = getattr(self.request.user, "church", None)

        if not church:
            return Relationship.objects.none()

        return Relationship.objects.filter(
            church=church
        )

    

class GradeListCreateview(ChurchContextMixin,ListCreateAPIView):
    model=Grade
    serializer_class=GradeSerializer
    permission_classes=[IsAuthenticated,IsChurchUser]

class GradeDetailview(ChurchContextMixin,RetrieveUpdateDestroyAPIView):
    model=Grade
    serializer_class=GradeSerializer
    permission_classes=[IsAuthenticated,IsChurchUser]




class FamilyDetailAPIView(
    ChurchContextMixin,
    RetrieveUpdateDestroyAPIView
):
    model = Family
    serializer_class = FamilySerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def destroy(self, request, *args, **kwargs):
        family = self.get_object()

        members = family.members.filter(is_active=True)

        # ❌ More than one member → block delete
        if members.count() > 1:
            return Response(
                {
                    "detail": (
                        "Family cannot be deleted because "
                        "it has more than one active member."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ❌ Single member but not head → block delete
        if members.exists() and not members.first().is_family_head:
            return Response(
                {
                    "detail": (
                        "Family cannot be deleted because "
                        "the remaining member is not the family head."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Safe to delete
        return super().destroy(request, *args, **kwargs)

# registry/views.py - Update FamilyHeadCreateAPIView

from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction


class FamilyHeadCreateAPIView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsChurchUser,
    ]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        church = request.user.church

        # -----------------------------------------------------
        # LOCK the subscription row so two parallel creates
        # cannot both pass the capacity check.
        # -----------------------------------------------------
        from .models import ChurchSubscription

        ChurchSubscription.objects.select_for_update().filter(
            church=church
        ).first()

        # -----------------------------------------------------
        # SUBSCRIPTION CAPACITY CHECK
        # -----------------------------------------------------
        from .services import can_add_member

        allowed, message, info = can_add_member(church)
        if not allowed:
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = FamilyHeadCreateSerializer(
            data=request.data,
            context={
                "church": church,
                "request": request,
            },
        )

        serializer.is_valid(raise_exception=True)
        head = serializer.save()

        return Response(
            {
                "message": "Family head created successfully.",
                "member_id": head.id,
                "family_id": head.family_id,
                "register_number": head.register_number,
                "folio_number": head.folio_number,
                "capacity": info,
            },
            status=status.HTTP_201_CREATED,
        )


class MemberListCreateAPIView(ChurchContextMixin, ListCreateAPIView):
    model = Member
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)




class MemberDetailAPIView(
    ChurchContextMixin,
    RetrieveUpdateDestroyAPIView
):
    model = Member
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    def perform_update(self, serializer):
        instance = self.get_object()
        validated_data = serializer.validated_data

        # 🔥 Prevent promoting to head here
        if (
            "is_family_head" in validated_data
            and validated_data["is_family_head"] is True
            and not instance.is_family_head
        ):
            raise ValidationError(
                "Use family head API to promote a member to head."
            )

        # 🔥 If member is NOT head → block ward & image
        if not instance.is_family_head:
            if "ward" in validated_data:
                raise ValidationError({
                    "ward": "Only family head can have ward."
                })

            if "family_image" in validated_data:
                raise ValidationError({
                    "family_image": "Only family head can have family image."
                })

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        member = self.get_object()

        # 🔥 Prevent deleting head if dependents exist in SAME HOUSE
        if member.is_family_head:
            other_members = Member.objects.filter(
                family=member.family,
                house_name=member.house_name,
                house_sequence=member.house_sequence,  # 🔥 FIX: Include house_sequence
                is_active=True
            ).exclude(pk=member.pk)

            if other_members.exists():
                return Response(
                    {
                        "detail": (
                            f"Cannot delete family head while "
                            f"{other_members.count()} dependents exist in this house."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().destroy(request, *args, **kwargs)


# registry/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Package, ChurchSubscription, Bill
from .serializers import SubscribeSerializer, PackageSerializer

class PackageListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated, IsChurchAuthenticated]
    queryset = Package.objects.filter(is_active=True)
    serializer_class = PackageSerializer

class SubscribeAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchAuthenticated]

    @transaction.atomic
    def post(self, request):
        church = request.user.church

        if hasattr(church, "churchsubscription"):
            return Response(
                {"detail": "Subscription already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SubscribeSerializer(
            data=request.data,
            context={"church": church}
        )
        serializer.is_valid(raise_exception=True)

        package = serializer.validated_data["package"]
        billing_cycle = serializer.validated_data.get("billing_cycle")
        capacity = serializer.validated_data.get("capacity")

        duration_months = 12 if billing_cycle == "YEARLY" else 1
        
        if capacity:
            resolved_capacity = capacity
        else:
            resolved_capacity = package.member_limit

        subscription = ChurchSubscription.objects.create(
            church=church,
            package=package,
            billing_cycle=billing_cycle,
            duration_months=duration_months,
            custom_capacity=capacity if capacity else None,
            payment_status="UNPAID",
            is_active=False,
        )

        # ✅ FIXED: Use subscription.get_total_price()
        # Does NOT multiply by duration_months
        amount = subscription.get_total_price()

        bill = Bill.objects.create(
            church=church,
            subscription=subscription,
            bill_type="NEW",
            billing_cycle=billing_cycle,
            duration_months=duration_months,
            amount=amount,
            breakdown={
                "items": [{
                    "type": "NEW",
                    # ✅ FIXED: Shows correct calculation
                    "calculation": (
                        f"{resolved_capacity} × {subscription.get_rate()}"
                    ),
                    "total": float(amount),
                }],
                "grand_total": float(amount),
                "credit_generated": 0,
                "apply": {
                    "package_id": package.id,
                    "billing_cycle": billing_cycle,
                    "duration_months": duration_months,
                    "custom_capacity": capacity,
                }
            }
        )

        return Response(
            {
                "detail": "Subscription created. Awaiting payment.",
                "bill_id": bill.id,
                "amount": bill.amount,
            },
            status=status.HTTP_201_CREATED
        )

class UpgradeAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    @transaction.atomic
    def post(self, request):
        church = request.user.church
        subscription = getattr(church, "churchsubscription", None)

        # -------------------------------------------------
        # BASIC GUARDS
        # -------------------------------------------------
        if not subscription or not subscription.is_active:
            return Response(
                {"detail": "No active subscription"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Bill.objects.filter(
            subscription=subscription,
            status="UNPAID"
        ).exists():
            return Response(
                {"detail": "Please clear pending bill first"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # INPUT
        # -------------------------------------------------
        package_id = request.data.get("package_id")
        billing_cycle = request.data.get("billing_cycle")
        capacity = request.data.get("capacity")

        if not package_id or not billing_cycle:
            return Response(
                {"detail": "package_id and billing_cycle are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        target_package = get_object_or_404(Package, id=package_id, is_active=True)

        # -------------------------------------------------
        # CAPACITY VALIDATION
        # -------------------------------------------------
        if capacity:
            capacity = int(capacity)
            if target_package.member_limit and capacity > target_package.member_limit:
                return Response(
                    {"detail": f"Capacity exceeds package limit of {target_package.member_limit}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            capacity = target_package.member_limit

        # -------------------------------------------------
        # CALCULATE UPGRADE WITH PRO-RATA
        # -------------------------------------------------
        result = calculate_prorated_upgrade_amount(
            subscription=subscription,
            target_package=target_package,
            target_billing_cycle=billing_cycle,
            target_capacity=capacity,
        )

        if result["amount"] <= 0:
            return Response(
                {"detail": "No payable upgrade amount"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # CREATE BILL
        # -------------------------------------------------
        bill = Bill.objects.create(
            church=church,
            subscription=subscription,
            bill_type="UPGRADE",
            billing_cycle=billing_cycle,
            duration_months=subscription.duration_months,
            amount=result["amount"],
            breakdown={
                "items": [result["breakdown"]],
                "grand_total": float(result["amount"]),
                "credit_generated": float(result["credit"]),
                "apply": {
                    "package_id": target_package.id,
                    "billing_cycle": billing_cycle,
                    "duration_months": subscription.duration_months,
                    "custom_capacity": capacity,
                },
            }
        )

        return Response(
            {
                "detail": "Upgrade bill generated",
                "bill_id": bill.id,
                "amount": bill.amount,
                "payment_status": bill.status,
            },
            status=status.HTTP_201_CREATED
        )
    
class ChurchDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchAuthenticated]

    def get(self, request):
        try:
            church = request.user.church

            if not church:
                return Response(
                    {
                        "detail": "No church is associated with this account."
                    },
                    status=400
                )

            # =========================================================
            # CHURCH LOGO
            # =========================================================

            logo_url = None

            if church.logo:
                try:
                    logo_url = request.build_absolute_uri(
                        church.logo.url
                    )
                except Exception:
                    logo_url = None

            # =========================================================
            # CHURCH DATA
            # =========================================================

            church_data = {
                "id": church.id,
                "name": church.name,
                "code": getattr(church, "code", None),

                "city": getattr(church, "city", None),

                "diocese": (
                    church.diocese.name
                    if getattr(church, "diocese", None)
                    else None
                ),

                "email": getattr(church, "email", None),

                "phone": getattr(
                    church,
                    "phone_number",
                    None
                ),

                "phone_number": getattr(
                    church,
                    "phone_number",
                    None
                ),

                "is_active": getattr(
                    church,
                    "is_active",
                    True
                ),

                # IMPORTANT
                "logo": logo_url,
                "logo_url": logo_url,

                "created_at": getattr(
                    church,
                    "created_at",
                    None
                ),

                # Optional fields
                "established_year": getattr(
                    church,
                    "established_year",
                    None
                ),

                "registration_number": getattr(
                    church,
                    "registration_number",
                    None
                ),

                "financial_year": getattr(
                    church,
                    "financial_year",
                    None
                ),

                "currency": getattr(
                    church,
                    "currency",
                    None
                ),

                "timezone": getattr(
                    church,
                    "timezone",
                    None
                ),

                "address": getattr(
                    church,
                    "address",
                    None
                ),

                "full_address": getattr(
                    church,
                    "full_address",
                    None
                ),
            }

            # =========================================================
            # SUBSCRIPTION
            # =========================================================

            subscription = getattr(
                church,
                "subscription",
                None
            )

            if subscription:

                package = subscription.package

                subscription_data = {
                    "package": package.name
                    if package else None,

                    "package_name": package.name
                    if package else None,

                    "package_code": package.code
                    if package else None,

                    "member_limit": (
                        package.member_limit
                        if package else 0
                    ),

                    "billing_cycle": (
                        subscription.get_billing_cycle_display()
                    ),

                    "start_date": subscription.start_date,

                    "end_date": subscription.end_date,

                    "renewal_date": subscription.end_date,

                    "payment_status": (
                        subscription.payment_status
                    ),

                    "is_active": (
                        subscription.is_active
                    ),

                    "capacity": (
                        subscription.get_capacity()
                    ),

                    "allowed_limit": (
                        subscription.get_capacity()
                    ),

                    "days_remaining": (
                        subscription.get_remaining_days()
                    ),
                }

                allowed_limit = (
                    subscription.get_capacity()
                )

            else:

                subscription_data = None
                allowed_limit = None

            # =========================================================
            # MEMBER COUNT
            # =========================================================

            # Active family heads
            current_count = church.members.filter(
                is_active=True,
                expired=False,
                is_family_head=True
            ).count()

            # All active individuals
            total_individuals = church.members.filter(
                is_active=True,
                expired=False
            ).count()

            # =========================================================
            # MEMBER DATA
            # =========================================================

            members_data = {
                "current_count": current_count,

                "active_count": current_count,

                "total_individuals": total_individuals,

                "total_families": current_count,

                "allowed_limit": allowed_limit,

                "remaining": (
                    allowed_limit - current_count
                    if allowed_limit is not None
                    else None
                ),
            }

            # =========================================================
            # UPGRADE REQUIRED
            # =========================================================

            upgrade_required = bool(
                subscription
                and allowed_limit is not None
                and current_count > allowed_limit
            )

            # =========================================================
            # RESPONSE
            # =========================================================

            response_data = {
                "church": church_data,
                "subscription": subscription_data,
                "members": members_data,
                "upgrade_required": upgrade_required,
            }

            return Response(response_data)

        except Exception as e:

            import traceback
            traceback.print_exc()

            return Response(
                {
                    "detail": "Unable to load church dashboard.",
                    "error": str(e)
                },
                status=500
            )

#member
class MemberProfileAPIView(APIView):
    permission_classes = [IsAuthenticated, IsMemberUser]

    def get(self, request):
        member = request.user.member
        serializer = MemberProfileSerializer(member)
        return Response(serializer.data)
    
#Bill
class ChurchBillListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church

        bills = (
            Bill.objects
            .filter(church=church)
            .select_related("subscription", "subscription__package")
            .order_by("-created_at")
        )

        # Optional filter
        bill_status = request.query_params.get("status")
        if bill_status in ["PAID", "UNPAID"]:
            bills = bills.filter(status=bill_status)

        serializer = BillListSerializer(bills, many=True)

        return Response(
            {
                "count": bills.count(),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK
        )
    
class ChurchBillDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request, pk):
        church = request.user.church

        bill = get_object_or_404(
            Bill.objects.select_related(
                "church",
                "subscription",
                "subscription__package",
            ),
            pk=pk,
            church=church,  # 🔒 critical security check
        )

        serializer = BillDetailSerializer(bill)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
    
#expire
class SubscriptionExpiryAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church
        subscription = getattr(church, "churchsubscription", None)

        if not subscription or not subscription.end_date:
            return Response(
                {"detail": "No active subscription"},
                status=status.HTTP_404_NOT_FOUND
            )

        today = date.today()
        days_remaining = (subscription.end_date - today).days

        if days_remaining < 0:
            expiry_status = "EXPIRED"
        elif days_remaining <= 7:
            expiry_status = "EXPIRING_SOON"
        else:
            expiry_status = "ACTIVE"

        data = {
            "package": subscription.package.name,
            "billing_cycle": subscription.billing_cycle,
            "start_date": subscription.start_date,
            "end_date": subscription.end_date,
            "days_remaining": max(days_remaining, 0),
            "status": expiry_status,
        }

        serializer = SubscriptionExpirySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)



class UpgradeRequestAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request):
        church = request.user.church
        subscription = getattr(church, "churchsubscription", None)

        if not subscription or not subscription.is_active:
            return Response(
                {"detail": "No active subscription"},
                status=400
            )

        serializer = UpgradeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        UpgradeRequest.objects.create(
            church=church,
            current_package=subscription.package,
            requested_package=serializer.validated_data["requested_package"],
            requested_capacity=serializer.validated_data.get("requested_capacity"),
            reason=serializer.validated_data.get("reason", ""),
        )

        return Response(
            {"detail": "Upgrade request sent to admin"},
            status=201
        )


#change family head
class ChangeFamilyHeadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    @transaction.atomic
    def post(self, request):
        family_id = request.data.get("family_id")
        new_head_id = request.data.get("member_id")

        if not family_id or not new_head_id:
            return Response(
                {"detail": "family_id and member_id are required"},
                status=400
            )

        church = request.user.church

        family = get_object_or_404(
            Family,
            id=family_id,
            church=church
        )

        new_head = get_object_or_404(
            Member,
            id=new_head_id,
            family=family,
            church=church,
            expired=False,
            is_active=True
        )

        # Remove existing head
        family.members.filter(
            is_family_head=True
        ).update(is_family_head=False)

        # Set new head
        new_head.is_family_head = True
        new_head.save(update_fields=["is_family_head"])

        return Response(
            {"detail": "Family head updated successfully"},
            status=200
        )   
#baptism
class BaptismAPIView(APIView):
    permission_classes = [IsChurchUser]

    def get(self, request):
        """
        List baptisms with optional category filter
        ?category=PARISH | OTHER
        """
        category = request.query_params.get("category")

        baptisms = Baptism.objects.filter(
            church=request.user.church
        )

        if category:
            category = category.upper()
            if category not in ["PARISH", "OTHER"]:
                return Response(
                    {"detail": "Invalid category. Use PARISH or OTHER."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            baptisms = baptisms.filter(baptism_category=category)

        baptisms = baptisms.select_related(
            "family",
            "main_member",
            "relation_with_main_member",
            "member"
        ).order_by("-created_at")

        serializer = BaptismSerializer(baptisms, many=True)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )



    def post(self, request):
        data = request.data.copy()
        data["church"] = request.user.church.id

        serializer = BaptismSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            baptism = serializer.save(
            church=request.user.church
             )

            member=None
            # AUTO CREATE MEMBER ONLY FOR PARISH
            if (
                baptism.baptism_category == "PARISH"
                and baptism.member is None
            ):
                main_member = baptism.main_member

                # 🔥 STRICT VALIDATION
                if not main_member.is_family_head:
                    raise ValidationError(
                    "Main member must be a family head."
                    )

                if main_member.family != baptism.family:
                    raise ValidationError(
                        "Main member does not belong to selected family."
                )

                member = Member.objects.create(
                    church=baptism.church,
                    family=baptism.family,
                    house_name=main_member.house_name,  # ✅ CRITICAL
                    ward=main_member.ward,              # ✅ CRITICAL
                    name=baptism.name,
                    baptismal_name=baptism.baptismal_name,
                    gender=baptism.gender,
                    dob=baptism.dob,
                    address=baptism.address,
                    relationship=baptism.relation_with_main_member,
                    father_name=baptism.father_name,
                    mother_name=baptism.mother_name,
                    date_of_baptism=baptism.date_of_baptism,
                    parish_of_baptism=baptism.parish_of_baptism,
                    is_family_head=False,
                    is_active=True
                )

            if member:
                baptism.member = member
                baptism.save(update_fields=["member"])

        return Response(
            BaptismSerializer(baptism).data,
            status=status.HTTP_201_CREATED
        )




class BaptismDetailAPIView(APIView):
    permission_classes = [IsChurchUser]

    def get_object(self, request, pk):
        return get_object_or_404(
            Baptism.objects.select_related(
                "church",
                "family",
                "main_member",
                "relation_with_main_member",
                "member",
            ),
            pk=pk,
            church=request.user.church,
        )

    # ==========================================================
    # GET
    # ==========================================================

    def get(self, request, pk):
        baptism = self.get_object(request, pk)

        serializer = BaptismSerializer(
            baptism,
            context={"request": request}
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # ==========================================================
    # PUT
    # ==========================================================

    def put(self, request, pk):
        baptism = self.get_object(request, pk)

        serializer = BaptismSerializer(
            baptism,
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # ==========================================================
    # PATCH
    # ==========================================================

    def patch(self, request, pk):
        baptism = self.get_object(request, pk)

        serializer = BaptismSerializer(
            baptism,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # ==========================================================
    # DELETE
    # ==========================================================

    def delete(self, request, pk):
        baptism = self.get_object(request, pk)

        if baptism.member:
            return Response(
                {
                    "detail": (
                        "This baptism record cannot be deleted "
                        "because a member has already been created "
                        "from this baptism."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        baptism.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class BaptismCertificateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        # 🔒 Ensure logged-in user is a family head
        member = getattr(request.user, "member", None)

        if not member or not member.is_family_head:
            return Response(
                {"detail": "Only family head can access certificates."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 🔒 Fetch baptism only inside same family + house
        baptism = get_object_or_404(
            Baptism.objects.select_related(
                "church",
                "family",
                "main_member",
                "relation_with_main_member",
                "member",
            ),
            pk=pk,
            baptism_category="PARISH",
            family=member.family,
            member__house_name=member.house_name,
            member__is_active=True,
            member__expired=False,
        )

        baptism_member = baptism.member
        main_member = baptism.main_member

        data = {
            "certificate_type": "PARISH",

            # -------------------------
            # CHURCH INFO
            # -------------------------
            "church": {
                "name": baptism.church.name,
                "address": baptism.church.address,
                "city": baptism.church.city,
                "email": baptism.church.email,
                "phone": baptism.church.phone_number,
            },

            # -------------------------
            # BAPTISM DETAILS
            # -------------------------
            "register_number": baptism.register_number,
            "date_of_baptism": baptism.date_of_baptism,
            "parish_of_baptism": baptism.parish_of_baptism,
            "panchayath": baptism.panchayath,
            "priest_name": baptism.priest_name,

            # -------------------------
            # PERSON DETAILS
            # -------------------------
            "name": baptism.name,
            "baptismal_name": baptism.baptismal_name,
            "gender": baptism.gender,
            "date_of_birth": baptism.dob,
            "place_of_birth": baptism.place_of_birth,
            "address": baptism.address,

            # -------------------------
            # PARENTS
            # -------------------------
            "father_name": baptism.father_name,
            "mother_name": baptism.mother_name,

            # -------------------------
            # GODPARENTS
            # -------------------------
            "god_father": baptism.god_father,
            "god_mother": baptism.god_mother,

            # -------------------------
            # PARISH DETAILS
            # -------------------------
            "parish_member_details": {
                "family_name": member.family.family_name,
                "house_name": member.house_name,
                "main_member_name": (
                    main_member.name if main_member else None
                ),
                "relationship": (
                    baptism.relation_with_main_member.name
                    if baptism.relation_with_main_member
                    else None
                ),
                "member_id": (
                    str(baptism_member.id) if baptism_member else None
                ),
            },
        }

        return Response(data, status=status.HTTP_200_OK)
#baptims certificate for church
class ChurchBaptismCertificateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request, pk):

        baptism = get_object_or_404(
            Baptism.objects.select_related(
                "church",
                "family",
                "main_member",
                "relation_with_main_member",
                "member",
            ),
            pk=pk,
            church=request.user.church
        )

        baptism_member = baptism.member
        main_member = baptism.main_member

        data = {
            "certificate_type": baptism.baptism_category,

            # -------------------------
            # CHURCH INFO
            # -------------------------
            "church": {
                "name": baptism.church.name,
                "address": baptism.church.address,
                "city": baptism.church.city,
                "email": baptism.church.email,
                "phone": baptism.church.phone_number,
            },

            # -------------------------
            # BAPTISM DETAILS
            # -------------------------
            "register_number": baptism.register_number,
            "date_of_baptism": baptism.date_of_baptism,
            "parish_of_baptism": baptism.parish_of_baptism,
            "panchayath": baptism.panchayath,
            "priest_name": baptism.priest_name,

            # -------------------------
            # PERSON DETAILS
            # -------------------------
            "name": baptism.name,
            "baptismal_name": baptism.baptismal_name,
            "gender": baptism.gender,
            "date_of_birth": baptism.dob,
            "place_of_birth": baptism.place_of_birth,
            "address": baptism.address,

            # -------------------------
            # PARENTS
            # -------------------------
            "father_name": baptism.father_name,
            "mother_name": baptism.mother_name,

            # -------------------------
            # GODPARENTS
            # -------------------------
            "god_father": baptism.god_father,
            "god_mother": baptism.god_mother,

            # -------------------------
            # PARISH DETAILS
            # -------------------------
            "parish_member_details": {
                "family_name": (
                    baptism.family.family_name if baptism.family else None
                ),
                "house_name": (
                    baptism_member.house_name if baptism_member else None
                ),
                "main_member_name": (
                    main_member.name if main_member else None
                ),
                "relationship": (
                    baptism.relation_with_main_member.name
                    if baptism.relation_with_main_member else None
                ),
                "member_id": (
                    str(baptism_member.id) if baptism_member else None
                ),
            },
        }

        return Response(data, status=status.HTTP_200_OK)



class FamilyMembersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, family_id, house_name):
        family = get_object_or_404(
            Family,
            id=family_id,
            church=request.user.church
        )

        # 🔥 Option 1: Show ONLY the family head
        members = Member.objects.filter(
            family=family,
            house_name=house_name,
            is_active=True,
            expired=False,
            is_family_head=True  # 🔥 Only heads
        ).order_by("name")

        # 🔥 Option 2: Show head first, then dependents (if you want both)
        # members = Member.objects.filter(
        #     family=family,
        #     house_name=house_name,
        #     is_active=True,
        #     expired=False
        # ).order_by("-is_family_head", "name")

        serializer = FamilyMemberSerializer(
            members,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)



#mobile directory apis
class WardListWithFamilyCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wards = Ward.objects.filter(
            church=request.user.church
        ).annotate(
            family_count=Count(
                "members",
                filter=Q(
                    members__is_family_head=True,
                    members__is_active=True,
                    members__expired=False
                )
            )
        ).order_by("ward_name")

        serializer = WardWithFamilyCountSerializer(wards, many=True)
        return Response(serializer.data)

    
class WardFamiliesMobileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ward_id):
        ward = get_object_or_404(
            Ward,
            id=ward_id,
            church=request.user.church
        )

        heads = (
            Member.objects
            .filter(
                ward=ward,
                is_family_head=True,
                is_active=True,
                expired=False
            )
            .annotate(
                member_count=Count(
                    "family__members",
                    filter=Q(
                        family__members__house_name=F("house_name"),
                        family__members__is_active=True,
                        family__members__expired=False
                    )
                )
            )
            .order_by("family__family_name")
        )

        serializer = MobileFamilyListSerializer(
            heads,
            many=True,
            context={"request": request}
        )

        return Response({
            "total_families": heads.count(),
            "total_members": sum([h.member_count for h in heads]),
            "families": serializer.data
        })

    
class FamilyDetailMobileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, family_id, house_name):
        family = get_object_or_404(
            Family,
            id=family_id,
            church=request.user.church
        )

        members = Member.objects.filter(
            family=family,
            house_name=house_name,
            is_active=True,
            expired=False
        ).order_by("-is_family_head", "name")

        head = members.filter(is_family_head=True).first()

        return Response({
            "family_name": family.family_name,
            "house_name": house_name,
            "member_count": members.count(),
            "family_image": (
                request.build_absolute_uri(head.family_image.url)
                if head and head.family_image else None
            ),
            "members": MobileFamilyMemberSerializer(
                members,
                many=True
            ).data
        })



class FamilyBaptismsMobileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # 🔒 Must be family head
        if request.user.role != "USER":
            return Response(
                {"detail": "Only family members allowed."},
                status=403
            )

        member = request.user.member

        if not member or not member.is_family_head:
            return Response(
                {"detail": "Only family head can access this."},
                status=403
            )

        family = member.family
        house_name = member.house_name

        baptisms = (
            Baptism.objects
            .select_related("member")
            .filter(
                family=family,
                baptism_category="PARISH",
                member__house_name=house_name,
                member__is_active=True,
                member__expired=False
            )
            .order_by("-date_of_baptism")
        )

        serializer = MobileFamilyBaptismSerializer(
            baptisms,
            many=True
        )

        return Response({
            "family_name": family.family_name,
            "house_name": house_name,
            "baptism_count": baptisms.count(),
            "baptisms": serializer.data
        })

#pre announcement
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Marriage, DheshaKuri, Member
from .serializers import (
    MarriageSerializer,
    MarriageCertificateSerializer,
    DheshaKuriSerializer,
    InactiveMemberSerializer,
)
from .permissions import IsChurchUser


# ============================================================
# MARRIAGE VIEWS
# ============================================================

class MarriageListCreateAPIView(ListCreateAPIView):
    """
    List all marriages or create a new marriage.
    Create handles both ADD_BRIDE and TRANSFER_BRIDE types.
    """
    serializer_class = MarriageSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = self.request.user.church
        return Marriage.objects.filter(
            church=church
        ).select_related(
            "groom_member",
            "bride_member",
            
        ).order_by("-date")

    def perform_create(self, serializer):
        church = self.request.user.church
        serializer.save(church=church)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context


class MarriageDetailAPIView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a marriage.
    """
    serializer_class = MarriageSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = self.request.user.church
        return Marriage.objects.filter(church=church)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    def perform_destroy(self, instance):
        """Check if marriage has DheshaKuri before deleting."""
        if hasattr(instance, 'dhesha_kuri'):
            raise serializers.ValidationError(
                "Cannot delete. Transfer certificate (Dhesha Kuri) already created."
            )
        instance.delete()


# ============================================================
# CERTIFICATE VIEWS
# ============================================================

class MarriageCertificateAPIView(APIView):
    """Get marriage certificate for church users."""
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request, pk):
        marriage = get_object_or_404(
            Marriage,
            pk=pk,
            church=request.user.church
        )
        serializer = MarriageCertificateSerializer(marriage)
        return Response(serializer.data)


class DheshaKuriAPIView(APIView):
    """Get Dhesha Kuri (transfer certificate)."""
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request, pk):
        dhesha = get_object_or_404(
            DheshaKuri.objects.select_related("church", "marriage"),
            marriage__id=pk,
            church=request.user.church
        )
        serializer = DheshaKuriSerializer(dhesha)
        return Response(serializer.data)


# ============================================================
# MOBILE VIEWS
# ============================================================

class FamilyMarriagesMobileAPIView(APIView):
    """List ADD_BRIDE marriages for a family head."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = getattr(request.user, "member", None)

        if not member or not member.is_family_head:
            return Response(
                {"detail": "Only family head can access this."},
                status=status.HTTP_403_FORBIDDEN
            )

        marriages = (
            Marriage.objects
            .select_related("groom_member", "bride_member")
            .filter(
                church=member.church,
                family=member.family,
                marriage_type="ADD_BRIDE"
            )
            .filter(
                Q(bride_member__house_name=member.house_name) |
                Q(groom_member__house_name=member.house_name)
            )
            .order_by("-date")
        )

        data = []
        for marriage in marriages:
            data.append({
                "id": marriage.id,
                "marriage_type": marriage.marriage_type,
                "register_number": marriage.register_number,
                "date": marriage.date,
                "groom_name": (
                    marriage.groom_member.name
                    if marriage.groom_member
                    else marriage.groom_name
                ),
                "bride_name": (
                    marriage.bride_member.name
                    if marriage.bride_member
                    else marriage.bride_name
                ),
            })

        return Response({
            "family_name": member.family.family_name,
            "house_name": member.house_name,
            "marriage_count": marriages.count(),
            "marriages": data
        })


class MarriageCertificateMobileAPIView(APIView):
    """Get marriage certificate for ADD_BRIDE marriages only."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        member = getattr(request.user, "member", None)

        if not member or not member.is_family_head:
            return Response(
                {"detail": "Only family head can access certificates."},
                status=status.HTTP_403_FORBIDDEN
            )

        marriage = get_object_or_404(
            Marriage.objects.select_related(
                "church",
                "family",
                "groom_member",
                "bride_member",
            ),
            pk=pk,
            family=member.family,
            church=member.church,
        )

        # Block TRANSFER_BRIDE
        if marriage.marriage_type != "ADD_BRIDE":
            return Response(
                {"detail": "Marriage certificate available only for ADD_BRIDE."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # House level security
        if not (
            (marriage.bride_member and marriage.bride_member.house_name == member.house_name) or
            (marriage.groom_member and marriage.groom_member.house_name == member.house_name)
        ):
            return Response(
                {"detail": "You do not have permission to access this marriage."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MarriageCertificateSerializer(marriage)
        return Response(serializer.data)


class UserDheshaKuriAPIView(APIView):
    """Get DheshaKuri for a family head's family."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = getattr(request.user, "member", None)

        if not member or not member.is_family_head:
            return Response(
                {"detail": "Only family head can access this."},
                status=status.HTTP_403_FORBIDDEN
            )

        dhesha = (
            DheshaKuri.objects
            .select_related("church", "marriage")
            .filter(
                church=member.church,
                marriage__family=member.family,
                marriage__marriage_type="TRANSFER_BRIDE"
            )
            .order_by("-created_at")
            .first()
        )

        if not dhesha:
            return Response(
                {"detail": "Dhesha Kuri not found for your family."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DheshaKuriSerializer(dhesha)
        return Response(serializer.data)


# ============================================================
# INACTIVE MEMBERS VIEW
# ============================================================

class InactiveMembersAPIView(ListAPIView):
    """List all inactive members for a church."""
    serializer_class = InactiveMemberSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = self.request.user.church
        return Member.objects.filter(
            church=church,
            is_active=False,
            expired=False
        ).order_by("family__family_name", "house_name", "name")

#Death Register
class DeathRegisterFinalizeView(APIView):
    """
    Finalize a death registration.
    Kept as an alias — prefer DeathRegisterCreateAPIView.
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request):
        serializer = DeathRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member = serializer.validated_data.get("member")

        if not member:
            member_id = request.data.get("member")
            if member_id:
                try:
                    member = Member.objects.get(
                        id=member_id,
                        church=request.user.church,
                    )
                except Member.DoesNotExist:
                    return Response(
                        {"error": "Member not found."},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            else:
                return Response(
                    {"error": "Member is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            # Check inside the transaction to avoid race conditions
            if DeathRegister.objects.filter(member=member).exists():
                return Response(
                    {"error": "Death record already exists for this member."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            death = serializer.save()

        return Response(
            DeathRegisterSerializer(death).data,
            status=status.HTTP_201_CREATED,
        )
 
    
#promote to head

class PromoteFamilyHeadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):

        try:
            member = Member.objects.get(
                pk=pk,
                church=request.user.church,
            )
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if member.expired:
            return Response(
                {"error": "Cannot promote expired member as head."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if member.is_family_head:
            return Response(
                {"error": "Member is already head."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not member.email:
            return Response(
                {"error": "Member must have an email to become family head."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 🔥 Match on the SAME household
        existing_head = Member.objects.filter(
            family=member.family,
            house_name=member.house_name,
            house_sequence=member.house_sequence,
            is_family_head=True,
        ).first()

        if existing_head and not existing_head.expired:
            return Response(
                {
                    "error": (
                        f"This household already has an active head, "
                        f"{existing_head.name}. Mark them deceased or "
                        f"reassign them before promoting a new head."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -----------------------------------------------------
        # SUBSCRIPTION CAPACITY CHECK
        # -----------------------------------------------------
        from .services import can_add_member

        allowed, message, _info = can_add_member(request.user.church)
        if not allowed:
            return Response(
                {"error": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():

                # Re-lock inside the transaction
                from .models import ChurchSubscription
                ChurchSubscription.objects.select_for_update().filter(
                    church=request.user.church
                ).first()

                if existing_head:
                    existing_head.is_family_head = False
                    existing_head.save(update_fields=["is_family_head"])

                    if hasattr(existing_head, "user"):
                        existing_head.user.is_active = False
                        existing_head.user.save(update_fields=["is_active"])

                member.relationship = None

                if not member.register_number:
                    member.register_number = generate_register_number(
                        member.church, "HEAD"
                    )

                if not member.folio_number:
                    member.folio_number = generate_folio_number(member.church)

                member.is_family_head = True
                member.save(update_fields=[
                    "is_family_head",
                    "relationship",
                    "register_number",
                    "folio_number",
                ])

                if hasattr(member, "user"):
                    member.user.is_active = True
                    member.user.save(update_fields=["is_active"])
                else:
                    create_family_head_user(member)

        except IntegrityError:
            return Response(
                {
                    "error": (
                        f"The email {member.email} is already used by "
                        f"another account. Use a different email for this "
                        f"member before promoting them."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Family head assigned successfully.",
                "member_id": member.id,
                "register_number": member.register_number,
                "folio_number": member.folio_number,
            },
            status=status.HTTP_200_OK,
        )


class TransferAndPromoteHeadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):
        try:
            member = Member.objects.get(
                pk=pk, church=request.user.church
            )
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if member.is_family_head:
            return Response(
                {
                    "error": (
                        "A family head cannot be transferred. Promote a "
                        "replacement or mark them deceased first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_family_id = request.data.get("family")
        new_house_name = request.data.get("house_name")

        if not new_family_id or not new_house_name:
            return Response(
                {"error": "family and house_name are required to transfer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_family = Family.objects.get(
                pk=new_family_id, church=request.user.church
            )
        except Family.DoesNotExist:
            return Response(
                {"error": "Target family not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if member.expired:
            return Response(
                {"error": "Cannot transfer or promote an expired member."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not member.email:
            return Response(
                {"error": "Member must have an email to become family head."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -----------------------------------------------------
        # SUBSCRIPTION CAPACITY CHECK
        # -----------------------------------------------------
        from .services import can_add_member

        allowed, message, _info = can_add_member(request.user.church)
        if not allowed:
            return Response(
                {"error": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cleaned_house_name = new_house_name.strip()

        try:
            with transaction.atomic():

                # Re-lock the subscription inside the transaction
                from .models import ChurchSubscription
                ChurchSubscription.objects.select_for_update().filter(
                    church=request.user.church
                ).first()

                # Auto-assign next house_sequence for (family, house_name)
                last_sequence = (
                    Member.objects.filter(
                        family=new_family,
                        house_name__iexact=cleaned_house_name,
                    )
                    .order_by("-house_sequence")
                    .values_list("house_sequence", flat=True)
                    .first()
                )

                next_sequence = (last_sequence or 0) + 1

                member.family = new_family
                member.house_name = cleaned_house_name
                member.house_sequence = next_sequence
                member.relationship = None

                if not member.register_number:
                    member.register_number = generate_register_number(
                        member.church, "HEAD"
                    )
                if not member.folio_number:
                    member.folio_number = generate_folio_number(member.church)

                member.is_family_head = True
                member.save()

                if hasattr(member, "user"):
                    member.user.is_active = True
                    member.user.save(update_fields=["is_active"])
                else:
                    create_family_head_user(member)

        except IntegrityError:
            return Response(
                {
                    "error": (
                        f"The email {member.email} is already used by "
                        f"another account. Use a different email for this "
                        f"member before promoting them."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": (
                    "Member transferred and promoted to head successfully."
                ),
                "member_id": member.id,
                "register_number": member.register_number,
                "folio_number": member.folio_number,
            },
            status=status.HTTP_200_OK,
        )

class ChangeMemberHeadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):
        try:
            member = Member.objects.get(pk=pk, church=request.user.church)
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_head_id = request.data.get("head")
        if not new_head_id:
            return Response(
                {"error": "head is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_head = Member.objects.get(
                pk=new_head_id,
                church=request.user.church,
                is_family_head=True,
                is_active=True
            )
        except Member.DoesNotExist:
            return Response(
                {"error": "Target head not found or is not an active family head."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cannot change head of a family head
        if member.is_family_head:
            return Response(
                {"error": "Cannot change head of a family head."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If the member is already under this head, do nothing
        if (member.family == new_head.family and 
            member.house_name == new_head.house_name and 
            member.house_sequence == new_head.house_sequence):
            return Response(
                {"message": "Member is already under this head."},
                status=status.HTTP_200_OK
            )

        # Move the member to the new head's household
        member.family = new_head.family
        member.house_name = new_head.house_name
        member.house_sequence = new_head.house_sequence
        member.ward = new_head.ward
        member.address = new_head.address
        member.family_image = new_head.family_image
        member.save()

        return Response(
            {
                "message": f"Member moved to household of {new_head.name} successfully.",
                "member_id": member.id,
                "new_head_id": new_head.id
            },
            status=status.HTTP_200_OK
        )
     
# registry/views.py

class DeathRegisterListAPIView(ListAPIView):
    """List all death registers for a church"""
    serializer_class = DeathRegisterSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]
 
    def get_queryset(self):
        church = self.request.user.church
        queryset = DeathRegister.objects.filter(
            church=church
        ).select_related(
            "member",
            "member__family",
            "tomb_fee",  # NEW: Include tomb_fee
            "tomb_fee__tomb_type"  # NEW: Include related tomb type
        )
 
        return queryset.order_by("-created_at")
 



from django.utils.dateparse import parse_date

class DeathRegisterUpdateAPIView(
    RetrieveUpdateDestroyAPIView
):
    """
    Retrieve, update and delete an existing death register.
    """

    serializer_class = DeathRegisterSerializer
    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    def get_queryset(self):
        return (
            DeathRegister.objects
            .filter(
                church=self.request.user.church
            )
            .select_related(
                "member",
                "member__family",
                "tomb_fee",
                "tomb_fee__tomb_type",
            )
        )

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()
 




#family head edit details
class FamilyHeadUpdateAPIView(UpdateAPIView):
    serializer_class = FamilyHeadUpdateSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        return Member.objects.filter(
            church=self.request.user.church,
            is_family_head=True,
            is_active=True
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

#members under a church
class ChurchMembersAPIView(ListAPIView):
    serializer_class = FamilyMemberSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = self.request.user.church

        return Member.objects.filter(
            church=church,
            is_active=True
        ).select_related(
            "family",
            "relationship",
            "grade",
            "spouse"
        ).order_by("name")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
    
#new tables and crud
#tomb
class TombTypeListCreateView(generics.ListCreateAPIView):
    permission_classes=[IsAuthenticated, IsChurchUser]
    serializer_class = TombTypeSerializer
    def get_queryset(self):
        return TombType.objects.filter(
            church=self.request.user.church
        )

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class TombTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes=[IsAuthenticated, IsChurchUser]
    serializer_class = TombTypeSerializer
    def get_queryset(self):
        return TombType.objects.filter(
            church=self.request.user.church
        )


class TombFeeListCreateView(generics.ListCreateAPIView):
    permission_classes=[IsAuthenticated, IsChurchUser]
    serializer_class = TombFeeSerializer
    def get_queryset(self):
        return TombFee.objects.filter(
            church=self.request.user.church
        ).select_related("tomb_type")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class TombFeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes=[IsAuthenticated, IsChurchUser]
    serializer_class = TombFeeSerializer
    def get_queryset(self):
        return TombFee.objects.filter(
            church=self.request.user.church
        ).select_related("tomb_type")


#designation
class DesignationListCreateView(generics.ListCreateAPIView):
    permission_classes=[IsAuthenticated, IsChurchUser]
    serializer_class = DesignationSerializer
    def get_queryset(self):
        return Designation.objects.filter(
            church=self.request.user.church
        ).order_by("designation_name")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class DesignationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes=[IsAuthenticated, IsChurchUser]
    serializer_class = DesignationSerializer
    def get_queryset(self):
        return Designation.objects.filter(
            church=self.request.user.church
        ).order_by("designation_name")

#dioces
class DioceseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = DioceseSerializer

    def get_queryset(self):
        return Diocese.objects.filter(
            church=self.request.user.church
        ).order_by("name")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class DioceseDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = DioceseSerializer

    def get_queryset(self):
        return Diocese.objects.filter(church=self.request.user.church)

from datetime import date as date_cls

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from registry.models import Priest
from registry.serializers import PriestSerializer

from accounts.permissions import IsChurchUser


# ============================================================
# VICAR MASTER
# ============================================================

class PriestMasterAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    def get(self, request):

        church = getattr(
            request.user,
            "church",
            None
        )

        if not church:

            return Response({
                "current": [],
                "previous": [],
                "upcoming": [],
                "counts": {
                    "current": 0,
                    "previous": 0,
                    "upcoming": 0,
                    "total": 0
                }
            })

        today = date_cls.today()

        priests = Priest.objects.filter(
            church=church
        ).order_by(
            "-date_from",
            "name"
        )

        current = []
        previous = []
        upcoming = []

        for priest in priests:

            serializer = PriestSerializer(
                priest,
                context={
                    "request": request
                }
            )

            item = serializer.data

            # ==================================================
            # CURRENT
            # ==================================================

            if (
                priest.date_from
                and priest.date_from <= today
                and (
                    priest.date_to is None
                    or priest.date_to >= today
                )
            ):

                current.append(item)

            # ==================================================
            # PREVIOUS
            # ==================================================

            elif (
                priest.date_to
                and priest.date_to < today
            ):

                previous.append(item)

            # ==================================================
            # UPCOMING
            # ==================================================

            elif (
                priest.date_from
                and priest.date_from > today
            ):

                upcoming.append(item)

        return Response({

            "current": current,

            "previous": previous,

            "upcoming": upcoming,

            "counts": {
                "current": len(current),
                "previous": len(previous),
                "upcoming": len(upcoming),
                "total": (
                    len(current)
                    + len(previous)
                    + len(upcoming)
                )
            }
        })


# ============================================================
# PRIEST DROPDOWN
# ============================================================

class PriestDropdownAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    def get(self, request):

        church = getattr(
            request.user,
            "church",
            None
        )

        if not church:
            return Response([])

        priests = Priest.objects.filter(
            church=church,
            is_active=True
        ).order_by(
            "name"
        )

        data = []

        for priest in priests:

            data.append({
                "id": priest.id,
                "name": priest.name,
                "family_name": priest.family_name,
                "designation": priest.designation,
                "designation_label":
                    priest.get_designation_display(),
            })

        return Response(data)


# ============================================================
# CREATE PRIEST
# ============================================================

class PriestListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    serializer_class = PriestSerializer

    def get_queryset(self):

        return Priest.objects.filter(
            church=self.request.user.church
        ).order_by(
            "-date_from",
            "name"
        )

    def get_serializer_context(self):

        context = super().get_serializer_context()

        context["request"] = self.request

        return context

    def perform_create(self, serializer):

        serializer.save(
            church=self.request.user.church
        )


# ============================================================
# PRIEST DETAIL
# ============================================================

class PriestDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    serializer_class = PriestSerializer

    def get_queryset(self):

        return Priest.objects.filter(
            church=self.request.user.church
        )

    def get_serializer_context(self):

        context = super().get_serializer_context()

        context["request"] = self.request

        return context


#Registersettings
class RegisterSettingCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request):

        church = request.user.church
        register_type = request.data.get("register_type")

        # prevent duplicate settings
        if RegisterSetting.objects.filter(
            church=church,
            register_type=register_type
        ).exists():
            return Response(
                {"error": "Settings already exist for this register type."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RegisterSettingSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        serializer.save(church=church)

        return Response(
            {
                "message": "Register settings created successfully.",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
class RegisterSettingListAPIView(ListAPIView):
    serializer_class = RegisterSettingSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        return RegisterSetting.objects.filter(
            church=self.request.user.church
        )
    
class RegisterSettingUpdateAPIView(UpdateAPIView):
    serializer_class = RegisterSettingSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]
    lookup_field = "register_type"

    def get_queryset(self):
        return RegisterSetting.objects.filter(
            church=self.request.user.church
        )
#priest GET
from django.db import models
from django.db.models import Q, Case, When, Value, IntegerField, CharField
from datetime import date as date_cls
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)

class PriestDropdownAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church
        today = date_cls.today()

        # Get all active priests (both current and upcoming)
        priests = Priest.objects.filter(
            church=church,
            is_active=True,
        ).filter(
            Q(date_to__isnull=True) | Q(date_to__gte=today)
        ).annotate(
            # Add a status field to identify current vs upcoming
            status=Case(
                When(
                    date_from__lte=today,
                    then=Value('CURRENT')
                ),
                When(
                    date_from__gt=today,
                    then=Value('UPCOMING')
                ),
                default=Value('CURRENT'),
                output_field=CharField()
            )
        ).order_by(
            # Order by status (CURRENT first), then designation (MAIN first)
            Case(
                When(status='CURRENT', then=0),
                When(status='UPCOMING', then=1),
                default=2,
                output_field=IntegerField()
            ),
            Case(
                When(designation="MAIN", then=0),
                When(designation="ASSISTANT", then=1),
                default=2,
                output_field=IntegerField()
            ),
            "date_from",  # Then by start date
            "name"  # Finally by name
        )

        data = [
            {
                "id": p.id,
                "name": p.name,
                "designation": p.designation,
                "date_from": p.date_from,
                "date_to": p.date_to,
                "status": p.status,  # 'CURRENT' or 'UPCOMING'
            }
            for p in priests
        ]

        return Response(data)

#death
class MarkMemberDeadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):

        try:
            member = Member.objects.get(
                pk=pk,
                church=request.user.church
            )
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # 🔥 Prevent duplicate death marking
        if member.expired:
            return Response(
                {"error": "Member is already marked as deceased"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔥 Call service (no head assignment anymore)
        try:
            handle_member_death(member)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔥 Create or get death register
        death, created = DeathRegister.objects.get_or_create(
            member=member,
            defaults={
                "church": member.church,
                "status": "PENDING"
            }
        )

        return Response(
            {
                "message": "Member marked as deceased",
                "death_register_id": death.id,
                "status": death.status
            },
            status=status.HTTP_200_OK
        )


from django.utils.dateparse import parse_date

class DeathRegisterCreateAPIView(APIView):
    """Create a new death registration"""
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request):
        member_id = request.data.get("member")

        if not member_id:
            return Response(
                {"error": "member is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            member = Member.objects.get(
                pk=member_id,
                church=request.user.church
            )
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already deceased
        if member.expired:
            return Response(
                {"error": "Member is already marked as deceased."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if death record already exists
        if DeathRegister.objects.filter(member=member).exists():
            return Response(
                {"error": "Death record already exists for this member."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate required fields
        required_fields = [
            "died_on",
            "funeral_on",
            "tomb_fee",
            "reason_of_death",
        ]
        missing_fields = [
            field for field in required_fields
            if not request.data.get(field)
        ]

        if missing_fields:
            return Response(
                {
                    field: "This field is required."
                    for field in missing_fields
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate tomb_fee exists and belongs to church
        try:
            tomb_fee = TombFee.objects.get(
                id=request.data.get("tomb_fee"),
                church=request.user.church
            )
        except TombFee.DoesNotExist:
            return Response(
                {"error": "Selected tomb fee does not belong to this church."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Parse dates
            died_on = parse_date(request.data.get("died_on"))
            funeral_on = parse_date(request.data.get("funeral_on"))

            if not died_on or not funeral_on:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            today = date.today()

            # ---------------------------------------------------------
            # DATE OF DEATH
            # Cannot be in the future.
            # Backdating is allowed because records are often entered
            # days or weeks after the actual death.
            # ---------------------------------------------------------

            if died_on > today:
                return Response(
                    {"error": "Date of death cannot be in the future."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ---------------------------------------------------------
            # FUNERAL DATE
            # Cannot be in the future.
            # ---------------------------------------------------------

            if funeral_on > today:
                return Response(
                    {"error": "Funeral date cannot be in the future."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ---------------------------------------------------------
            # FUNERAL CANNOT BE BEFORE DEATH
            # ---------------------------------------------------------

            if funeral_on < died_on:
                return Response(
                    {
                        "error": (
                            "Funeral date cannot be before "
                            "the date of death."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ---------------------------------------------------------
            # FUNERAL MAX 4 DAYS AFTER DEATH
            # ---------------------------------------------------------

            max_funeral_date = died_on + timedelta(days=4)

            if funeral_on > max_funeral_date:
                return Response(
                    {
                        "error": (
                            "Funeral date can be a maximum "
                            "of 4 days after the date of death."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create death record with tomb_fee
            death = DeathRegister.objects.create(
                church=request.user.church,
                member=member,
                died_on=died_on,
                funeral_on=funeral_on,
                tomb_fee=tomb_fee,
                tomb_idn=request.data.get("tomb_idn", ""),
                reason_of_death=request.data.get("reason_of_death"),
                remarks=request.data.get("remarks", ""),
            )

            # Mark member as deceased
            member.expired = True
            member.is_active = False
            member.inactive_reason = "DECEASED"
            member.inactive_date = date.today()
            member.save()

            # Deactivate user if family head
            if member.is_family_head and hasattr(member, "user"):
                member.user.is_active = False
                member.user.save()

            # Update spouse status
            if member.spouse:
                member.spouse.marital_status = "WIDOWED"
                member.spouse.save()

        serializer = DeathRegisterSerializer(death)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
 

class HeadlessHousesGroupedAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church

        houses_with_head = set(
            Member.objects.filter(
                church=church, is_family_head=True, is_active=True, expired=False,
            ).values_list("family_id", "house_name", "house_sequence")
        )

        candidates = Member.objects.filter(
            church=church, is_active=True, expired=False,
        ).select_related("family")

        grouped = {}
        for m in candidates:
            key = (m.family_id, m.house_name, m.house_sequence)
            if key in houses_with_head:
                continue
            if key not in grouped:
                grouped[key] = {
                    "family_id": m.family_id,
                    "family_name": m.family.family_name,
                    "house_name": m.house_name,
                    "house_sequence": m.house_sequence,
                    "member_count": 0,
                }
            grouped[key]["member_count"] += 1

        return Response(list(grouped.values()))

class MembersByHouseAPIView(ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = self.request.user.church
        family_id = self.request.query_params.get("family")
        house_name = self.request.query_params.get("house_name")
        house_sequence = self.request.query_params.get("house_sequence")

        queryset = Member.objects.filter(
            church=church,
            family_id=family_id,
            house_name=house_name,
            is_active=True,
            expired=False,
        )

        if house_sequence is not None:
            queryset = queryset.filter(house_sequence=house_sequence)

        return queryset.select_related("relationship", "family", "ward", "grade")

#List All heads
class FamilyHeadListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        return Member.objects.filter(
            church=self.request.user.church,
            is_family_head=True,
            is_active=True
        ).select_related("family")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [
            {
                "id": m.id,
                "name": m.name,
                "family_name": m.family.family_name,
                "house_name": m.house_name
            }
            for m in queryset
        ]
        return Response(data)

class HeadlessHouseMembersAPIView(ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = self.request.user.church

        family_id = self.kwargs.get("family_id")
        house_name = self.kwargs.get("house_name")

        houses_with_head = set(
            Member.objects.filter(
                church=church,
                is_family_head=True,
                is_active=True,
                expired=False,
            ).values_list(
                "family_id",
                "house_name",
                "house_sequence",
            )
        )

        candidates = Member.objects.filter(
            church=church,
            family_id=family_id,
            house_name=house_name,
            is_active=True,
            expired=False,
            is_family_head=False,
        ).select_related(
            "family",
            "relationship",
            "ward",
            "grade",
        )

        eligible_ids = [
            m.id
            for m in candidates
            if (
                m.family_id,
                m.house_name,
                m.house_sequence,
            ) not in houses_with_head
        ]

        return Member.objects.filter(
            id__in=eligible_ids
        ).select_related(
            "family",
            "relationship",
            "ward",
            "grade",
        )


# views.py

class EventListCreateAPIView(ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        return Events.objects.filter(
            church=self.request.user.church
        )
    
    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)

class EventDetailAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        return Events.objects.filter(
            church=self.request.user.church
        )



class MembersUnderHeadAPIView(ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = self.request.user.church
        head_id = self.kwargs.get("pk")

        try:
            head = Member.objects.get(
                pk=head_id,
                church=church,
                is_family_head=True,
                is_active=True,
                expired=False
            )
        except Member.DoesNotExist:
            raise NotFound("Active family head not found.")

        # 🔥 REMOVE the is_active filter to show ALL members
        return Member.objects.filter(
            church=church,
            family=head.family,
            house_name__iexact=head.house_name,
            house_sequence=head.house_sequence,
            expired=False  # Keep expired filter
        ).exclude(
            pk=head.id
        ).select_related(
            "family",
            "relationship",
            "ward",
            "grade"
        ).order_by("name")

class OfferingListCreateView(generics.ListCreateAPIView):
    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    serializer_class = OfferingSerializer

    def get_queryset(self):
        return (
            Offering.objects
            .filter(church=self.request.user.church)
            .select_related("event", "member")
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(
            church=self.request.user.church
        )


class OfferingDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    serializer_class = OfferingSerializer

    def get_queryset(self):
        return (
            Offering.objects
            .filter(church=self.request.user.church)
            .select_related("event", "member")
        )

class VisitorMasterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = VisitorMasterSerializer

    def get_queryset(self):
        return VisitorMaster.objects.filter(
            church=self.request.user.church
        ).order_by("-visitor_date")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class VisitorMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = VisitorMasterSerializer

    def get_queryset(self):
        return VisitorMaster.objects.filter(church=self.request.user.church)
    

class SubscriptionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        return Subscription.objects.filter(
            church=self.request.user.church
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class SubscriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        return Subscription.objects.filter(church=self.request.user.church)
    
class AccountGroupMasterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = AccountGroupMasterSerializer

    def get_queryset(self):
        return AccountGroupMaster.objects.filter(
            church=self.request.user.church
        ).order_by("group_name")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class AccountGroupMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = AccountGroupMasterSerializer

    def get_queryset(self):
        return AccountGroupMaster.objects.filter(church=self.request.user.church)
    

class AccountLedgerMasterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = AccountLedgerMasterSerializer

    def get_queryset(self):
        return AccountLedgerMaster.objects.filter(
            church=self.request.user.church
        ).order_by("ledger_name")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class AccountLedgerMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = AccountLedgerMasterSerializer

    def get_queryset(self):
        return AccountLedgerMaster.objects.filter(church=self.request.user.church)


from .models import BankAccount
from .serializers import BankAccountSerializer, PaymentCancelSerializer
# ============================================================
# BANK ACCOUNT VIEWS
# ============================================================

class BankAccountListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = BankAccountSerializer

    def get_queryset(self):
        return BankAccount.objects.filter(
            church=self.request.user.church
        ).order_by("bank_name")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class BankAccountDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = BankAccountSerializer

    def get_queryset(self):
        return BankAccount.objects.filter(church=self.request.user.church)


# ============================================================
# PAYMENT VIEWS
# ============================================================

class PaymentMasterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = PaymentMasterSerializer

    def get_queryset(self):
        qs = (
            PaymentMaster.objects
            .filter(church=self.request.user.church)
            .select_related("account_ledger", "bank_account")
            .order_by("-payment_date", "-id")
        )

        payment_type = self.request.query_params.get("payment_type")
        if payment_type and payment_type != "ALL":
            qs = qs.filter(payment_type=payment_type)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(voucher_number__icontains=search) |
                Q(party_name__icontains=search)
            )

        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    @transaction.atomic
    def perform_create(self, serializer):
        payment = serializer.save(church=self.request.user.church)
        payment.post_to_ledger()



class PaymentMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = PaymentMasterSerializer

    def get_queryset(self):
        return PaymentMaster.objects.filter(
            church=self.request.user.church
        ).select_related("account_ledger", "bank_account")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    @transaction.atomic
    def perform_update(self, serializer):
        payment = serializer.save()

        # If amount / ledger / date changed, reverse then re-post
        if any(k in serializer.validated_data for k in
               ("amount", "account_ledger", "payment_date", "payment_type")):
            payment.reverse_ledger_entry()
            payment.post_to_ledger()


class PaymentCancelAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):
        try:
            payment = PaymentMaster.objects.get(
                pk=pk,
                church=request.user.church
            )
        except PaymentMaster.DoesNotExist:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if payment.is_cancelled:
            return Response(
                {"detail": "This payment is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PaymentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            payment.is_cancelled = True
            payment.cancel_reason = serializer.validated_data["cancel_reason"]
            payment.cancel_remarks = serializer.validated_data["cancel_remarks"]
            payment.cancelled_at = timezone.now()
            payment.save(update_fields=[
                "is_cancelled",
                "cancel_reason",
                "cancel_remarks",
                "cancelled_at",
                "updated_at",
            ])

            # 🔥 Reverse the ledger entry
            payment.reverse_ledger_entry()

        return Response(
            {
                "detail": "Payment cancelled successfully.",
                "payment_id": payment.id,
                "voucher_number": payment.voucher_number,
            },
            status=status.HTTP_200_OK
        )

from decimal import Decimal
from django.db.models import Count, Sum, Q, F

class LedgerEntryListAPIView(ListAPIView):
    """
    List ledger entries with optional filters:

      ?ledger=<id>
      ?book=cash | bank      -> filter by ledger name/group
      ?from=YYYY-MM-DD
      ?to=YYYY-MM-DD
      ?include_cancelled=true

    Adds a `running_balance` field to each row.
    """
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = LedgerEntrySerializer

    def get_queryset(self):
        church = self.request.user.church

        qs = LedgerEntry.objects.filter(
            church=church
        ).select_related(
            "ledger",
            "ledger__account_group",
            "payment",
            "receipt",
        )

        # ---------- ledger filter ----------
        ledger_id = self.request.query_params.get("ledger")
        if ledger_id:
            qs = qs.filter(ledger_id=ledger_id)

        # ---------- book filter (cash / bank) ----------
        book = (self.request.query_params.get("book") or "").lower().strip()

        if book == "cash":
            qs = qs.filter(
                Q(ledger__ledger_name__icontains="cash")
                | Q(ledger__account_group__group_name__icontains="cash")
            )

        elif book == "bank":
            qs = qs.filter(
                Q(ledger__ledger_name__icontains="bank")
                | Q(ledger__ledger_name__icontains="savings")
                | Q(ledger__ledger_name__icontains="deposit")
                | Q(ledger__account_group__group_name__icontains="bank")
            )

        # ---------- date range ----------
        date_from = self.request.query_params.get("from")
        if date_from:
            qs = qs.filter(entry_date__gte=date_from)

        date_to = self.request.query_params.get("to")
        if date_to:
            qs = qs.filter(entry_date__lte=date_to)

        # ---------- cancelled / reversals ----------
        include_cancelled = self.request.query_params.get("include_cancelled")
        if include_cancelled not in ("true", "1", "yes"):
            # Exclude both cancelled originals AND reversal entries.
            # Reversals neutralise a cancelled entry; if we included them,
            # a cancelled receipt would still shift the balance.
            qs = qs.filter(is_cancelled=False, is_reversal=False)

        # Chronological order (oldest first) — required for running balance
        return qs.order_by("entry_date", "id")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Build running balance map from the SAME queryset (already ordered asc)
        running_map = self._compute_running_balances(queryset)

        # If a single ledger is selected, also compute totals
        opening = 0.0
        total_debit = 0.0
        total_credit = 0.0
        closing = 0.0

        ledger_id = self.request.query_params.get("ledger")
        if ledger_id:
            try:
                from .models import AccountLedgerMaster
                ledger = AccountLedgerMaster.objects.get(
                    id=ledger_id, church=request.user.church
                )
                opening = float(ledger.op_balance or 0)

                agg = queryset.aggregate(
                    debits=Sum("amount", filter=Q(entry_type="DEBIT")),
                    credits=Sum("amount", filter=Q(entry_type="CREDIT")),
                )
                total_debit = float(agg["debits"] or 0)
                total_credit = float(agg["credits"] or 0)
                closing = opening + total_debit - total_credit
            except Exception:
                pass

        serializer = self.get_serializer(
            queryset,
            many=True,
            context={
                **self.get_serializer_context(),
                "running_balance_context": running_map,
            },
        )

        data = list(serializer.data)
        data.reverse()  # newest first for display

        return Response({
            "count": len(data),
            "opening_balance": opening,
            "total_debit": round(total_debit, 2),
            "total_credit": round(total_credit, 2),
            "closing_balance": round(closing, 2),
            "results": data,
        })

    def _compute_running_balances(self, queryset):
        from collections import defaultdict
        from .models import AccountLedgerMaster

        balances = defaultdict(lambda: None)
        ledger_ids = {e.ledger_id for e in queryset}
        openings = {
            l.id: float(l.op_balance or 0)
            for l in AccountLedgerMaster.objects.filter(id__in=ledger_ids)
        }

        result = {}
        for entry in queryset:
            if balances[entry.ledger_id] is None:
                balances[entry.ledger_id] = openings.get(entry.ledger_id, 0.0)
            amt = float(entry.amount or 0)
            if entry.entry_type == "DEBIT":
                balances[entry.ledger_id] += amt
            else:
                balances[entry.ledger_id] -= amt
            result[entry.id] = round(balances[entry.ledger_id], 2)

        return result


class LedgerBalanceAPIView(APIView):
    """
    Get current balance for a single ledger.
    GET /account-ledgers/<pk>/balance/
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request, pk):
        try:
            ledger = AccountLedgerMaster.objects.get(
                pk=pk, church=request.user.church
            )
        except AccountLedgerMaster.DoesNotExist:
            return Response(
                {"detail": "Ledger not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "id": ledger.id,
            "ledger_name": ledger.ledger_name,
            "ledger_nature": ledger.ledger_nature,
            "op_balance": float(ledger.op_balance or 0),
            "current_balance": round(ledger.get_current_balance(), 2),
        })
    
class QurbanaReceiptsListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = QurbanaReceiptsSerializer

    def get_queryset(self):
        return QurbanaReceipts.objects.filter(
            church=self.request.user.church
        ).order_by("-qurbana_date")

class QurbanaReceiptsListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = QurbanaReceiptsSerializer

    def get_queryset(self):
        return QurbanaReceipts.objects.filter(
            church=self.request.user.church
        ).order_by("-qurbana_date")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class QurbanaReceiptsDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = QurbanaReceiptsSerializer

    def get_queryset(self):
        return QurbanaReceipts.objects.filter(church=self.request.user.church)


class CommitteeMasterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = CommitteeMasterSerializer

    def get_queryset(self):
        return CommitteeMaster.objects.filter(
            church=self.request.user.church
        ).order_by("-committee_from_date")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church, user=self.request.user)


class CommitteeMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = CommitteeMasterSerializer

    def get_queryset(self):
        return CommitteeMaster.objects.filter(church=self.request.user.church)



class QurbanaReceiptsDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = QurbanaReceiptsSerializer

    def get_queryset(self):
        return QurbanaReceipts.objects.filter(church=self.request.user.church)


class CommitteeMasterListCreateView(generics.ListCreateAPIView):
    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    serializer_class = CommitteeMasterSerializer

    def get_queryset(self):
        return CommitteeMaster.objects.filter(
            church=self.request.user.church
        ).order_by("-committee_from_date")

    def perform_create(self, serializer):
        serializer.save(
            church=self.request.user.church
        )

class CommitteeMasterDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [
        IsAuthenticated,
        IsChurchUser
    ]

    serializer_class = CommitteeMasterSerializer

    def get_queryset(self):
        return CommitteeMaster.objects.filter(
            church=self.request.user.church
        )

    
class MemberDirectoryAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church

        members = Member.objects.filter(
            church=church,
            is_active=True,
            expired=False,
        ).select_related("family", "ward", "grade", "relationship")

        # -------------------------
        # Filters
        # -------------------------
        name = request.query_params.get("name")
        if name:
            members = members.filter(name__icontains=name)

        house = request.query_params.get("house")
        if house:
            members = members.filter(house_name__icontains=house)

        family_name = request.query_params.get("family")
        if family_name:
            members = members.filter(family__family_name__icontains=family_name)

        phone = request.query_params.get("phone")
        if phone:
            members = members.filter(
                Q(mobile_no__icontains=phone) | Q(phone_no__icontains=phone)
            )

        age_min = request.query_params.get("age_min")
        if age_min:
            members = members.filter(age__gte=age_min)

        age_max = request.query_params.get("age_max")
        if age_max:
            members = members.filter(age__lte=age_max)

        # -------------------------
        # Order: family A-Z, house A-Z, sequence, name A-Z
        # -------------------------
        members = members.order_by(
            "family__family_name", "house_name", "house_sequence", "name"
        )

        # -------------------------
        # Group by (family_name, house_name, house_sequence)
        # -------------------------
        groups = {}
        for member in members:
            fam_name = member.family.family_name if member.family else "Unassigned"
            key = (fam_name, member.house_name, member.house_sequence)
            groups.setdefault(key, []).append(member)

        serialized_groups = []
        for (fam_name, house_name, house_sequence) in sorted(
            groups.keys(), key=lambda k: (k[0].lower(), k[1].lower(), k[2])
        ):
            member_list = groups[(fam_name, house_name, house_sequence)]
            serialized_groups.append({
                "family_name": fam_name,
                "house_name": house_name,
                "member_count": len(member_list),
                "members": MemberDirectorySerializer(
                    member_list, many=True
                ).data,
            })

        return Response({
            "total_members": members.count(),
            "total_households": len(groups),
            "households": serialized_groups,
        })
    
class MemberAgeWiseListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church

        members = Member.objects.filter(
            church=church,
            is_active=True,
            expired=False,
        ).select_related("family", "ward", "grade", "relationship")

        # -------------------------
        # Filters
        # -------------------------
        name = request.query_params.get("name")
        if name:
            members = members.filter(name__icontains=name)

        house = request.query_params.get("house")
        if house:
            members = members.filter(house_name__icontains=house)

        family_name = request.query_params.get("family")
        if family_name:
            members = members.filter(family__family_name__icontains=family_name)

        phone = request.query_params.get("phone")
        if phone:
            members = members.filter(
                Q(mobile_no__icontains=phone) | Q(phone_no__icontains=phone)
            )

        age_min = request.query_params.get("age_min")
        if age_min:
            members = members.filter(age__gte=age_min)

        age_max = request.query_params.get("age_max")
        if age_max:
            members = members.filter(age__lte=age_max)

        # -------------------------
        # Sort: oldest first (age descending), nulls last
        # -------------------------
        order = request.query_params.get("order", "desc")
        if order == "asc":
            members = members.order_by(F("age").asc(nulls_last=True), "name")
        else:
            members = members.order_by(F("age").desc(nulls_last=True), "name")

        serializer = MemberDirectorySerializer(members, many=True)

        return Response({
            "total_members": members.count(),
            "members": serializer.data,
        })
    
class MemberPhoneDirectoryAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church

        members = Member.objects.filter(
            church=church,
            is_active=True,
            expired=False,
        ).select_related("family", "ward", "grade", "relationship")

        # -------------------------
        # Filters
        # -------------------------
        name = request.query_params.get("name")
        if name:
            members = members.filter(name__icontains=name)

        house = request.query_params.get("house")
        if house:
            members = members.filter(house_name__icontains=house)

        family_name = request.query_params.get("family")
        if family_name:
            members = members.filter(family__family_name__icontains=family_name)

        phone = request.query_params.get("phone")
        if phone:
            members = members.filter(
                Q(mobile_no__icontains=phone) | Q(phone_no__icontains=phone)
            )

        age_min = request.query_params.get("age_min")
        if age_min:
            members = members.filter(age__gte=age_min)

        age_max = request.query_params.get("age_max")
        if age_max:
            members = members.filter(age__lte=age_max)

        # -------------------------
        # Sort: alphabetical by name
        # -------------------------
        members = members.order_by("name")

        serializer = MemberDirectorySerializer(members, many=True)

        return Response({
            "total_members": members.count(),
            "members": serializer.data,
        })



# ============================================================
# MEMBER DETAIL VIEW - With nested relationships
# ============================================================

class MemberDetailView(APIView):
    """
    Get detailed member information with nested relationship objects.
    This resolves foreign keys to their display names.
    """
    permission_classes = [IsAuthenticated, IsChurchUser]
    
    def get(self, request, pk):
        try:
            member = Member.objects.select_related(
                'family', 'ward', 'grade', 'relationship'
            ).get(
                pk=pk,
                church=request.user.church
            )
        except Member.DoesNotExist:
            return Response(
                {"detail": "Member not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": f"Error fetching member: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            serializer = MemberDetailSerializer(
                member, 
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": f"Error serializing member: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ============================================================
# LEGACY BAPTISM VIEWS
# ============================================================

class LegacyBaptismListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = LegacyBaptismSerializer

    def get_queryset(self):
        return (
            LegacyBaptism.objects
            .filter(church=self.request.user.church)
            .order_by("-date_of_baptism")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    def list(self, request, *args, **kwargs):
        """Use lightweight serializer for list view."""
        queryset = self.get_queryset()

        # Optional filters
        name = request.query_params.get("name")
        if name:
            queryset = queryset.filter(name__icontains=name)

        year = request.query_params.get("year")
        if year:
            queryset = queryset.filter(date_of_baptism__year=year)

        serializer = LegacyBaptismListSerializer(
            queryset, many=True
        )
        return Response({
            "count": queryset.count(),
            "results": serializer.data
        })


class LegacyBaptismDetailAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = LegacyBaptismSerializer

    def get_queryset(self):
        return LegacyBaptism.objects.filter(
            church=self.request.user.church
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context


# ============================================================
# LEGACY MARRIAGE VIEWS
# ============================================================

class LegacyMarriageListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = LegacyMarriageSerializer

    def get_queryset(self):
        return (
            LegacyMarriage.objects
            .filter(church=self.request.user.church)
            .order_by("-date")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        name = request.query_params.get("name")
        if name:
            queryset = queryset.filter(
                Q(groom_name__icontains=name) |
                Q(bride_name__icontains=name)
            )

        year = request.query_params.get("year")
        if year:
            queryset = queryset.filter(date__year=year)

        serializer = LegacyMarriageListSerializer(
            queryset, many=True
        )
        return Response({
            "count": queryset.count(),
            "results": serializer.data
        })


class LegacyMarriageDetailAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = LegacyMarriageSerializer

    def get_queryset(self):
        return LegacyMarriage.objects.filter(
            church=self.request.user.church
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context


# ============================================================
# LEGACY DEATH VIEWS
# ============================================================

class LegacyDeathListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = LegacyDeathSerializer

    def get_queryset(self):
        return (
            LegacyDeath.objects
            .filter(church=self.request.user.church)
            .order_by("-died_on")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        name = request.query_params.get("name")
        if name:
            queryset = queryset.filter(name__icontains=name)

        year = request.query_params.get("year")
        if year:
            queryset = queryset.filter(died_on__year=year)

        serializer = LegacyDeathListSerializer(
            queryset, many=True
        )
        return Response({
            "count": queryset.count(),
            "results": serializer.data
        })


class LegacyDeathDetailAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = LegacyDeathSerializer

    def get_queryset(self):
        return LegacyDeath.objects.filter(
            church=self.request.user.church
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

# ============================================================
# RECEIPTS
# ============================================================

class ReceiptListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = ReceiptMasterSerializer

    def get_queryset(self):
        qs = (
            ReceiptMaster.objects
            .filter(church=self.request.user.church)
            .select_related("member", "bank_account")
            .prefetch_related("lines", "lines__ledger")
            .order_by("-receipt_date", "-id")
        )

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(receipt_number__icontains=search) |
                Q(member__name__icontains=search)
            )

        date_from = self.request.query_params.get("from")
        if date_from:
            qs = qs.filter(receipt_date__gte=date_from)

        date_to = self.request.query_params.get("to")
        if date_to:
            qs = qs.filter(receipt_date__lte=date_to)

        payment_type = self.request.query_params.get("payment_type")
        if payment_type and payment_type != "ALL":
            qs = qs.filter(payment_type=payment_type)

        status_param = self.request.query_params.get("status")
        if status_param == "POSTED":
            qs = qs.filter(is_cancelled=False)
        elif status_param == "CANCELLED":
            qs = qs.filter(is_cancelled=True)

        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = ReceiptMasterListSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response({
            "count": queryset.count(),
            "results": serializer.data,
        })


class ReceiptDetailAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = ReceiptMasterSerializer

    def get_queryset(self):
        return (
            ReceiptMaster.objects
            .filter(church=self.request.user.church)
            .select_related("member", "bank_account")
            .prefetch_related("lines", "lines__ledger")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["church"] = self.request.user.church
        return context


class ReceiptCancelAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):
        try:
            receipt = ReceiptMaster.objects.get(
                pk=pk,
                church=request.user.church
            )
        except ReceiptMaster.DoesNotExist:
            return Response(
                {"detail": "Receipt not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if receipt.is_cancelled:
            return Response(
                {"detail": "This receipt is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReceiptCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            receipt.is_cancelled = True
            receipt.cancel_reason = serializer.validated_data["cancel_reason"]
            receipt.cancel_remarks = serializer.validated_data["cancel_remarks"]
            receipt.cancelled_at = timezone.now()
            receipt.save(update_fields=[
                "is_cancelled",
                "cancel_reason",
                "cancel_remarks",
                "cancelled_at",
                "updated_at",
            ])

            receipt.reverse_ledger_entry()

        return Response(
            {
                "detail": "Receipt cancelled successfully.",
                "receipt_id": receipt.id,
                "receipt_number": receipt.receipt_number,
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# REPORTS — MEMBER LEDGER
# ============================================================

class MemberLedgerReportAPIView(APIView):
    """
    GET /api/registry/reports/member-ledger/?member=<id>&from=&to=

    Returns every ReceiptLine for the given member, in date order,
    with opening balance and running debit/credit columns.
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        from decimal import Decimal
        from django.db.models import Sum

        church = request.user.church

        member_id = request.query_params.get("member")
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")

        if not member_id:
            return Response(
                {"detail": "member is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            member = Member.objects.get(id=member_id, church=church)
        except Member.DoesNotExist:
            return Response(
                {"detail": "Member not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----- Opening balance: all DEBIT ledger entries for this member
        #       BEFORE date_from, minus their reversals.
        opening_qs = ReceiptLine.objects.filter(
            receipt__church=church,
            receipt__member=member,
            receipt__is_cancelled=False,
            
        )
        if date_from:
            opening_qs = opening_qs.filter(receipt__receipt_date__lt=date_from)

        opening_debit = opening_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")

        # ----- Rows in range
        rows_qs = (
            ReceiptLine.objects
            .filter(
                receipt__church=church,
                receipt__member=member,
                receipt__is_cancelled=False,
            )
            .select_related("receipt", "receipt__bank_account", "ledger")
            .order_by("receipt__receipt_date", "receipt_id", "id")
        )
        if date_from:
            rows_qs = rows_qs.filter(receipt__receipt_date__gte=date_from)
        if date_to:
            rows_qs = rows_qs.filter(receipt__receipt_date__lte=date_to)

        rows = []
        total_credit = Decimal("0")
        total_debit = Decimal("0")

        for line in rows_qs:
            rcp = line.receipt

            # nature = (line.ledger.ledger_nature or "INCOME").upper()
            # is_debit_side = nature in ("INCOME", "ASSET")
            is_debit_side = True 
            amount = line.amount or Decimal("0")

            if is_debit_side:
                debit = amount
                credit = Decimal("0")
                total_debit += amount
            else:
                debit = Decimal("0")
                credit = amount
                total_credit += amount

            # Cash / Bank label
            if rcp.payment_type == "CASH":
                cash_bank = "Cash Account"
            elif rcp.bank_account:
                cash_bank = (
                    getattr(rcp.bank_account, "display_name", None)
                    or rcp.bank_account.bank_name
                )
            else:
                cash_bank = "Bank Account"

            rows.append({
                "id": line.id,
                "date": rcp.receipt_date.isoformat() if rcp.receipt_date else None,
                "voucher": rcp.receipt_number or "",
                "ledger_name": line.ledger.ledger_name,
                "cash_bank": cash_bank,
                "credit": float(credit),
                "debit": float(debit),
            })

        closing = opening_debit + total_debit - total_credit

        return Response({
            "member": {
                "id": member.id,
                "name": member.name,
                "family_name": member.family.family_name if member.family else "",
            },
            "from": date_from,
            "to": date_to,
            "opening_balance": float(opening_debit),
            "rows": rows,
            "totals": {
                "credit": float(total_credit),
                "debit": float(total_debit),
                "closing": float(closing),
            },
        })


# ============================================================
# REPORTS — INCOME & EXPENDITURE
# ============================================================

class IncomeExpenditureReportAPIView(APIView):
    """
    GET /api/registry/reports/income-expenditure/?from=&to=&mode=Summary|Detailed

    Returns a nested tree:

      Summary:  root → child group → grandchild group (with amounts)
      Detailed: root → child group → grandchild group → ledgers (with amounts)

    Roots:
      Income      : II. Revenue Receipts, III. Inter Church / Unit Accounts
      Expenditure : V. Inter Church / Unit Payments, VI. Revenue Payments
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    INCOME_ROOTS = ["II. Revenue Receipts", "III. Inter Church / Unit Accounts"]
    EXPENSE_ROOTS = ["V. Inter Church / Unit Payments", "VI. Revenue Payments"]

    def get(self, request):
        church = request.user.church
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        mode = (request.query_params.get("mode") or "Summary").lower()
        is_detailed = mode == "detailed"

        income = self._build_tree(
            church, self.INCOME_ROOTS, date_from, date_to, is_detailed
        )
        expenditure = self._build_tree(
            church, self.EXPENSE_ROOTS, date_from, date_to, is_detailed
        )

        total_income = sum(g["amount"] for g in income)
        total_expenditure = sum(g["amount"] for g in expenditure)
        net = total_income - total_expenditure

        return Response({
            "from": date_from,
            "to": date_to,
            "mode": "Detailed" if is_detailed else "Summary",
            "income": income,
            "expenditure": expenditure,
            "total_income": total_income,
            "total_expenditure": total_expenditure,
            "net_surplus": net,
            "is_surplus": net >= 0,
        })

    # ============================================================
    # TREE BUILDER
    # ============================================================

    def _build_tree(self, church, root_names, date_from, date_to, is_detailed):
        """Build the full nested tree for the given root group names."""
        roots = AccountGroupMaster.objects.filter(
            church=church,
            group_name__in=root_names,
        ).order_by("group_name")

        result = []

        for root in roots:
            root_total = self._sum_group(church, root, date_from, date_to)

            result.append({
                "group_name": root.group_name,
                "amount": root_total,
                "children": self._build_children(
                    church, root, date_from, date_to, is_detailed
                ),
            })

        return result

    def _build_children(self, church, parent_group, date_from, date_to, is_detailed):
        """Recursively build children nodes for a parent group."""
        children = AccountGroupMaster.objects.filter(
            church=church,
            under_group=parent_group,
        ).order_by("group_name")

        nodes = []

        for child in children:
            child_total = self._sum_group(church, child, date_from, date_to)

            node = {
                "group_name": child.group_name,
                "amount": child_total,
                "children": self._build_children(
                    church, child, date_from, date_to, is_detailed
                ),
            }

            # In Detailed mode, leaf groups also show their ledgers
            if is_detailed and not node["children"]:
                node["ledgers"] = self._ledger_breakdown(
                    church, child, date_from, date_to
                )

            nodes.append(node)

        return nodes

    # ============================================================
    # AMOUNT ROLLUP
    # ============================================================

    def _sum_group(self, church, group, date_from, date_to):
        """
        Sum all LedgerEntry amounts for ledgers that live in this group
        OR any of its descendant groups.
        """
        from django.db.models import Sum, Q

        # Collect this group + all descendants
        group_ids = [group.id]
        queue = [group]

        while queue:
            current = queue.pop()
            subs = AccountGroupMaster.objects.filter(
                church=church, under_group=current
            ).values_list("id", flat=True)
            for sid in subs:
                group_ids.append(sid)
                queue.append(AccountGroupMaster.objects.get(id=sid))

        qs = LedgerEntry.objects.filter(
            church=church,
            ledger__account_group_id__in=group_ids,
            is_cancelled=False,
            is_reversal=False,
        )
        if date_from:
            qs = qs.filter(entry_date__gte=date_from)
        if date_to:
            qs = qs.filter(entry_date__lte=date_to)

        agg = qs.aggregate(
            debits=Sum("amount", filter=Q(entry_type="DEBIT")),
            credits=Sum("amount", filter=Q(entry_type="CREDIT")),
        )
        debits = float(agg["debits"] or 0)
        credits = float(agg["credits"] or 0)

        return round(abs(debits - credits), 2)

    def _ledger_breakdown(self, church, group, date_from, date_to):
        """Return per-ledger amounts for a leaf group."""
        from django.db.models import Sum, Q

        ledgers = AccountLedgerMaster.objects.filter(
            church=church,
            account_group=group,
            status=True,
        ).order_by("ledger_name")

        out = []
        for led in ledgers:
            qs = LedgerEntry.objects.filter(
                church=church,
                ledger=led,
                is_cancelled=False,
                is_reversal=False,
            )
            if date_from:
                qs = qs.filter(entry_date__gte=date_from)
            if date_to:
                qs = qs.filter(entry_date__lte=date_to)

            agg = qs.aggregate(
                debits=Sum("amount", filter=Q(entry_type="DEBIT")),
                credits=Sum("amount", filter=Q(entry_type="CREDIT")),
            )
            debits = float(agg["debits"] or 0)
            credits = float(agg["credits"] or 0)
            amt = round(abs(debits - credits), 2)

            if amt > 0:
                out.append({
                    "ledger_name": led.ledger_name,
                    "amount": amt,
                })

        return out


# ============================================================
# REPORTS — DONATION REGISTER
# ============================================================

class DonationRegisterReportAPIView(APIView):
    """
    GET /api/registry/reports/donation-register/?from=&to=&member_id=&ledger_id=&mode=&sort=

    Returns every ReceiptLine whose ledger belongs to the
    "B. Donations" group (or its descendants).
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    DONATION_GROUP_NAMES = ["B. Donations", "DONATIONS & OFFERINGS", "DONATIONS"]

    def get(self, request):
        church = request.user.church

        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        member_id = request.query_params.get("member_id")
        ledger_id = request.query_params.get("ledger_id")
        mode = request.query_params.get("mode")
        sort = request.query_params.get("sort") or "Newest First"

        # ------ find donation group IDs (recursively) ------
        donation_root_ids = list(
            AccountGroupMaster.objects.filter(
                church=church,
                group_name__in=self.DONATION_GROUP_NAMES,
            ).values_list("id", flat=True)
        )

        if not donation_root_ids:
            return Response({
                "from": date_from,
                "to": date_to,
                "rows": [],
                "total": 0,
            })

        all_group_ids = list(donation_root_ids)
        queue = list(donation_root_ids)

        while queue:
            gid = queue.pop()
            subs = AccountGroupMaster.objects.filter(
                church=church, under_group_id=gid
            ).values_list("id", flat=True)
            for s in subs:
                all_group_ids.append(s)
                queue.append(s)

        # ------ query ReceiptLines ------
        qs = (
            ReceiptLine.objects
            .filter(
                receipt__church=church,
                receipt__is_cancelled=False,
                ledger__account_group_id__in=all_group_ids,
            )
            .select_related(
                "receipt",
                "receipt__member",
                "receipt__member__family",
                "receipt__bank_account",
                "ledger",
            )
        )

        if date_from:
            qs = qs.filter(receipt__receipt_date__gte=date_from)
        if date_to:
            qs = qs.filter(receipt__receipt_date__lte=date_to)
        if member_id:
            qs = qs.filter(receipt__member_id=member_id)
        if ledger_id:
            qs = qs.filter(ledger_id=ledger_id)
        if mode:
            qs = qs.filter(receipt__transaction_type=mode)

        # sort
        if sort == "Oldest First":
            qs = qs.order_by("receipt__receipt_date", "id")
        elif sort == "Amount (High to Low)":
            qs = qs.order_by("-amount")
        elif sort == "Amount (Low to High)":
            qs = qs.order_by("amount")
        else:  # Newest First
            qs = qs.order_by("-receipt__receipt_date", "-id")

        rows = []
        total = 0.0

        for line in qs:
            rcp = line.receipt

            # payment mode label
            if rcp.payment_type == "CASH":
                payment_mode = "Cash"
            else:
                payment_mode = (
                    rcp.get_transaction_type_display()
                    if rcp.transaction_type
                    else "Bank Transfer"
                )

            amount = float(line.amount or 0)
            total += amount

            rows.append({
                "id": line.id,
                "date": rcp.receipt_date.isoformat() if rcp.receipt_date else None,
                "receipt_number": rcp.receipt_number or "",
                "donor_name": rcp.member.name if rcp.member else "Anonymous",
                "family_name": (
                    rcp.member.family.family_name
                    if rcp.member and rcp.member.family
                    else "—"
                ),
                "donation_type": line.ledger.ledger_name,
                "payment_mode": payment_mode,
                "reference_number": rcp.ref_no or "—",
                "amount": amount,
            })

        return Response({
            "from": date_from,
            "to": date_to,
            "rows": rows,
            "total": total,
        })


# ============================================================
# SUBSCRIPTION HELPERS
# ============================================================

def _month_range(date_from_str, date_to_str):
    """Return (month_start, month_end) as date objects."""
    from datetime import date as _date

    def parse(s, default):
        if not s:
            return default
        try:
            y, m, d = map(int, s.split("-"))
            return _date(y, m, d)
        except Exception:
            return default

    today = _date.today()
    month_start = parse(date_from_str, today.replace(day=1))
    month_end = parse(date_to_str, today)

    return month_start, month_end


def _subscriptions_by_grade(church):
    """Return {grade_id: [Subscription, ...]} for the church."""
    subs = Subscription.objects.filter(
        church=church, is_cancelled=False
    ).select_related("grade", "ledger")

    out = {}
    for s in subs:
        out.setdefault(s.grade_id, []).append(s)
    return out


def _get_paid_amount(church, member, ledger, month_start, month_end):
    """Sum of all receipt line amounts for this member + ledger in range."""
    from django.db.models import Sum

    qs = ReceiptLine.objects.filter(
        receipt__church=church,
        receipt__member=member,
        receipt__is_cancelled=False,
        ledger=ledger,
        receipt__receipt_date__gte=month_start,
        receipt__receipt_date__lte=month_end,
    )
    return qs.aggregate(t=Sum("amount"))["t"] or 0


# ============================================================
# REPORTS — SUBSCRIPTION DUE LIST
# ============================================================

class SubscriptionDueListAPIView(APIView):
    """
    Ward-grouped list of members whose subscription is not fully paid
    for the requested month.

    Matching rule: member's grade → subscription(s) for that grade →
    look for receipt lines on the same ledger in the same month.
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        from decimal import Decimal

        church = request.user.church
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        ward_id = request.query_params.get("ward_id")
        member_id = request.query_params.get("member_id")

        month_start, month_end = _month_range(date_from, date_to)
        subs_by_grade = _subscriptions_by_grade(church)

        members = Member.objects.filter(
            church=church, is_active=True, expired=False
        ).select_related("ward", "family", "grade")

        if ward_id:
            members = members.filter(ward_id=ward_id)
        if member_id:
            members = members.filter(id=member_id)

        wards_map = {}

        for member in members:
            subs = subs_by_grade.get(member.grade_id, [])
            if not subs:
                continue

            monthly_due = Decimal("0")
            charity_due = Decimal("0")
            diocese_due = Decimal("0")

            for s in subs:
                # Skip subscriptions with no ledger
                if not s.ledger:
                    continue

                expected = Decimal(str(s.amount or 0))
                paid = Decimal(str(
                    _get_paid_amount(church, member, s.ledger, month_start, month_end)
                ))
                remaining = max(Decimal("0"), expected - paid)

                lname = (s.ledger.ledger_name or "").lower()
                if "charity" in lname:
                    charity_due += remaining
                elif "diocese" in lname:
                    diocese_due += remaining
                else:
                    monthly_due += remaining

            total_due = monthly_due + charity_due + diocese_due
            if total_due <= 0:
                continue

            ward_name = member.ward.ward_name if member.ward else "Unassigned"
            family_name = member.family.family_name if member.family else ""

            bucket = wards_map.setdefault(ward_name, {
                "ward": ward_name, "members": [], "_total": Decimal("0"),
            })

            bucket["members"].append({
                "member_id": member.id,
                "name": member.name,
                "family_name": family_name,
                "monthly_subscription": float(monthly_due),
                "charity_fund": float(charity_due),
                "diocese_fund": float(diocese_due),
                "total_due": float(total_due),
            })
            bucket["_total"] += total_due

        wards = []
        grand_total = Decimal("0")
        for wname in sorted(wards_map.keys()):
            b = wards_map[wname]
            wards.append({
                "ward": b["ward"],
                "member_count": len(b["members"]),
                "ward_total": float(b["_total"]),
                "members": b["members"],
            })
            grand_total += b["_total"]

        return Response({
            "from": month_start.isoformat(),
            "to": month_end.isoformat(),
            "wards": wards,
            "grand_total": float(grand_total),
        })


# ============================================================
# REPORTS — SUBSCRIPTION PAID LIST
# ============================================================

class SubscriptionPaidListAPIView(APIView):
    """
    Ward-grouped list of members who paid something for their
    subscriptions during the requested month.
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        from decimal import Decimal
        from django.db.models import Sum

        church = request.user.church
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        ward_id = request.query_params.get("ward_id")
        member_id = request.query_params.get("member_id")

        month_start, month_end = _month_range(date_from, date_to)

        # All receipt lines in this month for this church
        lines = ReceiptLine.objects.filter(
            receipt__church=church,
            receipt__is_cancelled=False,
            receipt__receipt_date__gte=month_start,
            receipt__receipt_date__lte=month_end,
        ).select_related(
            "receipt", "receipt__member", "receipt__member__ward",
            "receipt__member__family", "ledger",
        )

        if ward_id:
            lines = lines.filter(receipt__member__ward_id=ward_id)
        if member_id:
            lines = lines.filter(receipt__member_id=member_id)

        wards_map = {}

        for line in lines:
            member = line.receipt.member
            if not member:
                continue

            lname = (line.ledger.ledger_name or "").lower()

            # Only count lines that point to subscription-ish ledgers
            if not (
                "subscription" in lname
                or "charity" in lname
                or "diocese" in lname
            ):
                continue

            ward_name = member.ward.ward_name if member.ward else "Unassigned"
            family_name = member.family.family_name if member.family else ""

            # Find or create member bucket inside ward
            bucket = wards_map.setdefault(ward_name, {
                "ward": ward_name, "by_member": {}, "_total": Decimal("0"),
            })

            mkey = member.id
            if mkey not in bucket["by_member"]:
                bucket["by_member"][mkey] = {
                    "member_id": member.id,
                    "name": member.name,
                    "family_name": family_name,
                    "monthly_subscription": Decimal("0"),
                    "charity_fund": Decimal("0"),
                    "diocese_fund": Decimal("0"),
                    "total_paid": Decimal("0"),
                }

            m = bucket["by_member"][mkey]
            amt = Decimal(str(line.amount or 0))

            if "charity" in lname:
                m["charity_fund"] += amt
            elif "diocese" in lname:
                m["diocese_fund"] += amt
            else:
                m["monthly_subscription"] += amt

            m["total_paid"] += amt
            bucket["_total"] += amt

        # Serialize
        wards = []
        grand_total = Decimal("0")
        for wname in sorted(wards_map.keys()):
            b = wards_map[wname]
            members = []
            for m in b["by_member"].values():
                members.append({
                    "member_id": m["member_id"],
                    "name": m["name"],
                    "family_name": m["family_name"],
                    "monthly_subscription": float(m["monthly_subscription"]),
                    "charity_fund": float(m["charity_fund"]),
                    "diocese_fund": float(m["diocese_fund"]),
                    "total_paid": float(m["total_paid"]),
                })
            wards.append({
                "ward": b["ward"],
                "member_count": len(members),
                "ward_total": float(b["_total"]),
                "members": members,
            })
            grand_total += b["_total"]

        return Response({
            "from": month_start.isoformat(),
            "to": month_end.isoformat(),
            "wards": wards,
            "grand_total": float(grand_total),
        })