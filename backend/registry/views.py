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
from .models import (
    Baptism,
    Bill,
    Church,
    DeathRegister,
    Designation,
    DheshaKuri,
    Diocese,
    Events,
    Grade,
    Marriage,
    Priest,
    RegisterSetting,
    Relationship,
    TombFee,
    TombType,
    UpgradeRequest,
    Ward,
    Family,
    Member,
    Package,
    Offering,
    VisitorMaster,
    Subscription,
    AccountGroupMaster,
    AccountLedgerMaster,
    PaymentMaster,
    QurbanaReceipts,
    CommitteeMaster,
    LegacyBaptism,
    LegacyMarriage,
    LegacyDeath,
    ReceiptMaster,
    ReceiptLine,
    LedgerEntry,
    ContraMaster,
)
from .serializers import BaptismSerializer, BillDetailSerializer, BillListSerializer,LedgerEntrySerializer, ChurchDetailSerializer,MemberDetailSerializer, ChurchListSerializer, DeathRegisterSerializer, DesignationSerializer, DheshaKuriSerializer, DioceseSerializer, EventSerializer, FamilyHeadCreateSerializer, FamilyHeadUpdateSerializer, FamilyMemberSerializer, GradeSerializer, InactiveMemberSerializer, MarriageCertificateSerializer, MarriageSerializer, MemberProfileSerializer, MobileFamilyBaptismSerializer, MobileFamilyDetailSerializer, MobileFamilyListSerializer, MobileFamilyMemberSerializer,  PriestNameSerializer,PriestSerializer, RegisterSettingSerializer, RelationshipSerializer, SubscriptionExpirySerializer, TombFeeSerializer, TombTypeSerializer, UpgradeSerializer,  WardSerializer, FamilySerializer, MemberSerializer,PackageSerializer, WardWithFamilyCountSerializer, OfferingSerializer, VisitorMasterSerializer, SubscriptionSerializer, AccountGroupMasterSerializer, AccountLedgerMasterSerializer, PaymentMasterSerializer, QurbanaReceiptsSerializer, CommitteeMasterSerializer, MemberDirectorySerializer, LegacyBaptismSerializer, LegacyMarriageSerializer, LegacyDeathSerializer, LegacyBaptismListSerializer, LegacyMarriageListSerializer, LegacyDeathListSerializer,ReceiptMasterSerializer, ReceiptMasterListSerializer, ReceiptCancelSerializer, ContraMasterSerializer
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

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class MyChurchAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        church = request.user.church
        serializer = ChurchDetailSerializer(church, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        church = request.user.church
        serializer = ChurchDetailSerializer(
            church, data=request.data, partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
        return Relationship.objects.filter(church=church).order_by("name")

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

        return Relationship.objects.filter(church=church)

    # ========================================================
    # BLOCK UPDATE ON RESERVED
    # ========================================================

    def perform_update(self, serializer):
        if serializer.instance.reserved:
            raise ValidationError(
                "This is a system default relationship and cannot be edited."
            )
        serializer.save()

    # ========================================================
    # BLOCK DELETE ON RESERVED
    # ========================================================

    def perform_destroy(self, instance):
        if instance.reserved:
            raise ValidationError(
                "This is a system default relationship and cannot be deleted."
            )
        instance.delete()

    

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

# ============================================================
# MARRIAGE VIEWS
# ============================================================

class MarriageListCreateAPIView(ListCreateAPIView):
    """
    List all marriages or create a new marriage.
    Create handles both ADD_BRIDE and TRANSFER_BRIDE types.

    ✅ @transaction.atomic on perform_create ensures that
       generate_register_number() and the Marriage INSERT
       commit or roll back together. Without this, the
       register counter could advance even when the INSERT
       failed (e.g. unique collision), leaving the counter
       out of sync with the DB.
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

    @transaction.atomic
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
 
    
# registry/views.py

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

        # -----------------------------------------------------
        # Check household
        # -----------------------------------------------------

        existing_head = Member.objects.filter(
            family=member.family,
            house_name=member.house_name,
            house_sequence=member.house_sequence,
            is_family_head=True,
        ).exclude(pk=member.pk).first()

        # ✅ FIXED: Block ONLY if there is an ACTIVE head (alive AND not expired).
        # If the old head is married off (inactive), the household is effectively
        # headless, and we should allow the replacement.
        if existing_head and existing_head.is_active and not existing_head.expired:
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

        # ✅ Check if ANY member in this household has a register_number.
        # register_number is only ever assigned to a family head and is NEVER deleted.
        # So even if the old head became inactive or lost the `is_family_head` flag,
        # their register_number remains, proving this household is a REPLACEMENT.
        household_ever_had_head = Member.objects.filter(
            family=member.family,
            house_name=member.house_name,
            house_sequence=member.house_sequence,
        ).exclude(pk=member.pk).filter(
            Q(is_family_head=True) | Q(register_number__isnull=False)
        ).exists()

        # -----------------------------------------------------
        # SUBSCRIPTION CAPACITY CHECK
        # -----------------------------------------------------
        if not household_ever_had_head:
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

                # If a previous head exists, demote them cleanly
                if existing_head:
                    existing_head.is_family_head = False
                    existing_head.save(update_fields=["is_family_head"])

                    if hasattr(existing_head, "user") and existing_head.user:
                        existing_head.user.is_active = False
                        existing_head.user.save(update_fields=["is_active"])

                # Clear relationship — a head has no relationship
                member.relationship = None

                if not member.register_number:
                    member.register_number = generate_register_number(
                        member.church, "HEAD"
                    )

                if not member.folio_number:
                    member.folio_number = generate_folio_number(member.church)

                member.is_family_head = True
                member.is_active = True  # ✅ Ensure they are active
                member.save(update_fields=[
                    "is_family_head",
                    "is_active",
                    "relationship",
                    "register_number",
                    "folio_number",
                ])

                # Activate or create the user login
                if hasattr(member, "user") and member.user:
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

# registry/views.py

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

        cleaned_house_name = new_house_name.strip()

        # -----------------------------------------------------
        # Determine if this is a REPLACEMENT or NEW SLOT
        # -----------------------------------------------------
        household_ever_had_head = (
            Member.objects.filter(
                family=new_family,
                house_name__iexact=cleaned_house_name,
            )
            .exclude(pk=member.pk)
            .filter(
                Q(is_family_head=True) | Q(register_number__isnull=False)
            )
            .exists()
        )

        # -----------------------------------------------------
        # SUBSCRIPTION CAPACITY CHECK (Only for new households)
        # -----------------------------------------------------
        if not household_ever_had_head:
            from .services import can_add_member

            allowed, message, _info = can_add_member(request.user.church)
            if not allowed:
                return Response(
                    {"error": message},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            with transaction.atomic():

                # Re-lock subscription inside transaction
                from .models import ChurchSubscription
                ChurchSubscription.objects.select_for_update().filter(
                    church=request.user.church
                ).first()

                # Auto-assign next house_sequence safely
                last_sequence = (
                    Member.objects.select_for_update()
                    .filter(
                        family=new_family,
                        house_name__iexact=cleaned_house_name,
                    )
                    .order_by("-house_sequence")
                    .values_list("house_sequence", flat=True)
                    .first()
                )

                next_sequence = (last_sequence or 0) + 1

                # -----------------------------------------------------
                # Block if target house already has an ACTIVE head
                # -----------------------------------------------------
                existing_target_head = Member.objects.filter(
                    family=new_family,
                    house_name__iexact=cleaned_house_name,
                    house_sequence=next_sequence,
                    is_family_head=True,
                    is_active=True,
                    expired=False,
                ).exclude(pk=member.pk).first()

                if existing_target_head:
                    return Response(
                        {
                            "error": (
                                f"This house already has an active head "
                                f"({existing_target_head.name}). Demote or "
                                f"mark them inactive before transferring "
                                f"a new head here."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

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
                member.is_active = True  # Ensure active

                member.save(update_fields=[
                    "family", "house_name", "house_sequence",
                    "relationship", "register_number", "folio_number",
                    "is_family_head", "is_active",
                ])

                if hasattr(member, "user") and member.user:
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
                "is_replacement": household_ever_had_head,
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


# ============================================================
# DESIGNATION VIEWS
# ============================================================

class DesignationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = DesignationSerializer

    def get_queryset(self):
        return Designation.objects.filter(
            church=self.request.user.church
        ).order_by("designation_name")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class DesignationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = DesignationSerializer

    def get_queryset(self):
        return Designation.objects.filter(
            church=self.request.user.church
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    # ✅ Block update on reserved
    def perform_update(self, serializer):
        if serializer.instance.reserved:
            raise ValidationError(
                "This is a system default designation and cannot be edited."
            )
        serializer.save()

    # ✅ Block delete on reserved
    def perform_destroy(self, instance):
        if instance.reserved:
            raise ValidationError(
                "This is a system default designation and cannot be deleted."
            )
        instance.delete()

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

from .services import reseal_vicar_windows
# ============================================================
# CREATE PRIEST
# ============================================================

class PriestListCreateView(generics.ListCreateAPIView):

    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = PriestSerializer

    def get_queryset(self):
        return Priest.objects.filter(
            church=self.request.user.church
        ).order_by("-date_from", "name")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    @transaction.atomic
    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)
        reseal_vicar_windows(self.request.user.church)


class PriestDetailView(generics.RetrieveUpdateDestroyAPIView):

    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = PriestSerializer

    def get_queryset(self):
        return Priest.objects.filter(
            church=self.request.user.church
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    @transaction.atomic
    def perform_update(self, serializer):
        serializer.save()
        reseal_vicar_windows(self.request.user.church)

    @transaction.atomic
    def perform_destroy(self, instance):
        church = instance.church
        instance.delete()
        reseal_vicar_windows(church)

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
    """
    Create a new death registration.

    Date rules:
    - Only ONE rule applies: funeral_on must be >= died_on.
    - No upper bound on funeral date.
    - No future-date restriction (retroactive entry allowed).
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request):
        member_id = request.data.get("member")

        if not member_id:
            return Response(
                {"error": "member is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            member = Member.objects.get(
                pk=member_id,
                church=request.user.church,
            )
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ---------------------------------------------------------
        # Already deceased / already registered
        # ---------------------------------------------------------
        if member.expired:
            return Response(
                {"error": "Member is already marked as deceased."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if DeathRegister.objects.filter(member=member).exists():
            return Response(
                {"error": "Death record already exists for this member."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ---------------------------------------------------------
        # Required fields
        # ---------------------------------------------------------
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
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ---------------------------------------------------------
        # Tomb fee belongs to this church
        # ---------------------------------------------------------
        try:
            tomb_fee = TombFee.objects.get(
                id=request.data.get("tomb_fee"),
                church=request.user.church,
            )
        except TombFee.DoesNotExist:
            return Response(
                {"error": "Selected tomb fee does not belong to this church."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Parse dates
            died_on = parse_date(request.data.get("died_on"))
            funeral_on = parse_date(request.data.get("funeral_on"))

            if not died_on or not funeral_on:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ---------------------------------------------------------
            # SINGLE RULE: funeral cannot be before death.
            # No upper bound. No future-date restriction.
            # ---------------------------------------------------------
            if funeral_on < died_on:
                return Response(
                    {
                        "funeral_on": [
                            "Funeral date cannot be before the date of death."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ---------------------------------------------------------
            # Create death record
            # ---------------------------------------------------------
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
                # ✅ REMOVED: is_active=True, (so inactive heads don't throw 404)
                expired=False
            )
        except Member.DoesNotExist:
            raise NotFound("Family head not found.")

        return Member.objects.filter(
            church=church,
            family=head.family,
            house_name__iexact=head.house_name,
            house_sequence=head.house_sequence,
            expired=False
        ).exclude(
            pk=head.id
        ).select_related(
            "family", "relationship", "ward", "grade"
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

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["church"] = self.request.user.church
        return ctx

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class AccountLedgerMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = AccountLedgerMasterSerializer

    def get_queryset(self):
        return AccountLedgerMaster.objects.filter(church=self.request.user.church)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["church"] = self.request.user.church
        return ctx


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
from datetime import datetime, timedelta

class LedgerEntryListAPIView(ListAPIView):
    """
    List ledger entries with optional filters:

      ?ledger=<id>
      ?book=cash | bank
      ?from=YYYY-MM-DD
      ?to=YYYY-MM-DD
      ?include_cancelled=true

    Adds a `running_balance` field to each row.
    """
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = LedgerEntrySerializer

    # ✅ Only the real cash/bank ledgers — no stale "Closing -"
    CASH_LEDGERS = ["Cash in Hand"]
    BANK_LEDGERS = [
        "Balance in Savings Account",
        "Balance in Deposit Account",
        "Balance in Other Accounts",
    ]
    CASH_BANK_GROUP = "I. Opening Balances"

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

        # ---------- book filter ----------
        book = (self.request.query_params.get("book") or "").lower().strip()

        if book == "cash":
            target = self.CASH_LEDGERS
        elif book == "bank":
            target = self.BANK_LEDGERS
        else:
            target = None

        if target:
            matching_entries = LedgerEntry.objects.filter(
                church=church,
                ledger__ledger_name__in=target,
                ledger__account_group__group_name=self.CASH_BANK_GROUP,
            )

            receipt_ids = matching_entries.exclude(
                receipt_id__isnull=True
            ).values_list('receipt_id', flat=True)
            payment_ids = matching_entries.exclude(
                payment_id__isnull=True
            ).values_list('payment_id', flat=True)
            contra_ids = matching_entries.exclude(
                contra_id__isnull=True
            ).values_list('contra_id', flat=True)

            qs = qs.filter(
                Q(receipt_id__in=receipt_ids)
                | Q(payment_id__in=payment_ids)
                | Q(contra_id__in=contra_ids)
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
            qs = qs.filter(is_cancelled=False, is_reversal=False)

        return qs.order_by("entry_date", "id")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        running_map = self._compute_running_balances(queryset)

        opening = 0.0
        total_debit = 0.0
        total_credit = 0.0
        closing = 0.0

        ledger_id = self.request.query_params.get("ledger")
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")

        if ledger_id:
            # ============ SINGLE LEDGER MODE ============
            try:
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

                nature = (ledger.ledger_nature or "ASSET").upper()
                if nature in ("ASSET", "EXPENSE"):
                    closing = opening + total_debit - total_credit
                else:
                    closing = opening + total_credit - total_debit
            except Exception:
                pass
        else:
            # ============ MULTI-LEDGER MODE ============
            # ✅ Scope the opening/closing to the requested book.
            #    - book="cash"  → only Cash in Hand
            #    - book="bank"  → only the three bank ledgers
            #    - no book       → all four (Day Book / combined view)
            book_param = (self.request.query_params.get("book") or "").lower().strip()

            if book_param == "cash":
                scoped_ledgers = self.CASH_LEDGERS
            elif book_param == "bank":
                scoped_ledgers = self.BANK_LEDGERS
            else:
                scoped_ledgers = self.CASH_LEDGERS + self.BANK_LEDGERS

            ledger_opening_total = sum(
                float(l.op_balance or 0)
                for l in AccountLedgerMaster.objects.filter(
                    church=request.user.church,
                    ledger_name__in=scoped_ledgers,
                    account_group__group_name=self.CASH_BANK_GROUP,
                )
            )

            def get_book_balance(as_of_date):
                if not as_of_date:
                    return ledger_opening_total

                agg = LedgerEntry.objects.filter(
                    church=request.user.church,
                    ledger__ledger_name__in=scoped_ledgers,
                    ledger__account_group__group_name=self.CASH_BANK_GROUP,
                    entry_date__lte=as_of_date,
                    is_cancelled=False,
                    is_reversal=False,
                ).aggregate(
                    debits=Sum("amount", filter=Q(entry_type="DEBIT")),
                    credits=Sum("amount", filter=Q(entry_type="CREDIT")),
                )

                debits = float(agg["debits"] or 0)
                credits = float(agg["credits"] or 0)
                return ledger_opening_total + debits - credits

            if date_from:
                try:
                    dt_from = datetime.strptime(date_from, "%Y-%m-%d").date()
                    day_before = dt_from - timedelta(days=1)
                    opening = get_book_balance(day_before)
                except (ValueError, TypeError):
                    opening = ledger_opening_total
            else:
                opening = ledger_opening_total

            closing = get_book_balance(date_to or datetime.now().date())

            agg = queryset.aggregate(
                debits=Sum("amount", filter=Q(entry_type="DEBIT")),
                credits=Sum("amount", filter=Q(entry_type="CREDIT")),
            )
            total_debit = float(agg["debits"] or 0)
            total_credit = float(agg["credits"] or 0)

        serializer = self.get_serializer(
            queryset,
            many=True,
            context={
                **self.get_serializer_context(),
                "running_balance_context": running_map,
            },
        )

        data = list(serializer.data)
        data.reverse()

        return Response({
            "count": len(data),
            "opening_balance": round(opening, 2),
            "total_debit": round(total_debit, 2),
            "total_credit": round(total_credit, 2),
            "closing_balance": round(closing, 2),
            "results": data,
        })

    def _compute_running_balances(self, queryset):
        from collections import defaultdict

        balances = defaultdict(lambda: None)
        ledger_ids = {e.ledger_id for e in queryset}

        ledgers = {
            l.id: l
            for l in AccountLedgerMaster.objects.filter(id__in=ledger_ids)
        }
        openings = {lid: float(l.op_balance or 0) for lid, l in ledgers.items()}
        natures = {
            lid: (l.ledger_nature or "ASSET").upper()
            for lid, l in ledgers.items()
        }

        result = {}
        for entry in queryset:
            lid = entry.ledger_id
            if balances[lid] is None:
                balances[lid] = openings.get(lid, 0.0)

            amt = float(entry.amount or 0)
            nature = natures.get(lid, "ASSET")

            if nature in ("ASSET", "EXPENSE"):
                delta = amt if entry.entry_type == "DEBIT" else -amt
            else:
                delta = amt if entry.entry_type == "CREDIT" else -amt

            balances[lid] += delta
            result[entry.id] = round(balances[lid], 2)

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
            return Response({"detail": "member is required."}, status=400)

        try:
            member = Member.objects.get(id=member_id, church=church)
        except Member.DoesNotExist:
            return Response({"detail": "Member not found."}, status=404)

        # ----- Opening balance: all ReceiptLines for this member BEFORE date_from
        opening_qs = ReceiptLine.objects.filter(
            receipt__church=church,
            receipt__member=member,
            receipt__is_cancelled=False,
        )
        if date_from:
            opening_qs = opening_qs.filter(receipt__receipt_date__lt=date_from)

        # ✅ In a member account, payments (receipts) are CREDITS
        opening_credit = opening_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")

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
            amount = line.amount or Decimal("0")

            # ✅ Receipts are Credits to the member's account
            credit = amount
            debit = Decimal("0")
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

        # Opening + Credits - Debits
        closing = opening_credit + total_credit - total_debit

        return Response({
            "member": {
                "id": member.id,
                "name": member.name,
                "family_name": member.family.family_name if member.family else "",
            },
            "from": date_from,
            "to": date_to,
            "opening_balance": float(opening_credit),
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
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    INCOME_ROOTS = ["II. Revenue Receipts", "III. Inter Church / Unit Accounts"]
    EXPENSE_ROOTS = ["V. Inter Church / Unit Payments", "VI. Revenue Payments"]

    # Statutory adjustment ledgers — handled at the report level,
    # never summed into the tree.
    ADJUSTMENT_LEDGER_NAMES = (
        "Advance for next year",              # 2214 (LIABILITY)
        "Monthly Subscription Receivable",    # 2215 (ASSET)
    )

    def get(self, request):
        church = request.user.church
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        mode = (request.query_params.get("mode") or "Summary").lower()
        is_detailed = mode == "detailed"

        income = self._build_tree(
            church, self.INCOME_ROOTS, date_from, date_to, is_detailed, "INCOME"
        )
        expenditure = self._build_tree(
            church, self.EXPENSE_ROOTS, date_from, date_to, is_detailed, "EXPENSE"
        )

        # ✅ Statutory adjustment for Members Subscriptions
        sub_adj = self._subscription_adjustment(church, date_from, date_to)
        if sub_adj is not None and abs(sub_adj["net_delta"]) > 0.004:
            self._apply_subscription_adjustment(income, sub_adj)

        total_income = round(sum(g["amount"] for g in income), 2)
        total_expenditure = round(sum(g["amount"] for g in expenditure), 2)
        net = round(total_income - total_expenditure, 2)

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

    # =========================================================
    # SUBSCRIPTION ADJUSTMENT
    # =========================================================

    def _subscription_adjustment(self, church, date_from, date_to):
        from django.db.models import Sum, Q

        def _movement(ledger_name):
            qs = LedgerEntry.objects.filter(
                church=church,
                ledger__ledger_name=ledger_name,
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
            return float(agg["debits"] or 0), float(agg["credits"] or 0)

        d2214, c2214 = _movement("Advance for next year")
        d2215, c2215 = _movement("Monthly Subscription Receivable")

        # 2214: debits = earned this period, credits = un-earned
        # (advance received). Net income adjustment = d - c.
        adv_delta = d2214 - c2214

        # 2215: debits = billed this period (income earned but
        # not collected), credits = collection of prior billed.
        # Net income adjustment = d - c.
        rec_delta = d2215 - c2215

        net = adv_delta + rec_delta
        if abs(net) < 0.004:
            return None

        return {
            "advance_delta": round(adv_delta, 2),
            "receivable_delta": round(rec_delta, 2),
            "net_delta": round(net, 2),
        }

    def _apply_subscription_adjustment(self, income_tree, adj):
        def _walk(nodes):
            for node in nodes:
                if node.get("group_name") == "Members Subscriptions":
                    node["amount"] = round(
                        node["amount"] + adj["net_delta"], 2
                    )
                    node["subscription_adjustment"] = {
                        "advance_for_next_year": adj["advance_delta"],
                        "subscription_receivable": adj["receivable_delta"],
                        "net": adj["net_delta"],
                    }
                    return True
                if _walk(node.get("children", [])):
                    return True
            return False

        found = _walk(income_tree)

        if found:
            def _recompute(nodes):
                for node in nodes:
                    _recompute(node.get("children", []))
                    if node.get("children"):
                        node["amount"] = round(
                            sum(c["amount"] for c in node["children"]), 2
                        )
            _recompute(income_tree)

    # =========================================================
    # TREE BUILDERS
    # =========================================================

    def _build_tree(self, church, root_names, date_from, date_to, is_detailed, side):
        roots = AccountGroupMaster.objects.filter(
            church=church,
            group_name__in=root_names,
        ).order_by("group_name")

        result = []
        for root in roots:
            root_total = self._sum_group(church, root, date_from, date_to, side)
            result.append({
                "group_name": root.group_name,
                "amount": root_total,
                "children": self._build_children(
                    church, root, date_from, date_to, is_detailed, side
                ),
            })
        return result

    def _build_children(self, church, parent_group, date_from, date_to, is_detailed, side):
        children = AccountGroupMaster.objects.filter(
            church=church, under_group=parent_group,
        ).order_by("group_name")

        nodes = []
        for child in children:
            child_total = self._sum_group(church, child, date_from, date_to, side)
            node = {
                "group_name": child.group_name,
                "amount": child_total,
                "children": self._build_children(
                    church, child, date_from, date_to, is_detailed, side
                ),
            }
            if is_detailed and not node["children"]:
                node["ledgers"] = self._ledger_breakdown(
                    church, child, date_from, date_to, side
                )
            nodes.append(node)
        return nodes

    def _sum_group(self, church, group, date_from, date_to, side):
        from django.db.models import Sum, Q

        group_ids = [group.id]
        queue = [group]
        while queue:
            current = queue.pop()
            subs = AccountGroupMaster.objects.filter(
                church=church, under_group=current,
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
        # ✅ Exclude 2214 / 2215 — they are adjusted at the
        # report level, not summed into the tree.
        qs = qs.exclude(
            ledger__ledger_name__in=self.ADJUSTMENT_LEDGER_NAMES
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

        if side == "INCOME":
            return round(credits - debits, 2)
        return round(debits - credits, 2)

    def _ledger_breakdown(self, church, group, date_from, date_to, side):
        from django.db.models import Sum, Q

        ledgers = AccountLedgerMaster.objects.filter(
            church=church, account_group=group, status=True,
        ).exclude(
            ledger_name__in=self.ADJUSTMENT_LEDGER_NAMES
        ).order_by("ledger_name")

        out = []
        for led in ledgers:
            qs = LedgerEntry.objects.filter(
                church=church, ledger=led,
                is_cancelled=False, is_reversal=False,
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

            if side == "INCOME":
                amt = round(credits - debits, 2)
            else:
                amt = round(debits - credits, 2)

            if amt > 0:
                out.append({"ledger_name": led.ledger_name, "amount": amt})

        return out

# ============================================================
# REPORTS — DONATION REGISTER
# ============================================================

class DonationRegisterReportAPIView(APIView):
    """
    GET /api/registry/reports/donation-register/?from=&to=&member_id=&ledger_id=&mode=&sort=
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church

        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        member_id = request.query_params.get("member_id")
        ledger_id = request.query_params.get("ledger_id")
        mode = request.query_params.get("mode")
        sort = request.query_params.get("sort") or "Newest First"

        # ------ find donation group IDs (recursively) ------
        # Dynamically find groups with "Donation" or "Offering" in the name
        donation_root_ids = list(
            AccountGroupMaster.objects.filter(
                church=church,
                group_name__icontains="donation",
            ).values_list("id", flat=True)
        ) + list(
            AccountGroupMaster.objects.filter(
                church=church,
                group_name__icontains="offering",
            ).values_list("id", flat=True)
        )

        if not donation_root_ids:
            return Response({
                "from": date_from,
                "to": date_to,
                "rows": [],
                "total": 0,
            })

        all_group_ids = list(set(donation_root_ids))
        queue = list(set(donation_root_ids))

        while queue:
            gid = queue.pop()
            subs = AccountGroupMaster.objects.filter(
                church=church, under_group_id=gid
            ).values_list("id", flat=True)
            for s in subs:
                if s not in all_group_ids:
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
            
        # ✅ Correct mode filtering (Cash vs Bank)
        if mode:
            if mode == "CASH":
                qs = qs.filter(receipt__payment_type="CASH")
            else:
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


# ============================================================
# SUBSCRIPTION HELPERS (Replace existing with this)
# ============================================================
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
            yearly_due = Decimal("0")
            charity_due = Decimal("0")
            diocese_due = Decimal("0")

            for s in subs:
                if not s.ledger:
                    continue

                # Prorate yearly subscriptions
                base_amount = Decimal(str(s.amount or 0))
                if s.billing_cycle == "YEARLY":
                    expected = base_amount / Decimal("12")
                else:
                    expected = base_amount

                paid = Decimal(str(
                    _get_paid_amount(
                        church, member, s.ledger, month_start, month_end
                    )
                ))
                remaining = max(Decimal("0"), expected - paid)

                # Classify by ledger group / name
                ledger_group = (s.ledger.account_group.group_name or "").lower()
                ledger_name = (s.ledger.ledger_name or "").lower()

                is_charity = (
                    "charity" in ledger_group
                    or "charity" in ledger_name
                    or "poor fund" in ledger_group
                    or "poor fund" in ledger_name
                    or "medical" in ledger_group
                    or "medical" in ledger_name
                    or "education" in ledger_group
                    or "education" in ledger_name
                )

                is_diocese = (
                    "diocese" in ledger_group
                    or "diocese" in ledger_name
                    or "diocesan" in ledger_group
                    or "diocesan" in ledger_name
                )

                if is_charity:
                    charity_due += remaining
                elif is_diocese:
                    diocese_due += remaining
                else:
                    if s.billing_cycle == "YEARLY":
                        yearly_due += remaining
                    else:
                        monthly_due += remaining

            total_due = monthly_due + yearly_due + charity_due + diocese_due
            if total_due <= 0:
                continue

            first_sub = subs[0] if subs else None
            billing_cycle = first_sub.billing_cycle if first_sub else "MONTHLY"

            ward_name = member.ward.ward_name if member.ward else "Unassigned"
            family_name = member.family.family_name if member.family else ""

            bucket = wards_map.setdefault(ward_name, {
                "ward": ward_name, "members": [], "_total": Decimal("0"),
            })

            bucket["members"].append({
                "member_id": member.id,
                "name": member.name,
                "family_name": family_name,
                "house_name": member.house_name,
                "monthly_subscription": float(monthly_due),
                "yearly_subscription": float(yearly_due),
                "charity_fund": float(charity_due),
                "diocese_fund": float(diocese_due),
                "total_due": float(total_due),
                "billing_cycle": billing_cycle,
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
        subs_by_grade = _subscriptions_by_grade(church)

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
            lgroup = (line.ledger.account_group.group_name or "").lower()

            is_subscription = (
                "subscription" in lname or "subscription" in lgroup
            )
            is_charity = (
                "charity" in lname or "charity" in lgroup
                or "poor fund" in lname or "poor fund" in lgroup
                or "medical" in lname or "medical" in lgroup
                or "education" in lname or "education" in lgroup
            )
            is_diocese = (
                "diocese" in lname or "diocese" in lgroup
                or "diocesan" in lname or "diocesan" in lgroup
            )

            if not (is_subscription or is_charity or is_diocese):
                continue

            ward_name = member.ward.ward_name if member.ward else "Unassigned"
            family_name = member.family.family_name if member.family else ""

            bucket = wards_map.setdefault(ward_name, {
                "ward": ward_name, "by_member": {}, "_total": Decimal("0"),
            })

            mkey = member.id
            if mkey not in bucket["by_member"]:
                subs = subs_by_grade.get(member.grade_id, [])
                first_sub = subs[0] if subs else None
                billing_cycle = first_sub.billing_cycle if first_sub else "MONTHLY"

                bucket["by_member"][mkey] = {
                    "member_id": member.id,
                    "name": member.name,
                    "family_name": family_name,
                    "house_name": member.house_name,
                    "monthly_subscription": Decimal("0"),
                    "yearly_subscription": Decimal("0"),
                    "charity_fund": Decimal("0"),
                    "diocese_fund": Decimal("0"),
                    "total_paid": Decimal("0"),
                    "billing_cycle": billing_cycle,
                }

            m = bucket["by_member"][mkey]
            amt = Decimal(str(line.amount or 0))

            if is_charity:
                m["charity_fund"] += amt
            elif is_diocese:
                m["diocese_fund"] += amt
            else:
                if m["billing_cycle"] == "YEARLY":
                    m["yearly_subscription"] += amt
                else:
                    m["monthly_subscription"] += amt

            m["total_paid"] += amt
            bucket["_total"] += amt

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
                    "house_name": m["house_name"],
                    "monthly_subscription": float(m["monthly_subscription"]),
                    "yearly_subscription": float(m["yearly_subscription"]),
                    "charity_fund": float(m["charity_fund"]),
                    "diocese_fund": float(m["diocese_fund"]),
                    "total_paid": float(m["total_paid"]),
                    "billing_cycle": m["billing_cycle"],
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
    
# registry/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsChurchUser
from datetime import date
from .models import ReceiptLine, PaymentMaster

class ReceiptPaymentCombinedAPIView(APIView):
    """
    Receipt & Payment Summary.

    Two things are reported side-by-side:

      1. CASH  — "Cash in Hand"                    (per-side opening/closing/flow)
      2. BANK  — the three Balance-in-* ledgers    (per-side opening/closing/flow)

    Reconciliation is done against LEDGER TRUTH, not against Receipt/Payment
    rows, because cash/bank can also move via:
      - ContraMaster            (Cash↔Bank, Bank→Bank)
      - BankAccount opening_balance entries    (Dr Bank / Cr Equity)
      - Any manual LedgerEntry posting to a cash/bank ledger

    `is_balanced` therefore means:
        opening_balance + ledger_debits − ledger_credits == closing_balance
    which is the accounting identity that actually holds.
    """
    permission_classes = [IsAuthenticated, IsChurchUser]

    CASH_LEDGERS = ["Cash in Hand"]
    BANK_LEDGERS = [
        "Balance in Savings Account",
        "Balance in Deposit Account",
        "Balance in Other Accounts",
    ]
    CASH_BANK_GROUP = "I. Opening Balances"

    # ------------------------------------------------------------------
    # ENTRY POINT
    # ------------------------------------------------------------------

    def get(self, request):
        church = request.user.church

        date_from = self._parse_date(request.query_params.get("from"))
        date_to = self._parse_date(request.query_params.get("to"))

        if not date_from:
            date_from = date.today().replace(day=1)
        if not date_to:
            date_to = date.today()

        if date_to < date_from:
            return Response(
                {"detail": "`to` cannot be earlier than `from`."},
                status=400,
            )

        # --------------------------------------------------------------
        # 0. OPENING / CLOSING — SEPARATED BY SIDE
        # --------------------------------------------------------------
        opening_cash = self._side_balance(
            church, self.CASH_LEDGERS, date_from, inclusive=False
        )
        opening_bank = self._side_balance(
            church, self.BANK_LEDGERS, date_from, inclusive=False
        )

        closing_cash = self._side_balance(
            church, self.CASH_LEDGERS, date_to, inclusive=True
        )
        closing_bank = self._side_balance(
            church, self.BANK_LEDGERS, date_to, inclusive=True
        )

        opening_balance = round(opening_cash + opening_bank, 2)
        closing_balance = round(closing_cash + closing_bank, 2)

        # --------------------------------------------------------------
        # 1. RECEIPT DETAIL (INCOME ledgers only)
        # --------------------------------------------------------------
        receipts_data, total_income = self._build_receipt_tree(
            church, date_from, date_to
        )

        # --------------------------------------------------------------
        # 2. PAYMENT DETAIL (Expense/Asset/Liability ledgers only)
        # --------------------------------------------------------------
        payments_data, total_expense = self._build_payment_tree(
            church, date_from, date_to
        )

        # --------------------------------------------------------------
        # 3. PER-SIDE MOVEMENTS
        #    cash side and bank side flows must each reconcile independently
        # --------------------------------------------------------------
        cash_dr, cash_cr = self._ledger_movement(
            church, self.CASH_LEDGERS, date_from, date_to
        )
        bank_dr, bank_cr = self._ledger_movement(
            church, self.BANK_LEDGERS, date_from, date_to
        )

        # Split receipt/payment/contra by payment_type so the PDF can
        # show "Cash receipts: X, Bank receipts: Y".
        cash_receipts, bank_receipts = self._receipt_side_totals(
            church, date_from, date_to
        )
        cash_payments, bank_payments = self._payment_side_totals(
            church, date_from, date_to
        )
        cash_contra_net, bank_contra_net = self._contra_side_deltas(
            church, date_from, date_to
        )

        # --------------------------------------------------------------
        # 4. RECONCILIATION — LEDGER TRUTH
        # --------------------------------------------------------------
        expected_closing = round(
            opening_balance + (cash_dr + bank_dr) - (cash_cr + bank_cr), 2
        )
        is_balanced = abs(expected_closing - closing_balance) < 0.01

        # --------------------------------------------------------------
        # 5. RESPONSE
        # --------------------------------------------------------------
        return Response({
            "from": date_from.isoformat(),
            "to": date_to.isoformat(),
            "receipts": receipts_data,
            "payments": payments_data,
            "summary": {
                # ---- existing fields (kept for compatibility) ----
                "opening_balance": opening_balance,
                "opening_cash": opening_cash,
                "opening_bank": opening_bank,
                "total_income": total_income,
                "total_receipts": round(opening_balance + total_income, 2),
                "total_expense": total_expense,
                "closing_balance": closing_balance,
                "closing_cash": closing_cash,
                "closing_bank": closing_bank,
                "total_payments": round(total_expense + closing_balance, 2),
                "is_balanced": is_balanced,

                # ---- NEW: per-side movement breakdown ----
                "cash_flow": {
                    "opening": opening_cash,
                    "receipts": cash_receipts,
                    "payments": cash_payments,
                    "contra_net": cash_contra_net,
                    "ledger_debits": round(cash_dr, 2),
                    "ledger_credits": round(cash_cr, 2),
                    "closing": closing_cash,
                },
                "bank_flow": {
                    "opening": opening_bank,
                    "receipts": bank_receipts,
                    "payments": bank_payments,
                    "contra_net": bank_contra_net,
                    "ledger_debits": round(bank_dr, 2),
                    "ledger_credits": round(bank_cr, 2),
                    "closing": closing_bank,
                },

                # ---- NEW: reconciliation diagnostics ----
                "expected_closing": expected_closing,
                "reconciliation_gap": round(
                    closing_balance - expected_closing, 2
                ),
            },
        })

    # ==================================================================
    # BALANCE — SIDE-AWARE (nature-correct)
    # ==================================================================

    def _side_balance(self, church, target_ledgers, as_of_date, inclusive):
        """
        Sum opening balance + nature-aware movements for every ledger in
        `target_ledgers` that belongs to CASH_BANK_GROUP.

        ASSET / EXPENSE : opening + debits − credits
        LIABILITY / INCOME / EQUITY : opening + credits − debits

        `inclusive=True`  → entries with entry_date <= as_of_date
        `inclusive=False` → entries with entry_date <  as_of_date
        """
        ledgers = AccountLedgerMaster.objects.filter(
            church=church,
            ledger_name__in=target_ledgers,
            account_group__group_name=self.CASH_BANK_GROUP,
        )

        date_filter = (
            Q(entries__entry_date__lte=as_of_date)
            if inclusive
            else Q(entries__entry_date__lt=as_of_date)
        )

        total = 0.0
        for ledger in ledgers:
            nature = (ledger.ledger_nature or "ASSET").upper()
            agg = ledger.entries.filter(
                is_cancelled=False,
                is_reversal=False,
            ).filter(
                Q(entry_date__lte=as_of_date)
                if inclusive
                else Q(entry_date__lt=as_of_date)
            ).aggregate(
                debits=Sum("amount", filter=Q(entry_type="DEBIT")),
                credits=Sum("amount", filter=Q(entry_type="CREDIT")),
            )
            dr = float(agg["debits"] or 0)
            cr = float(agg["credits"] or 0)
            op = float(ledger.op_balance or 0)

            if nature in ("ASSET", "EXPENSE"):
                total += op + dr - cr
            else:
                total += op + cr - dr

        return round(total, 2)

    # ==================================================================
    # MOVEMENTS — for reconciliation
    # ==================================================================

    def _ledger_movement(self, church, target_ledgers, date_from, date_to):
        """Raw DEBIT / CREDIT totals inside the range, on the given ledgers."""
        qs = LedgerEntry.objects.filter(
            church=church,
            ledger__ledger_name__in=target_ledgers,
            ledger__account_group__group_name=self.CASH_BANK_GROUP,
            entry_date__gte=date_from,
            entry_date__lte=date_to,
            is_cancelled=False,
            is_reversal=False,
        )
        agg = qs.aggregate(
            debits=Sum("amount", filter=Q(entry_type="DEBIT")),
            credits=Sum("amount", filter=Q(entry_type="CREDIT")),
        )
        return float(agg["debits"] or 0), float(agg["credits"] or 0)

    def _receipt_side_totals(self, church, date_from, date_to):
        """How much of `total_income` came in via cash vs bank."""
        qs = ReceiptLine.objects.filter(
            receipt__church=church,
            receipt__is_cancelled=False,
            receipt__receipt_date__gte=date_from,
            receipt__receipt_date__lte=date_to,
            ledger__ledger_nature="INCOME",
        )
        cash = qs.filter(receipt__payment_type="CASH").aggregate(
            t=Sum("amount")
        )["t"] or 0
        bank = qs.exclude(receipt__payment_type="CASH").aggregate(
            t=Sum("amount")
        )["t"] or 0
        return float(cash), float(bank)

    def _payment_side_totals(self, church, date_from, date_to):
        """How much of `total_expense` went out via cash vs bank."""
        qs = PaymentMaster.objects.filter(
            church=church,
            is_cancelled=False,
            payment_date__gte=date_from,
            payment_date__lte=date_to,
            account_ledger__ledger_nature__in=("EXPENSE", "ASSET", "LIABILITY"),
        )
        cash = qs.filter(payment_type="CASH").aggregate(
            t=Sum("amount")
        )["t"] or 0
        bank = qs.filter(payment_type="BANK").aggregate(
            t=Sum("amount")
        )["t"] or 0
        return float(cash), float(bank)

    def _contra_side_deltas(self, church, date_from, date_to):
        """
        Contra nets to zero across cash+bank combined. But it moves
        money BETWEEN the two sides. Return the delta applied to the
        cash side and the bank side:

          contra DEBIT  side  → +delta
          contra CREDIT side  → -delta
        """
        from django.db.models import Q as _Q
        qs = ContraMaster.objects.filter(
            church=church,
            is_cancelled=False,
            contra_date__gte=date_from,
            contra_date__lte=date_to,
        ).prefetch_related("from_ledger", "to_ledger")

        cash = 0.0
        bank = 0.0
        for c in qs:
            amt = float(c.amount or 0)
            if c.to_ledger and c.to_ledger.ledger_name in self.CASH_LEDGERS:
                cash += amt
            if c.to_ledger and c.to_ledger.ledger_name in self.BANK_LEDGERS:
                bank += amt
            if c.from_ledger and c.from_ledger.ledger_name in self.CASH_LEDGERS:
                cash -= amt
            if c.from_ledger and c.from_ledger.ledger_name in self.BANK_LEDGERS:
                bank -= amt

        return round(cash, 2), round(bank, 2)

    # ==================================================================
    # RECEIPT TREE
    # ==================================================================

    def _build_receipt_tree(self, church, date_from, date_to):
        """
        Returns (receipts_data, total_income). Ledger natures restricted
        to INCOME so legacy / manual rows on ASSET/LIABILITY ledgers
        cannot inflate the report.
        """
        lines = (
            ReceiptLine.objects
            .filter(
                receipt__church=church,
                receipt__is_cancelled=False,
                receipt__receipt_date__gte=date_from,
                receipt__receipt_date__lte=date_to,
                ledger__ledger_nature="INCOME",
            )
            .select_related(
                "ledger",
                "ledger__account_group",
                "ledger__account_group__under_group",
            )
        )

        groups = {}
        total = 0.0

        for line in lines:
            if not line.ledger or not line.ledger.account_group:
                continue

            amount = float(line.amount or 0)
            total += amount

            self._add_to_tree(
                groups, line.ledger, amount
            )

        return self._finalize_tree(groups), round(total, 2)

    # ==================================================================
    # PAYMENT TREE
    # ==================================================================

    def _build_payment_tree(self, church, date_from, date_to):
        """
        Returns (payments_data, total_expense). Ledger natures restricted
        to EXPENSE / ASSET / LIABILITY (mirrors PaymentMasterSerializer).
        """
        payments = (
            PaymentMaster.objects
            .filter(
                church=church,
                is_cancelled=False,
                payment_date__gte=date_from,
                payment_date__lte=date_to,
                account_ledger__ledger_nature__in=(
                    "EXPENSE", "ASSET", "LIABILITY",
                ),
            )
            .select_related(
                "account_ledger",
                "account_ledger__account_group",
                "account_ledger__account_group__under_group",
            )
        )

        groups = {}
        total = 0.0

        for p in payments:
            if not p.account_ledger or not p.account_ledger.account_group:
                continue

            amount = float(p.amount or 0)
            total += amount

            self._add_to_tree(groups, p.account_ledger, amount)

        return self._finalize_tree(groups), round(total, 2)

    # ==================================================================
    # SHARED TREE HELPERS
    # ==================================================================

    @staticmethod
    def _add_to_tree(groups, ledger, amount):
        group = ledger.account_group
        top_group = group
        while top_group.under_group:
            top_group = top_group.under_group

        parent_name = top_group.group_name
        sub_group_name = group.group_name if group != top_group else None

        parent = groups.setdefault(
            parent_name,
            {"name": parent_name, "amount": 0, "sub_groups": {}, "ledgers": {}},
        )
        parent["amount"] += amount

        if sub_group_name:
            sub = parent["sub_groups"].setdefault(
                sub_group_name,
                {"name": sub_group_name, "amount": 0, "ledgers": {}},
            )
            sub["amount"] += amount
            sub["ledgers"][ledger.ledger_name] = (
                sub["ledgers"].get(ledger.ledger_name, 0) + amount
            )
        else:
            parent["ledgers"][ledger.ledger_name] = (
                parent["ledgers"].get(ledger.ledger_name, 0) + amount
            )

    @staticmethod
    def _finalize_tree(groups):
        out = []
        for g in groups.values():
            sub_list = []
            for sg in g["sub_groups"].values():
                sg["ledgers"] = [
                    {"name": k, "amount": round(v, 2)}
                    for k, v in sg["ledgers"].items()
                ]
                sub_list.append(sg)
            g["sub_groups"] = sub_list
            g["ledgers"] = [
                {"name": k, "amount": round(v, 2)}
                for k, v in g["ledgers"].items()
            ]
            g["amount"] = round(g["amount"], 2)
            out.append(g)
        out.sort(key=lambda x: x["name"])
        return out

    # ==================================================================
    # UTIL
    # ==================================================================

    @staticmethod
    def _parse_date(value):
        if not value:
            return None
        if isinstance(value, date):
            return value
        try:
            return datetime.strptime(str(value), "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None
# --------------------------------------------------Dash Board------------------------------------------------
# registry/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsChurchUser
from django.utils import timezone
from datetime import date, timedelta
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
# Import all required models
from .models import (
    Member, ReceiptMaster, PaymentMaster, Baptism, Marriage, 
    DeathRegister, QurbanaReceipts, Events
)

class ChurchDashboardMetricsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church
        today = date.today()
        
        # Calculate dates for comparisons
        first_day_this_month = today.replace(day=1)
        first_day_last_month = (first_day_this_month - timedelta(days=1)).replace(day=1)
        first_day_this_year = today.replace(month=1, day=1)
        first_day_last_year = today.replace(year=today.year - 1, month=1, day=1)

        # ---------------------------------------------------------
        # 1. MEMBER STATS & GROWTH
        # ---------------------------------------------------------
        total_members = Member.objects.filter(church=church, is_active=True, expired=False).count()
        
        # Real Member Growth Percentage calculation
        this_month_members = Member.objects.filter(church=church, is_active=True, expired=False, created_at__date__gte=first_day_this_month).count()
        last_month_members = Member.objects.filter(church=church, is_active=True, expired=False, created_at__date__gte=first_day_last_month, created_at__date__lt=first_day_this_month).count()
        
        if last_month_members > 0:
            member_growth_pct = round(((this_month_members - last_month_members) / last_month_members) * 100, 1)
        else:
            member_growth_pct = 100.0 if this_month_members > 0 else 0.0

        # ---------------------------------------------------------
        # 2. FINANCIAL STATS (Receipts & Payments)
        # ---------------------------------------------------------
        monthly_receipts = ReceiptMaster.objects.filter(church=church, is_cancelled=False, receipt_date__gte=first_day_this_month).aggregate(t=Sum('grand_total'))['t'] or 0
        yearly_receipts = ReceiptMaster.objects.filter(church=church, is_cancelled=False, receipt_date__gte=first_day_this_year).aggregate(t=Sum('grand_total'))['t'] or 0
        
        monthly_payments = PaymentMaster.objects.filter(church=church, is_cancelled=False, payment_date__gte=first_day_this_month).aggregate(t=Sum('amount'))['t'] or 0
        yearly_payments = PaymentMaster.objects.filter(church=church, is_cancelled=False, payment_date__gte=first_day_this_year).aggregate(t=Sum('amount'))['t'] or 0

        # ---------------------------------------------------------
        # 3. SACRAMENTS (Baptism, Qurbana, Marriage, Death)
        # ---------------------------------------------------------
        baptisms = Baptism.objects.filter(church=church).count()
        qurbana = QurbanaReceipts.objects.filter(church=church).count() # Fixed: Using actual QurbanaReceipts model
        marriages = Marriage.objects.filter(church=church).count()
        deaths = DeathRegister.objects.filter(church=church).count()
        total_sacraments = baptisms + qurbana + marriages + deaths

        # ---------------------------------------------------------
        # 4. RECENT ACTIVITIES
        # ---------------------------------------------------------
        recent_receipts = ReceiptMaster.objects.filter(church=church, is_cancelled=False).order_by('-created_at')[:3]
        recent_payments = PaymentMaster.objects.filter(church=church, is_cancelled=False).order_by('-created_at')[:2]
        
        activities = []
        for r in recent_receipts:
            activities.append({
                "id": f"rec-{r.id}",
                "type": "RECEIPT",
                "title": "Donation received",
                "description": f"₹{r.grand_total} from {r.member.name if r.member else 'Anonymous'}",
                "time": r.created_at.strftime("%b %d, %I:%M %p")
            })
        for p in recent_payments:
            activities.append({
                "id": f"pay-{p.id}",
                "type": "PAYMENT",
                "title": "Payment made",
                "description": f"₹{p.amount} to {p.party_name}",
                "time": p.created_at.strftime("%b %d, %I:%M %p")
            })
        
        # Sort combined activities by date
        activities = sorted(activities, key=lambda x: x['time'], reverse=True)[:5]

        # ---------------------------------------------------------
        # 5. CHART DATA (Member Growth & Weekly Receipts)
        # ---------------------------------------------------------
        # Member Growth Chart (Last 30 Days)
        thirty_days_ago = today - timedelta(days=30)
        members_by_date = Member.objects.filter(
            church=church, 
            is_active=True, 
            expired=False,
            created_at__date__gte=thirty_days_ago
        ).annotate(date=TruncDate('created_at')).values('date').annotate(count=Count('id')).order_by('date')
        
        member_chart_data = [
            {"name": m['date'].strftime("%b %d"), "members": m['count']} 
            for m in members_by_date
        ]

        # Financial Chart (Last 4 Weeks of Receipts)
        financial_chart_data = []
        for i in range(4):
            week_start = today - timedelta(days=(7 * (4 - i)))
            week_end = week_start + timedelta(days=6)
            
            week_receipts = ReceiptMaster.objects.filter(
                church=church, is_cancelled=False, 
                receipt_date__range=[week_start, week_end]
            ).aggregate(t=Sum('grand_total'))['t'] or 0
            
            financial_chart_data.append({
                "name": f"Week {i+1}",
                "amount": float(week_receipts)
            })

        chart_data = {
            "member_chart": member_chart_data,
            "financial_chart": financial_chart_data
        }

        # ---------------------------------------------------------
        # 6. UPCOMING EVENTS
        # ---------------------------------------------------------
        # Fetch real events from the database instead of mocked data
        upcoming_events_qs = Events.objects.filter(church=church).order_by('-created_at')[:4]
        events = []
        for ev in upcoming_events_qs:
            events.append({
                "id": ev.id,
                "day": ev.created_at.strftime("%d"),
                "month": ev.created_at.strftime("%b").upper(),
                "title": ev.name,
                "location": "Church", # If you add a location field to Events model, replace this
                "time": ev.created_at.strftime("%I:%M %p")
            })

        return Response({
            "metrics": {
                "total_members": total_members,
                "member_growth_pct": member_growth_pct,
                "monthly_receipts": monthly_receipts,
                "yearly_receipts": yearly_receipts,
                "monthly_payments": monthly_payments,
                "yearly_payments": yearly_payments,
                "net_balance": monthly_receipts - monthly_payments,
                "pending_receipts": 0, # Replace with real logic if you have a pending Receipts concept
            },
            "sacraments": {
                "total": total_sacraments,
                "baptism": baptisms,
                "qurbana": qurbana,
                "marriage": marriages,
                "death": deaths,
            },
            "activities": activities,
            "chart_data": chart_data,
            "events": events,
        })

# ----------------------------------------------------Contra--------------------------------------------------------------------


class ContraMasterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = ContraMasterSerializer

    def get_queryset(self):
        qs = (
            ContraMaster.objects
            .filter(church=self.request.user.church)
            .select_related("from_ledger", "to_ledger", "from_bank_account", "to_bank_account")
            .order_by("-contra_date", "-id")
        )

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(voucher_number__icontains=search) |
                Q(narration__icontains=search)
            )

        date_from = self.request.query_params.get("from")
        if date_from:
            qs = qs.filter(contra_date__gte=date_from)

        date_to = self.request.query_params.get("to")
        if date_to:
            qs = qs.filter(contra_date__lte=date_to)

        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["church"] = self.request.user.church
        return ctx

    @transaction.atomic
    def perform_create(self, serializer):
        contra = serializer.save(church=self.request.user.church)
        contra.post_to_ledger()


class ContraMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = ContraMasterSerializer

    def get_queryset(self):
        return ContraMaster.objects.filter(church=self.request.user.church)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["church"] = self.request.user.church
        return ctx

    @transaction.atomic
    def perform_update(self, serializer):
        contra = serializer.save()
        if any(k in serializer.validated_data for k in
               ("amount", "from_ledger", "to_ledger", "contra_date")):
            contra.reverse_ledger_entry()
            contra.post_to_ledger()


class ContraCancelAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):
        try:
            contra = ContraMaster.objects.get(pk=pk, church=request.user.church)
        except ContraMaster.DoesNotExist:
            return Response({"detail": "Contra voucher not found."},
                            status=status.HTTP_404_NOT_FOUND)

        if contra.is_cancelled:
            return Response({"detail": "Already cancelled."},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = ContraCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            contra.is_cancelled = True
            contra.cancel_reason = serializer.validated_data["cancel_reason"]
            contra.cancel_remarks = serializer.validated_data["cancel_remarks"]
            contra.cancelled_at = timezone.now()
            contra.save(update_fields=[
                "is_cancelled", "cancel_reason", "cancel_remarks",
                "cancelled_at", "updated_at",
            ])
            contra.reverse_ledger_entry()

        return Response({
            "detail": "Contra cancelled successfully.",
            "contra_id": contra.id,
            "voucher_number": contra.voucher_number,
        })

# --------------------------------------Balance sheet-------------------------------------------------

# ============================================================
# REPORTS — BALANCE SHEET
# ============================================================

class BalanceSheetAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get(self, request):
        church = request.user.church
        date_to = request.query_params.get("to")

        ledgers = AccountLedgerMaster.objects.filter(
            church=church, status=True
        ).select_related("account_group", "account_group__under_group")

        assets = []
        liabilities = []
        
        total_income = 0.0
        total_expense = 0.0

        total_assets = 0.0
        total_liabilities = 0.0

        for ledger in ledgers:
            group = ledger.account_group
            nature = (ledger.ledger_nature or "").upper()
            balance = ledger.get_current_balance()

            if abs(balance) < 0.01:
                continue

            item = {
                "id": ledger.id,
                "name": ledger.ledger_name,
                "group": group.group_name,
                "balance": float(balance),
            }

            if nature == "ASSET":
                assets.append(item)
                total_assets += balance
            elif nature in ("LIABILITY", "EQUITY"):
                liabilities.append(item)
                total_liabilities += balance
            elif nature == "INCOME":
                total_income += balance
            elif nature == "EXPENSE":
                total_expense += balance

        # ✅ Calculate Net Surplus (Income - Expenses)
        net_surplus = total_income - total_expense

        # Add the surplus to Equity (Liabilities side)
        if abs(net_surplus) >= 0.01:
            liabilities.append({
                "id": "surplus",
                "name": "Current Year Surplus (Income - Expense)",
                "group": "C. Reserve Fund",
                "balance": float(net_surplus)
            })
            total_liabilities += net_surplus

        return Response({
            "to": date_to,
            "assets": assets,
            "total_assets": round(total_assets, 2),
            "liabilities": liabilities,
            "total_liabilities": round(total_liabilities, 2),
            "difference": round(total_assets - total_liabilities, 2),
        })