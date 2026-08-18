from datetime import date
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    UpdateAPIView,
)
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsChurchAuthenticated,IsChurchUser, IsMemberUser
from accounts.utils import create_family_head_user
from registry.services import calculate_new_bill_amount, calculate_prorated_upgrade_amount, generate_folio_number, get_next_subscription_action, handle_member_death
from .models import Baptism, Bill, Church, DeathRegister, Designation, DheshaKuri, Diocese, Events, Grade, Marriage, Priest,  RegisterSetting, Relationship, TombFee, TombType, UpgradeRequest,  Ward, Family, Member, Package, Offering, VisitorMaster, Subscription, AccountGroupMaster, AccountLedgerMaster, PaymentMaster, QurbanaReceipts, CommitteeMaster, CommitteeMember
from .serializers import BaptismSerializer, BillDetailSerializer, BillListSerializer, ChurchDetailSerializer,MemberDetailSerializer, ChurchListSerializer, DeathRegisterSerializer, DesignationSerializer, DheshaKuriSerializer, DioceseSerializer, EventSerializer, FamilyHeadCreateSerializer, FamilyHeadUpdateSerializer, FamilyMemberSerializer, GradeSerializer, InactiveMemberSerializer, MarriageCertificateSerializer, MarriageSerializer, MemberProfileSerializer, MobileFamilyBaptismSerializer, MobileFamilyDetailSerializer, MobileFamilyListSerializer, MobileFamilyMemberSerializer,  PriestNameSerializer,PriestSerializer, RegisterSettingSerializer, RelationshipSerializer, SubscriptionExpirySerializer, TombFeeSerializer, TombTypeSerializer, UpgradeSerializer,  WardSerializer, FamilySerializer, MemberSerializer,PackageSerializer, WardWithFamilyCountSerializer, OfferingSerializer, VisitorMasterSerializer, SubscriptionSerializer, AccountGroupMasterSerializer, AccountLedgerMasterSerializer, PaymentMasterSerializer, QurbanaReceiptsSerializer, CommitteeMasterSerializer, CommitteeMemberSerializer, MemberDirectorySerializer
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

class FamilyHeadCreateAPIView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsChurchUser,
    ]
    parser_classes = [MultiPartParser, FormParser]  # Add this

    @transaction.atomic
    def post(self, request):
        # Log incoming data for debugging
        print("=== REQUEST DATA ===")
        print("POST data:", request.data.dict() if hasattr(request.data, 'dict') else request.data)
        print("FILES:", request.FILES)
        
        serializer = FamilyHeadCreateSerializer(
            data=request.data,
            context={
                "church": request.user.church,
                "request": request
            }
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
            },
            status=status.HTTP_201_CREATED
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

        # Check if church already has a subscription
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

        # -------------------------
        # CREATE SUBSCRIPTION (No Trial)
        # -------------------------
        duration_months = 12 if billing_cycle == "YEARLY" else 1
        
        # Determine capacity
        if capacity:
            resolved_capacity = capacity
        else:
            resolved_capacity = package.member_limit

        # Create subscription
        subscription = ChurchSubscription.objects.create(
            church=church,
            package=package,
            billing_cycle=billing_cycle,
            duration_months=duration_months,
            custom_capacity=capacity if capacity else None,
            payment_status="UNPAID",
            is_active=False,
        )

        # Calculate amount
        if billing_cycle == "YEARLY":
            rate = package.rate_per_member_yearly
        else:
            rate = package.rate_per_member_monthly
        
        amount = resolved_capacity * rate * duration_months if resolved_capacity else rate * duration_months

        # Create bill
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
                    "calculation": (
                        f"{resolved_capacity} × "
                        f"{rate} × "
                        f"{duration_months}"
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
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        """
        Ensure baptism belongs to the logged-in user's church
        """
        return get_object_or_404(
            Baptism,
            pk=pk,
            church=request.user.church
        )

    # -------------------------
    # INTERNAL SAFETY CHECK
    # -------------------------
    def _block_if_member_exists(self, baptism, data):
        """
        Prevent dangerous updates once a Member is created
        """
        if baptism.member:
            blocked_fields = {
                "baptism_category",
                "family",
                "main_member",
                "relation_with_main_member",
            }

            attempted = blocked_fields.intersection(data.keys())
            if attempted:
                raise ValidationError(
                    f"Cannot modify {', '.join(attempted)} after member creation."
                )

    # -------------------------
    # FULL UPDATE
    # -------------------------
    def put(self, request, pk):
        baptism = self.get_object(request, pk)

        data = request.data.copy()
        data["church"] = request.user.church.id

        self._block_if_member_exists(baptism, data)

        serializer = BaptismSerializer(
            baptism,
            data=data
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # -------------------------
    # PARTIAL UPDATE
    # -------------------------
    def patch(self, request, pk):
        baptism = self.get_object(request, pk)

        data = request.data.copy()
        data["church"] = request.user.church.id

        self._block_if_member_exists(baptism, data)

        serializer = BaptismSerializer(
            baptism,
            data=data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # -------------------------
    # DELETE
    # -------------------------
    def delete(self, request, pk):
        baptism = self.get_object(request, pk)

        if baptism.member:
            raise ValidationError(
                "Cannot delete baptism record after member creation."
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
    permission_classes=[IsAuthenticated, IsChurchUser]

    def post(self, request):
        serializer = DeathRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member = serializer.validated_data.get("member")

        # 🔥 FIX: Get member from data if not in validated_data
        if not member:
            member_id = request.data.get("member")
            if member_id:
                try:
                    member = Member.objects.get(id=member_id, church=request.user.church)
                except Member.DoesNotExist:
                    return Response(
                        {"error": "Member not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {"error": "Member is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            death = DeathRegister.objects.get(
                member=member,
                status="PENDING"
            )
        except DeathRegister.DoesNotExist:
            return Response(
                {"error": "No pending death request found for this member."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # 🔥 FIX: Get dates from validated_data (they'll be date objects)
            died_on = serializer.validated_data.get("died_on")
            funeral_on = serializer.validated_data.get("funeral_on")
            
            # 🔥 FIX: If dates are None, try to get from request data and parse
            if not died_on and request.data.get("died_on"):
                died_on = parse_date(request.data.get("died_on"))
            if not funeral_on and request.data.get("funeral_on"):
                funeral_on = parse_date(request.data.get("funeral_on"))

            # Update the pending record
            death.died_on = died_on
            death.funeral_on = funeral_on
            death.tomb_type = serializer.validated_data.get("tomb_type")
            death.tomb_charge = serializer.validated_data.get("tomb_charge")
            death.tomb_idn = serializer.validated_data.get("tomb_idn", "")
            death.reason_of_death = serializer.validated_data.get("reason_of_death")
            death.remarks = serializer.validated_data.get("remarks", "")
            death.status = "COMPLETED"
            
            # 🔥 FIX: Save the death record (this will trigger reg_no generation)
            death.save()

            # Spouse widow logic
            if member.spouse:
                member.spouse.marital_status = "WIDOWED"
                member.spouse.save(update_fields=["marital_status"])

        return Response(
            DeathRegisterSerializer(death).data,
            status=status.HTTP_200_OK
        )
    
#promote to head

class PromoteFamilyHeadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):

        try:
            member = Member.objects.get(
                pk=pk,
                church=request.user.church
            )
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if member.expired:
            return Response(
                {"error": "Cannot promote expired member as head."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if member.is_family_head:
            return Response(
                {"error": "Member is already head."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not member.email:
            return Response(
                {"error": "Member must have an email to become family head."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔥 Match on the SAME household (family + house_name + sequence)
        existing_head = Member.objects.filter(
            family=member.family,
            house_name=member.house_name,
            house_sequence=member.house_sequence,
            is_family_head=True
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
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

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
                    "folio_number"
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
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "message": "Family head assigned successfully.",
                "member_id": member.id,
                "register_number": member.register_number,
                "folio_number": member.folio_number
            },
            status=status.HTTP_200_OK
        )


class TransferAndPromoteHeadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsChurchUser]

    def post(self, request, pk):
        try:
            member = Member.objects.get(pk=pk, church=request.user.church)
        except Member.DoesNotExist:
            return Response(
                {"error": "Member not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if member.is_family_head:
            return Response(
                {"error": "A family head cannot be transferred. Promote a replacement or mark them deceased first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_family_id = request.data.get("family")
        new_house_name = request.data.get("house_name")

        if not new_family_id or not new_house_name:
            return Response(
                {"error": "family and house_name are required to transfer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_family = Family.objects.get(pk=new_family_id, church=request.user.church)
        except Family.DoesNotExist:
            return Response(
                {"error": "Target family not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if member.expired:
            return Response(
                {"error": "Cannot transfer or promote an expired member."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not member.email:
            return Response(
                {"error": "Member must have an email to become family head."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cleaned_house_name = new_house_name.strip()

        try:
            with transaction.atomic():

                # 🔥 Always start a NEW household under this name — never join
                # an existing one, even if the name matches. Auto-assign the
                # next available sequence number for (family, house_name).
                last_sequence = Member.objects.filter(
                    family=new_family,
                    house_name__iexact=cleaned_house_name,
                ).order_by("-house_sequence").values_list("house_sequence", flat=True).first()

                next_sequence = (last_sequence or 0) + 1

                member.family = new_family
                member.house_name = cleaned_house_name
                member.house_sequence = next_sequence
                member.relationship = None

                if not member.register_number:
                    member.register_number = generate_register_number(member.church, "HEAD")
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
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "message": "Member transferred and promoted to head successfully.",
                "member_id": member.id,
                "register_number": member.register_number,
                "folio_number": member.folio_number
            },
            status=status.HTTP_200_OK
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
    """List all death registers"""
    serializer_class = DeathRegisterSerializer  # or DeathRegisterListSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        church = self.request.user.church
        queryset = DeathRegister.objects.filter(
            church=church
        ).select_related("member", "member__family")
        
        # 🔥 REMOVED: status filter since no status field
        # status_param = self.request.query_params.get("status")
        # if status_param:
        #     queryset = queryset.filter(status=status_param.upper())

        return queryset.order_by("-created_at")



from django.utils.dateparse import parse_date

class DeathRegisterUpdateAPIView(UpdateAPIView):
    serializer_class = DeathRegisterSerializer
    permission_classes = [IsAuthenticated, IsChurchUser]

    def get_queryset(self):
        return DeathRegister.objects.filter(
            church=self.request.user.church
        ).select_related("member")

    def perform_update(self, serializer):
        death = self.get_object()
        
        # 🔥 REMOVED: No status check needed
        # if death.status == "COMPLETED":
        #     raise ValidationError("Cannot modify completed death record.")

        with transaction.atomic():
            # Ensure dates are parsed before saving
            validated_data = serializer.validated_data
            
            # Convert string dates to date objects if needed
            if 'died_on' in validated_data and validated_data['died_on']:
                if isinstance(validated_data['died_on'], str):
                    validated_data['died_on'] = parse_date(validated_data['died_on'])
            
            if 'funeral_on' in validated_data and validated_data['funeral_on']:
                if isinstance(validated_data['funeral_on'], str):
                    validated_data['funeral_on'] = parse_date(validated_data['funeral_on'])

            death = serializer.save()

            # Generate register number if needed (should already be generated in save())
            if not death.reg_no:
                death.reg_no = generate_register_number(
                    death.church,
                    "DEATH"
                )
                death.save(update_fields=["reg_no"])



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

        # Validate required fields
        required_fields = ['died_on', 'funeral_on', 'tomb_type', 'tomb_charge', 'reason_of_death']
        missing_fields = [field for field in required_fields if not request.data.get(field)]
        
        if missing_fields:
            return Response(
                {field: "This field is required." for field in missing_fields},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # 🔥 REMOVED: status field - create directly
            death = DeathRegister.objects.create(
                church=member.church,
                member=member,
                died_on=request.data.get("died_on"),
                funeral_on=request.data.get("funeral_on"),
                tomb_type_id=request.data.get("tomb_type"),
                tomb_charge=request.data.get("tomb_charge"),
                tomb_idn=request.data.get("tomb_idn", ""),
                reason_of_death=request.data.get("reason_of_death"),
                remarks=request.data.get("remarks", ""),
            )
            
            # 🔥 Register number is auto-generated in the save() method

            # Deactivate the member
            member.expired = True
            member.is_active = False
            member.inactive_reason = "DECEASED"
            member.inactive_date = date.today()
            member.save()

            # If family head, deactivate user account
            if member.is_family_head and hasattr(member, 'user'):
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
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = OfferingSerializer

    def get_queryset(self):
        return Offering.objects.filter(
            church=self.request.user.church
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class OfferingDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = OfferingSerializer

    def get_queryset(self):
        return Offering.objects.filter(church=self.request.user.church)

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
    
class PaymentMasterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = PaymentMasterSerializer

    def get_queryset(self):
        return PaymentMaster.objects.filter(
            church=self.request.user.church
        ).order_by("-payment_date")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class PaymentMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = PaymentMasterSerializer

    def get_queryset(self):
        return PaymentMaster.objects.filter(church=self.request.user.church)
    
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


class CommitteeMemberListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = CommitteeMemberSerializer

    def get_queryset(self):
        return CommitteeMember.objects.filter(
            church=self.request.user.church
        ).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class CommitteeMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = CommitteeMemberSerializer

    def get_queryset(self):
        return CommitteeMember.objects.filter(church=self.request.user.church)


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
        serializer.save(church=self.request.user.church)


class CommitteeMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = CommitteeMasterSerializer

    def get_queryset(self):
        return CommitteeMaster.objects.filter(church=self.request.user.church)


class CommitteeMemberListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = CommitteeMemberSerializer

    def get_queryset(self):
        return CommitteeMember.objects.filter(
            church=self.request.user.church
        ).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(church=self.request.user.church)


class CommitteeMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsChurchUser]
    serializer_class = CommitteeMemberSerializer

    def get_queryset(self):
        return CommitteeMember.objects.filter(church=self.request.user.church)
    
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