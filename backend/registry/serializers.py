from datetime import date

from rest_framework import serializers
from .models import Baptism, Bill, Church, DeathRegister, Designation, DheshaKuri, Diocese, Events, Grade, Priest,  RegisterSetting, Relationship, TombFee, TombType, UpgradeRequest,  Ward, Family, Member, Offering, VisitorMaster, Subscription, AccountGroupMaster, AccountLedgerMaster, PaymentMaster,  QurbanaReceipts, CommitteeMaster, CommitteeMember
from .services import can_add_member, generate_folio_number, generate_register_number
from rest_framework import serializers
from .models import Package
from .models import ChurchSubscription, Package
from django.utils import timezone

class ChurchListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Church
        fields = [
            "id",
            "name",
            "city",
            "diocese_name",
            "email",
            "phone_number",
            "is_active",
            "created_at",
        ]


class ChurchDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = Church
        fields = "__all__"
class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = [
            "id",
            "name",
            "member_limit",
            "rate_per_member_monthly",
            "rate_per_member_yearly",
            "upgrade_rate_monthly",
            "upgrade_rate_yearly",
            "is_custom",
        ]

class SubscribeSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()
    billing_cycle = serializers.ChoiceField(
        choices=("MONTHLY", "YEARLY")
    )

    def validate(self, data):
        church = self.context["church"]

        if hasattr(church, "churchsubscription"):
            raise serializers.ValidationError(
                "Subscription already exists. Use upgrade."
            )

        try:
            package = Package.objects.get(id=data["package_id"])
        except Package.DoesNotExist:
            raise serializers.ValidationError("Invalid package")

        data["package"] = package
        return data


class WardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_ward_number(self, value):
        church = self.context["church"]

        qs = Ward.objects.filter(church=church, ward_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                f'Ward number {value} already exists in this church.'
            )
        return value

    def create(self, validated_data):
        validated_data["church"] = self.context["church"]
        return super().create(validated_data)


class FamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        fields = [
            "id",
            "church",
            "family_name",
            "history",
            "origin",
        ]
        read_only_fields = ("church",)

    def validate_family_name(self, value):
        value = value.strip().capitalize()
        church = self.context["church"]

        qs = Family.objects.filter(church=church, family_name=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                f'A family named "{value}" already exists in this church.'
            )
        return value

    def create(self, validated_data):
        validated_data["church"] = self.context["church"]
        return super().create(validated_data)


class TombTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TombType
        fields = "__all__"
        read_only_fields = ("church",)

class TombFeeSerializer(serializers.ModelSerializer):

    class Meta:
        model = TombFee
        fields = "__all__"
        read_only_fields = ("church",)

    def validate(self, data):

        church = self.context["request"].user.church
        tomb_type = data.get("tomb_type")

        if tomb_type.church != church:
            raise serializers.ValidationError(
                "Invalid tomb type for this church."
            )

        return data

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = "__all__"
        read_only_fields = ("church",)

class DioceseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Diocese
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_phone_number(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain digits only")

        if len(value) < 10:
            raise serializers.ValidationError("Phone number must be at least 10 digits")

        return value
class PriestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Priest
        fields = "__all__"
        read_only_fields = ("church",)

    def validate(self, data):
        request = self.context["request"]
        church = request.user.church

        designation = data.get(
            "designation", getattr(self.instance, "designation", "ASSISTANT")
        )
        today = date_cls.today()

        new_date_from = data.get(
            "date_from", getattr(self.instance, "date_from", None)
        )
        new_date_to = data.get(
            "date_to", getattr(self.instance, "date_to", None)
        )

        # Get all active priests (both MAIN and ASSISTANT) for this church
        active_priests = Priest.objects.filter(
            church=church,
            is_active=True,
        ).filter(
            Q(date_to__isnull=True) | Q(date_to__gte=today)
        )

        if self.instance:
            active_priests = active_priests.exclude(pk=self.instance.pk)

        # Check for active priests that overlap with the new priest's dates
        for existing in active_priests:
            existing_start = existing.date_from
            existing_end = existing.date_to

            # Check if the new priest's period overlaps with the existing priest's period
            starts_after_existing_ends = (
                existing_end is not None
                and new_date_from
                and new_date_from > existing_end
            )
            ends_before_existing_starts = (
                new_date_to is not None and new_date_to < existing_start
            )

            overlaps = not (starts_after_existing_ends or ends_before_existing_starts)

            if overlaps:
                # Handle different cases for better error messages
                if existing.designation == "MAIN":
                    role = "main priest"
                else:
                    role = "assistant priest"
                
                until = (
                    existing_end.strftime("%d-%m-%Y")
                    if existing_end
                    else "an unspecified date"
                )
                raise serializers.ValidationError({
                    "designation": (
                        f"This overlaps with {existing.name}, who is currently "
                        f"serving as {role} until {until}. Please ensure the new "
                        f"priest's service period does not overlap with any active priest."
                    )
                })

        # Additional validation for MAIN priests
        if designation == "MAIN":
            if not new_date_from:
                raise serializers.ValidationError({
                    "date_from": "Serving-from date is required for a main priest."
                })

        # Validation for ASSISTANT priests
        else:
            # Count active assistants (optional - keep or remove as needed)
            active_assistants = Priest.objects.filter(
                church=church,
                designation="ASSISTANT",
            ).filter(
                Q(date_to__isnull=True) | Q(date_to__gte=today)
            )
            if self.instance:
                active_assistants = active_assistants.exclude(pk=self.instance.pk)

            # Optional: Keep the max 3 assistants limit
            if active_assistants.count() >= 3:
                raise serializers.ValidationError({
                    "designation": "Maximum of 3 active assistant priests allowed."
                })

        return data

from datetime import date
from django.db import DataError, IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Member
from .services import can_add_member
import logging

logger = logging.getLogger(__name__)

# Get the custom User model
User = get_user_model()

class MemberSerializer(serializers.ModelSerializer):

    class Meta:
        model = Member
        fields = "__all__"
        read_only_fields = ("church", "age", "ward", "address", "family_image")

    def validate_dob(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate_email(self, value):
        """
        Email must be globally unique (matches User.username uniqueness).
        """
        if not value:
            return value
        
        # 🔥 GLOBAL uniqueness check (not per-church)
        qs = Member.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "This email is already used by another member in the system."
            )
        
        # 🔥 Check if any User exists with this username
        if User.objects.filter(username=value).exists():
            if self.instance and self.instance.email == value:
                pass  # This is the same user, skip
            else:
                raise serializers.ValidationError(
                    "This email is already used as a login username."
                )
        
        return value

    def validate_spouse(self, value):
        """
        Validate spouse relationship:
        - Must be opposite gender (if church doesn't allow same-sex)
        - Must be mutual (spouse.spouse must point back to this member)
        - Cannot be expired
        - Cannot be same member
        """
        if not value:
            return value

        if self.instance and value.pk == self.instance.pk:
            raise serializers.ValidationError("A member cannot be their own spouse.")

        # 🔥 Check gender (if your church requires opposite gender)
        if self.instance and self.instance.gender == value.gender:
            raise serializers.ValidationError(
                "Spouse must be of opposite gender."
            )

        # 🔥 Check mutual relationship
        if value.spouse and value.spouse.pk != self.instance.pk:
            if self.instance:
                raise serializers.ValidationError(
                    "Spouse relationship must be mutual. This person is already married to someone else."
                )
            else:
                # For creation, we can't check instance yet
                pass

        # 🔥 Check if spouse is expired
        if value.expired:
            raise serializers.ValidationError(
                "Cannot set an expired member as spouse."
            )

        # 🔥 Check if spouse is already married to someone else
        if value.spouse and value.spouse.pk != (self.instance.pk if self.instance else None):
            raise serializers.ValidationError(
                "This person is already married to someone else."
            )

        return value

    def validate(self, data):
        church = self.context["church"]
        allowed, reason = can_add_member(church)
        if not allowed:
            raise serializers.ValidationError({"non_field_errors": reason})

        # -----------------------------
        # CREATE LOGIC
        # -----------------------------
        if not self.instance:

            # 🔥 Block head creation here
            if data.get("is_family_head"):
                raise serializers.ValidationError({
                    "is_family_head": "Use family head API to create family head."
                })

            family = data.get("family")
            house_name = data.get("house_name")
            house_sequence = data.get("house_sequence", 1)

            if data.get("address"):
                raise serializers.ValidationError({
                    "address": "Address should not be assigned manually."
                })

            if not family:
                raise serializers.ValidationError({
                    "family": "Family is required."
                })

            if not house_name:
                raise serializers.ValidationError({
                    "house_name": "House name is required."
                })

            # 🔥 Block manual ward assignment
            if data.get("ward"):
                raise serializers.ValidationError({
                    "ward": "Ward should not be assigned manually."
                })

            # 🔥 Block image upload
            if data.get("family_image"):
                raise serializers.ValidationError({
                    "family_image": "Family image can only be uploaded for family head."
                })

            # 🔥 Ensure this specific household has an active head
            head = Member.objects.filter(
                family=family,
                house_name__iexact=house_name.strip(),
                house_sequence=house_sequence,
                is_family_head=True,
                is_active=True
            ).first()

            # 🔍 LOG THE HEAD LOOKUP for debugging
            logger.info(f"Member creation - Looking for head with: family={family.id if family else None}, "
                       f"house_name={house_name}, house_sequence={house_sequence}")
            logger.info(f"Found head: {head.id if head else None}")

            if not head:
                # 🔍 Check if any head exists with different sequence
                head_with_different_seq = Member.objects.filter(
                    family=family,
                    house_name__iexact=house_name.strip(),
                    is_family_head=True,
                    is_active=True
                ).first()
                
                if head_with_different_seq:
                    raise serializers.ValidationError({
                        "house_name": f"Cannot add member. Active head exists but with house_sequence={head_with_different_seq.house_sequence}. "
                                     f"Please use house_sequence={head_with_different_seq.house_sequence}."
                    })
                else:
                    raise serializers.ValidationError({
                        "house_name": "Cannot add member. No active head for this house."
                    })

        # -----------------------------
        # UPDATE LOGIC
        # -----------------------------
        else:
            instance = self.instance
            relationship = data.get("relationship", instance.relationship)
            family = instance.family

            # 🔥 🚨 BLOCK DIRECT EXPIRE
            if "expired" in data:
                raise serializers.ValidationError({
                    "expired": "Use mark-dead API to mark a member as deceased."
                })

            # 🔥 Block promoting head
            if data.get("is_family_head"):
                raise serializers.ValidationError({
                    "is_family_head": "Use family head API to assign family head."
                })

            # 🔥 Only head can update image
            if "family_image" in data and not instance.is_family_head:
                raise serializers.ValidationError({
                    "family_image": "Only family head can have family image."
                })

            # 🔥 Block manual ward change
            if "ward" in data:
                raise serializers.ValidationError({
                    "ward": "Ward cannot be modified here."
                })

            # 🔥 Block house_sequence change (should be immutable)
            if "house_sequence" in data and data["house_sequence"] != instance.house_sequence:
                raise serializers.ValidationError({
                    "house_sequence": "House sequence cannot be changed after creation."
                })

            # -----------------------------
            # RELATIONSHIP VALIDATION
            # -----------------------------

            # Get active head of this SPECIFIC household
            head = Member.objects.filter(
                family=family,
                house_name=instance.house_name,
                house_sequence=instance.house_sequence,
                is_family_head=True,
                is_active=True
            ).first()

            # 1️⃣ Head cannot have relationship
            if instance.is_family_head:
                if relationship:
                    raise serializers.ValidationError({
                        "relationship": "Family head cannot have a relationship."
                    })

            if relationship:
                rel_name = relationship.name

                # 2️⃣ Only one Father / Mother per family
                if rel_name in ["Father", "Mother"]:
                    existing = Member.objects.filter(
                        family=family,
                        relationship__name=rel_name,
                        expired=False
                    ).exclude(pk=instance.pk)

                    if existing.exists():
                        raise serializers.ValidationError({
                            "relationship": f"{rel_name} already exists in this family."
                        })

                # 3️⃣ Son / Daughter must be younger than head
                if rel_name in ["Son", "Daughter"]:
                    if not head:
                        raise serializers.ValidationError({
                            "relationship": "Cannot assign child relationship without active head."
                        })

                    if not instance.dob or not head.dob:
                        raise serializers.ValidationError({
                            "dob": "DOB required to validate child relationship."
                        })

                    if instance.dob <= head.dob:
                        raise serializers.ValidationError({
                            "relationship": "Child must be younger than family head."
                        })

                # 4️⃣ In-law must have spouse
                if rel_name in ["Son_In_Low", "Daughter_In_Low"]:
                    if not instance.spouse:
                        raise serializers.ValidationError({
                            "relationship": "In-law must have spouse assigned."
                        })
                    
                    # 🔥 Check if spouse is actually a member
                    if instance.spouse:
                        # Ensure spouse belongs to same family
                        if instance.spouse.family != family:
                            raise serializers.ValidationError({
                                "relationship": "Spouse must be in the same family."
                            })

        return data

    # -----------------------------
    # CREATE LOGIC
    # -----------------------------
    def create(self, validated_data):
        family = validated_data.get("family")
        house_name = validated_data.get("house_name")
        house_sequence = validated_data.get("house_sequence", 1)

        head = Member.objects.filter(
            family=family,
            house_name__iexact=house_name.strip(),
            house_sequence=house_sequence,
            is_family_head=True,
            is_active=True
        ).first()

        if not head:
            raise serializers.ValidationError({
                "house_name": "Cannot add member. No active head for this house."
            })

        # 🔥 Inherit ward from head
        validated_data["ward"] = head.ward

        # 🔥 Attach church
        validated_data["church"] = self.context["church"]

        # 🔥 Inherit image from head
        validated_data["family_image"] = head.family_image
        validated_data["address"] = head.address

        try:
            return super().create(validated_data)
        except DataError as e:
            raise serializers.ValidationError({
                "dob": f"Please check the date of birth — it produces an invalid age. Error: {str(e)}"
            })
        except IntegrityError as e:
            raise serializers.ValidationError({
                "non_field_errors": f"This member could not be saved due to a conflicting record. Error: {str(e)}"
            })
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "non_field_errors": str(e)
            })

    # -----------------------------
    # UPDATE LOGIC (CLEANED)
    # -----------------------------
    def update(self, instance, validated_data):
        # 🔥 NO DEATH LOGIC HERE ANYMORE
        try:
            return super().update(instance, validated_data)
        except DataError as e:
            raise serializers.ValidationError({
                "dob": f"Please check the date of birth — it produces an invalid age. Error: {str(e)}"
            })
        except IntegrityError as e:
            raise serializers.ValidationError({
                "non_field_errors": f"This member could not be saved due to a conflicting record. Error: {str(e)}"
            })
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "non_field_errors": str(e)
            })

class RelationshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Relationship
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_name(self, value):
        cleaned = value.strip().title()
        if any(char.isdigit() for char in cleaned):
            raise serializers.ValidationError("Relationship name should not contain numbers.")

        request = self.context.get("request")
        church = request.user.church if request else getattr(self.instance, "church", None)

        qs = Relationship.objects.filter(church=church, name=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                f'A relationship named "{cleaned}" already exists in this church.'
            )
        return cleaned



class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_name(self, value):
        value = value.strip()
        church = self.context["church"]

        qs = Grade.objects.filter(church=church, name=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(f'Grade "{value}" already exists in this church.')
        return value

    def create(self, validated_data):
        validated_data["church"] = self.context["church"]
        return super().create(validated_data)



class SubscribeSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()
    billing_cycle = serializers.ChoiceField(
        choices=("MONTHLY", "YEARLY")
    )

    def validate(self, data):
        church = self.context["church"]

        if hasattr(church, "churchsubscription"):
            raise serializers.ValidationError(
                "Subscription already exists. Use upgrade."
            )

        try:
            package = Package.objects.get(id=data["package_id"])
        except Package.DoesNotExist:
            raise serializers.ValidationError("Invalid package")

        data["package"] = package
        return data


#upgrade package serializer
class UpgradeSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()

    def validate(self, data):
        church = self.context["church"]

        subscription = getattr(church, "churchsubscription", None)
        if not subscription or not subscription.is_active:
            raise serializers.ValidationError("No active subscription")

        try:
            new_package = Package.objects.get(id=data["package_id"])
        except Package.DoesNotExist:
            raise serializers.ValidationError("Invalid package")

        if (
            not new_package.is_custom and
            not subscription.package.is_custom and
            new_package.member_limit <= subscription.package.member_limit
        ):
            raise serializers.ValidationError(
                "Upgrade must be to higher package"
            )

        data["subscription"] = subscription
        data["new_package"] = new_package
        return data

#for knowing member count
class ChurchDashboardSerializer(serializers.Serializer):
    church = serializers.DictField()
    subscription = serializers.DictField(allow_null=True)
    members = serializers.DictField()
    upgrade_required = serializers.BooleanField()


class WardMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = ["id", "ward_name", "ward_number", "place"]


class FamilyMiniSerializer(serializers.ModelSerializer):
    ward = serializers.SerializerMethodField()

    class Meta:
        model = Family
        fields = ["id", "family_name", "ward"]

    def get_ward(self, obj):
        head = obj.get_active_head()

        if head and head.ward:
            return {
                "id": head.ward.id,
                "ward_name": head.ward.ward_name,
                "ward_number": head.ward.ward_number,
                "place": head.ward.place,
            }
        return None




class ChurchMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Church
        fields = ["id", "name", "city", "diocese_name"]


class MemberProfileSerializer(serializers.ModelSerializer):
    family = FamilyMiniSerializer()
    church = ChurchMiniSerializer()

    class Meta:
        model = Member
        fields = [
            "id",
            "name",
            "baptismal_name",
            "gender",
            "marital_status",
            "mobile_no",
            "blood_group",
            "dob",
            "age",
            "family",
            "church",
        ]


class BillListSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(
        source="subscription.package.name",
        read_only=True
    )

    class Meta:
        model = Bill
        fields = [
            "id",
            "bill_type",
            "package_name",
            "billing_cycle",
            "duration_months",
            "amount",
            "status",
            "created_at",
            "breakdown",
        ]

class BillDetailSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(
        source="subscription.package.name",
        read_only=True
    )
    church_name = serializers.CharField(
        source="church.name",
        read_only=True
    )

    class Meta:
        model = Bill
        fields = [
            "id",
            "church_name",
            "package_name",
            "bill_type",
            "billing_cycle",
            "duration_months",
            "amount",
            "status",
            "created_at",
            "paid_at",
            "breakdown",
        ]

#expire
class SubscriptionExpirySerializer(serializers.Serializer):
    package = serializers.CharField()
    billing_cycle = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    days_remaining = serializers.IntegerField()
    status = serializers.CharField()

#upgrade request
class UpgradeRequestSerializer(serializers.ModelSerializer):
    requested_package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.filter(is_trial=False)
    )

    class Meta:
        model = UpgradeRequest
        fields = [
            "id",
            "requested_package",
            "requested_capacity",
            "reason",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
        ]

    def validate(self, attrs):
        package = attrs.get("requested_package")
        capacity = attrs.get("requested_capacity")

        # 🔒 Custom package requires capacity
        if package.is_custom and not capacity:
            raise serializers.ValidationError(
                {"requested_capacity": "Capacity is required for custom package"}
            )

        # 🔒 Non-custom should not send capacity
        if not package.is_custom and capacity:
            raise serializers.ValidationError(
                {"requested_capacity": "Capacity allowed only for custom package"}
            )

        return attrs
    
#Baptism
class BaptismSerializer(serializers.ModelSerializer):

    house_name = serializers.SerializerMethodField()
    family_name = serializers.CharField(source="family.family_name", read_only=True)

    class Meta:
        model = Baptism
        fields = "__all__"
        read_only_fields = ("register_number", "church")

    # ---------------------------------
    # HOUSE NAME
    # ---------------------------------
    def get_house_name(self, obj):
        if obj.member:
            return obj.member.house_name
        return None

    # ---------------------------------
    # VALIDATION
    # ---------------------------------
    def validate(self, data):

        instance = self.instance
        request = self.context.get("request")

        church = request.user.church if request else None

        category = data.get(
            "baptism_category",
            instance.baptism_category if instance else None
        )

        family = data.get(
            "family",
            instance.family if instance else None
        )

        main_member = data.get(
            "main_member",
            instance.main_member if instance else None
        )

        relation = data.get(
            "relation_with_main_member",
            instance.relation_with_main_member if instance else None
        )

        priest_name = data.get(
            "priest_name",
            instance.priest_name if instance else None
        )

        panchayath = data.get(
            "panchayath",
            instance.panchayath if instance else None
        )

        # -------------------------
        # Required fields
        # -------------------------
        if not priest_name:
            raise serializers.ValidationError({
                "priest_name": "Priest name is required."
            })

        if not panchayath:
            raise serializers.ValidationError({
                "panchayath": "Panchayath name is required."
            })

        # -------------------------
        # Parish baptism validation
        # -------------------------
        if category == "PARISH":

            if not family:
                raise serializers.ValidationError({
                    "family": "Family is required for parish baptism."
                })

            if not main_member:
                raise serializers.ValidationError({
                    "main_member": "Main member is required for parish baptism."
                })

            if not relation:
                raise serializers.ValidationError({
                    "relation_with_main_member": "Relationship is required for parish baptism."
                })

            # main_member must be head
            if main_member and not main_member.is_family_head:
                raise serializers.ValidationError({
                    "main_member": "Main member must be a family head."
                })

            # ensure family belongs to church
            if church and family and family.church != church:
                raise serializers.ValidationError({
                    "family": "Selected family does not belong to this church."
                })

        # -------------------------
        # Outsider baptism validation
        # -------------------------
        if category == "OTHER":

            if family or main_member or relation:
                raise serializers.ValidationError(
                    "Family, main member, and relationship must be empty for outsider baptism."
                )

        return data
class FamilyHeadCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Member
        fields = [
            "family",
            "house_name",
            "ward",
            "family_image",
            "name",
            "baptismal_name",
            "gender",
            "email",
            "marital_status",
            "spouse_name",
            "dob",
            "mobile_no",
            "phone_no",
            "blood_group",
            "father_name",
            "mother_name",
            "date_of_baptism",
            "parish_of_baptism",
            "educational_qualification",
            "sunday_school_qualification",
            "profession",
            "grade",
            "joining_date",
            "transferred_from",
            "address",
        ]

    def validate(self, data):

        church = self.context["church"]
        family = data.get("family")
        ward = data.get("ward")
        email = data.get("email")
        house_name = data.get("house_name")

        # ----------------------------
        # Ensure family belongs to church
        # ----------------------------
        if family.church != church:
            raise serializers.ValidationError(
                "Invalid family selected."
            )

        # ----------------------------
        # house_name required
        # ----------------------------
        if not house_name:
            raise serializers.ValidationError({
                "house_name": "House name is required."
            })

        # ----------------------------
        # Only one active head per house
        # ----------------------------
        existing_head = Member.objects.filter(
            family=family,
            house_name=house_name,
            is_family_head=True,
            is_active=True
        ).first()

        if existing_head:
            raise serializers.ValidationError(
                "This house already has an active head."
            )

        # ----------------------------
        # Ward required
        # ----------------------------
        if not ward:
            raise serializers.ValidationError({
                "ward": "Ward is required for family head."
            })

        # ----------------------------
        # Email required
        # ----------------------------
        if not email:
            raise serializers.ValidationError({
                "email": "Email is required for family head login."
            })

        return data


    def create(self, validated_data):

        church = self.context["church"]

        with transaction.atomic():

            # Generate formatted register number
            register_no = generate_register_number(
                church,
                "HEAD"
            )

            # Generate formatted folio number
            folio_no = generate_folio_number(
            church
            )

            validated_data["church"] = church
            validated_data["is_family_head"] = True
            validated_data["is_active"] = True
            validated_data["register_number"] = register_no
            validated_data["folio_number"] = folio_no

            head = Member.objects.create(**validated_data)

        return head

class FamilyMemberSerializer(serializers.ModelSerializer):
    relationship = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    family_name = serializers.SerializerMethodField()
    house_name = serializers.SerializerMethodField()
    family_image = serializers.SerializerMethodField()
    spouse_name=serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            "id",
            "name",
            "gender",
            "dob",
            "mobile_no",
            "phone_no",
            "address",
            "profession",
            "marital_status",
            'spouse_name',
            "blood_group",
            "is_family_head",
            "relationship",
            "grade_name",
            "family_name",
            "family_image",
            "house_name",
            "register_number",
            "folio_number"
        ]

    def get_relationship(self, obj):
        if obj.is_family_head:
            return None
        return obj.relationship.name if obj.relationship else None

    def get_grade_name(self, obj):
        return obj.grade.name if obj.grade else None

    def get_family_name(self, obj):
        return obj.family.family_name if obj.family else None

    def get_house_name(self, obj):
        return obj.house_name  
    
    def get_spouse_name(self, obj):
        if obj.spouse:
         return obj.spouse.name
        return obj.spouse_name or None
    
    def get_family_image(self, obj):
        if obj.is_family_head and obj.family_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.family_image.url)

        # fallback: get from head
        head = Member.objects.filter(
            family=obj.family,
            house_name=obj.house_name,
            is_family_head=True,
            is_active=True
        ).first()

        if head and head.family_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(head.family_image.url)

        return None

#mobile Directory apis
class WardWithFamilyCountSerializer(serializers.ModelSerializer):
    family_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ward
        fields = ["id", "ward_name","place", "family_count","ward_number"]


class MobileFamilyListSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    family_name = serializers.SerializerMethodField()
    family_image = serializers.SerializerMethodField()
    family_id = serializers.IntegerField(source="family.id", read_only=True)

    class Meta:
        model = Member  # IMPORTANT
        fields = [
            "id",
            "family_name",
            "family_id",
            "house_name",
            "family_image",
            "name",  # head name
            "member_count",
        ]

    def get_family_name(self, obj):
        return obj.family.family_name

    def get_family_image(self, obj):
        request = self.context.get("request")
        if obj.family_image and request:
            return request.build_absolute_uri(obj.family_image.url)
        return None

    
class MobileFamilyMemberSerializer(serializers.ModelSerializer):
    relationship_name = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            "id",
            "name",
            "gender",
            "dob",
            "age",
            "mobile_no",
            "is_family_head",
            "relationship_name",
        ]

    def get_relationship_name(self, obj):
        if obj.is_family_head:
            return "HEAD"
        return obj.relationship.name if obj.relationship else None

class MobileFamilyDetailSerializer(serializers.Serializer):
    family_name = serializers.CharField()
    house_name = serializers.CharField()
    family_image = serializers.CharField()
    members = serializers.ListField()


    def get_members(self, obj):
        members = obj.members.filter(
            is_active=True,
            expired=False
        ).order_by("-is_family_head", "name")

        return MobileFamilyMemberSerializer(
            members,
            many=True
        ).data

class MobileFamilyBaptismSerializer(serializers.ModelSerializer):
    gender = serializers.CharField(source="member.gender", read_only=True)

    class Meta:
        model = Baptism
        fields = [
            "id",
            "name",
            "baptismal_name",
            "gender",
            "date_of_baptism",
            "register_number",
        ]
from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from datetime import date
from django.db.models import Q

from .models import (
    Marriage,
    DheshaKuri,
    Member,
    Family,
    Church,
    # Add other models as needed
)


# ============================================================
# MARRIAGE MEMBER SERIALIZER
# ============================================================
class MarriageMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id", 
            "name", 
            "dob", 
            "house_name", 
            "marital_status",
            "is_active", 
            "gender", 
            "address", 
            "father_name", 
            "mother_name", 
            "profession"
        ]


# ============================================================
# MARRIAGE SERIALIZER (Main)
# ============================================================
class MarriageSerializer(serializers.ModelSerializer):
    
    # Read-only fields for member details display
    groom = MarriageMemberSerializer(
        source="groom_member",
        read_only=True
    )
    
    bride = MarriageMemberSerializer(
        source="bride_member",
        read_only=True
    )
    
    # Write-only fields for form logic
    groom_family = serializers.PrimaryKeyRelatedField(
        queryset=Family.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    
    bride_family = serializers.PrimaryKeyRelatedField(
        queryset=Family.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    
    # Confession dates (only for TRANSFER_BRIDE)
    groom_confession_date = serializers.DateField(
        required=False,
        allow_null=True,
        write_only=True
    )
    
    bride_confession_date = serializers.DateField(
        required=False,
        allow_null=True,
        write_only=True
    )
    
    # Flags for form logic (write-only)
    bride_is_internal = serializers.BooleanField(
        required=False,
        write_only=True,
        default=True
    )
    
    groom_is_internal = serializers.BooleanField(
        required=False,
        write_only=True,
        default=True
    )

    class Meta:
        model = Marriage
        fields = "__all__"
        read_only_fields = ("church", "register_number", "created_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        church = self.context.get("church")
        
        if church:
            # Filter families by church
            self.fields["family"].queryset = Family.objects.filter(church=church)
            self.fields["groom_family"].queryset = Family.objects.filter(church=church)
            self.fields["bride_family"].queryset = Family.objects.filter(church=church)
            
            # Filter available grooms: Male/Other, not married, not dead
            self.fields["groom_member"].queryset = Member.objects.filter(
                church=church,
                is_active=True,
                marital_status__in=["SINGLE", "DIVORCED", "WIDOWED"],
                is_dead=False
            ).exclude(
                Q(gender="FEMALE")
            )
            
            # Filter available brides: Female, not married, not dead
            self.fields["bride_member"].queryset = Member.objects.filter(
                church=church,
                is_active=True,
                marital_status__in=["SINGLE", "DIVORCED", "WIDOWED"],
                is_dead=False,
                gender="FEMALE"
            )

    # ---------------------------------------------------
    # VALIDATION
    # ---------------------------------------------------
    def validate(self, data):
        church = self.context["church"]
        marriage_type = data.get("marriage_type")
        
        # Extract form-specific fields
        bride_is_internal = data.get("bride_is_internal", True)
        groom_is_internal = data.get("groom_is_internal", True)
        groom_family = data.get("groom_family")
        bride_family = data.get("bride_family")
        family = data.get("family")
        groom_member = data.get("groom_member")
        bride_member = data.get("bride_member")
        groom_confession = data.get("groom_confession_date")
        bride_confession = data.get("bride_confession_date")
        transfer_to = data.get("transfer_to")

        # Church validation
        if family and family.church != church:
            raise serializers.ValidationError(
                {"family": "Family does not belong to this church."}
            )

        if groom_member and groom_member.church != church:
            raise serializers.ValidationError(
                {"groom_member": "Groom does not belong to this church."}
            )

        if bride_member and bride_member.church != church:
            raise serializers.ValidationError(
                {"bride_member": "Bride does not belong to this church."}
            )

        if not marriage_type:
            raise serializers.ValidationError(
                {"marriage_type": "Marriage type is required."}
            )

        # Spouse validation
        if groom_member and bride_member and groom_member == bride_member:
            raise serializers.ValidationError(
                "Groom and bride cannot be the same member."
            )

        if groom_member and groom_member.spouse:
            raise serializers.ValidationError(
                {"groom_member": "Groom already has a spouse linked."}
            )

        if bride_member and bride_member.spouse:
            raise serializers.ValidationError(
                {"bride_member": "Bride already has a spouse linked."}
            )

        # --------------------------------------------
        # ADD_BRIDE VALIDATION
        # --------------------------------------------
        if marriage_type == "ADD_BRIDE":
            
            # Groom MUST be internal
            if not groom_member:
                raise serializers.ValidationError(
                    {"groom_member": "Groom must be an existing member for ADD_BRIDE."}
                )
            
            # Groom family must be provided
            if not groom_family:
                raise serializers.ValidationError(
                    {"groom_family": "Groom's family is required for ADD_BRIDE."}
                )
            
            # Groom must belong to selected family
            if groom_member.family != groom_family:
                raise serializers.ValidationError(
                    {"groom_family": "Groom does not belong to the selected family."}
                )
            
            # If bride is internal
            if bride_is_internal:
                if not bride_member:
                    raise serializers.ValidationError(
                        {"bride_member": "Bride member is required for internal bride."}
                    )
                
                if not bride_family:
                    raise serializers.ValidationError(
                        {"bride_family": "Bride's family is required for internal bride."}
                    )
                
                if bride_member.family != bride_family:
                    raise serializers.ValidationError(
                        {"bride_family": "Bride does not belong to the selected family."}
                    )
                
                # Bride must be female
                if bride_member.gender != "FEMALE":
                    raise serializers.ValidationError(
                        {"bride_member": "Selected member must be female."}
                    )
            
            # If bride is external
            else:
                if not data.get("bride_name"):
                    raise serializers.ValidationError(
                        {"bride_name": "Bride name is required for external bride."}
                    )
            
            # Confession dates not needed for ADD_BRIDE
            if groom_confession or bride_confession:
                raise serializers.ValidationError(
                    {"confession_dates": "Confession dates are not required for ADD_BRIDE."}
                )
            
            # Transfer to not needed for ADD_BRIDE
            if transfer_to:
                raise serializers.ValidationError(
                    {"transfer_to": "Transfer destination is not required for ADD_BRIDE."}
                )

        # --------------------------------------------
        # TRANSFER_BRIDE VALIDATION
        # --------------------------------------------
        elif marriage_type == "TRANSFER_BRIDE":
            
            # Bride MUST be internal
            if not bride_member:
                raise serializers.ValidationError(
                    {"bride_member": "Bride must be an existing member for TRANSFER_BRIDE."}
                )
            
            # Bride family must be provided
            if not bride_family:
                raise serializers.ValidationError(
                    {"bride_family": "Bride's family is required for TRANSFER_BRIDE."}
                )
            
            # Bride must belong to selected family
            if bride_member.family != bride_family:
                raise serializers.ValidationError(
                    {"bride_family": "Bride does not belong to the selected family."}
                )
            
            # Bride must be female
            if bride_member.gender != "FEMALE":
                raise serializers.ValidationError(
                    {"bride_member": "Selected member must be female."}
                )
            
            # Transfer destination required
            if not transfer_to:
                raise serializers.ValidationError(
                    {"transfer_to": "Transfer destination is required for TRANSFER_BRIDE."}
                )
            
            # If groom is internal
            if groom_is_internal:
                if not groom_member:
                    raise serializers.ValidationError(
                        {"groom_member": "Groom member is required for internal groom."}
                    )
                
                if not groom_family:
                    raise serializers.ValidationError(
                        {"groom_family": "Groom's family is required for internal groom."}
                    )
                
                if groom_member.family != groom_family:
                    raise serializers.ValidationError(
                        {"groom_family": "Groom does not belong to the selected family."}
                    )
                
                if groom_member.gender == "FEMALE":
                    raise serializers.ValidationError(
                        {"groom_member": "Selected member must be male or other."}
                    )
            
            # If groom is external
            else:
                if not data.get("groom_name"):
                    raise serializers.ValidationError(
                        {"groom_name": "Groom name is required for external groom."}
                    )
            
            # Confession dates required
            if not groom_confession or not bride_confession:
                raise serializers.ValidationError(
                    {"confession_dates": "Both confession dates are required for TRANSFER_BRIDE."}
                )
        
        return data

    # ---------------------------------------------------
    # CREATE LOGIC
    # ---------------------------------------------------
    def create(self, validated_data):
        marriage_type = validated_data.get("marriage_type")
        church = validated_data.get("church")
        
        # Extract form-specific fields
        groom_family = validated_data.pop("groom_family", None)
        bride_family = validated_data.pop("bride_family", None)
        groom_confession_date = validated_data.pop("groom_confession_date", None)
        bride_confession_date = validated_data.pop("bride_confession_date", None)
        bride_is_internal = validated_data.pop("bride_is_internal", True)
        groom_is_internal = validated_data.pop("groom_is_internal", True)
        
        groom_member = validated_data.get("groom_member")
        bride_member = validated_data.get("bride_member")
        
        # Store for external groom
        groom_dob = validated_data.get("groom_dob")
        groom_house_name = validated_data.get("groom_house_name", "")
        groom_family_name = validated_data.get("groom_family_name", "")
        groom_place = validated_data.get("groom_address", "")

        with transaction.atomic():
            
            # -------------------------
            # LOCK GROOM
            # -------------------------
            if groom_member:
                groom_member = Member.objects.select_for_update().get(id=groom_member.id)
                if groom_member.spouse:
                    raise serializers.ValidationError(
                        {"groom_member": "Groom already married."}
                    )

            # -------------------------
            # LOCK BRIDE
            # -------------------------
            if bride_member:
                bride_member = Member.objects.select_for_update().get(id=bride_member.id)
                if bride_member.spouse:
                    raise serializers.ValidationError(
                        {"bride_member": "Bride already married."}
                    )

            # -------------------------
            # AUTO-FILL GROOM DETAILS (if internal)
            # -------------------------
            if groom_member:
                validated_data["groom_name"] = groom_member.name
                validated_data["groom_dob"] = groom_member.dob
                validated_data["groom_house_name"] = groom_member.house_name
                validated_data["groom_family_name"] = groom_member.family.family_name if groom_member.family else ""
                validated_data["groom_address"] = groom_member.address
                validated_data["groom_father"] = groom_member.father_name or ""
                validated_data["groom_mother"] = groom_member.mother_name or ""
                validated_data["nationality_of_groom"] = getattr(groom_member, "nationality", "") or ""

            # -------------------------
            # AUTO-FILL BRIDE DETAILS (if internal)
            # -------------------------
            if bride_member:
                validated_data["bride_name"] = bride_member.name
                validated_data["bride_dob"] = bride_member.dob
                validated_data["bride_house_name"] = bride_member.house_name
                validated_data["bride_family_name"] = bride_member.family.family_name if bride_member.family else ""
                validated_data["bride_address"] = bride_member.address
                validated_data["bride_father"] = bride_member.father_name or ""
                validated_data["bride_mother"] = bride_member.mother_name or ""
                validated_data["nationality_of_bride"] = getattr(bride_member, "nationality", "") or ""

            # -------------------------
            # CREATE MARRIAGE
            # -------------------------
            marriage = Marriage.objects.create(**validated_data)

            # =================================================
            # ADD_BRIDE LOGIC
            # =================================================
            if marriage_type == "ADD_BRIDE":
                
                family = groom_member.family
                house_name = groom_member.house_name
                relation_bride = validated_data.get("relation_of_bride_with_main_member")

                if bride_member and bride_is_internal:
                    # Deactivate original bride
                    bride_member.is_active = False
                    bride_member.inactive_reason = "MARRIED_MOVED_TO_HUSBAND_FAMILY"
                    bride_member.inactive_date = timezone.now().date()
                    bride_member.save(update_fields=[
                        "is_active",
                        "inactive_reason",
                        "inactive_date"
                    ])

                    # Create new bride in groom's family
                    new_bride = Member.objects.create(
                        church=church,
                        family=family,
                        house_name=house_name,
                        name=bride_member.name,
                        gender=bride_member.gender,
                        dob=bride_member.dob,
                        email=bride_member.email,
                        mobile_no=bride_member.mobile_no,
                        phone_no=bride_member.phone_no,
                        blood_group=bride_member.blood_group,
                        profession=bride_member.profession,
                        address=validated_data.get("bride_address") or groom_member.address,
                        grade=bride_member.grade,
                        sunday_school=bride_member.sunday_school,
                        educational_qualification=bride_member.educational_qualification,
                        relationship=relation_bride,
                        father_name=bride_member.father_name,
                        mother_name=bride_member.mother_name,
                        marital_status="MARRIED",
                        is_active=True,
                    )

                else:
                    # External bride
                    bride_name = validated_data.get("bride_name")
                    if not bride_name:
                        raise serializers.ValidationError(
                            {"bride_name": "Bride name is required for external bride."}
                        )

                    new_bride = Member.objects.create(
                        church=church,
                        family=family,
                        house_name=house_name,
                        name=bride_name,
                        gender="FEMALE",
                        dob=validated_data.get("bride_dob"),
                        father_name=validated_data.get("bride_father"),
                        mother_name=validated_data.get("bride_mother"),
                        relationship=relation_bride,
                        marital_status="MARRIED",
                        address=validated_data.get("bride_address") or groom_member.address,
                        is_active=True,
                    )

                # Link spouses
                groom_member.spouse = new_bride
                new_bride.spouse = groom_member
                groom_member.marital_status = "MARRIED"
                new_bride.marital_status = "MARRIED"
                groom_member.spouse_name = new_bride.name
                new_bride.spouse_name = groom_member.name

                groom_member.save(update_fields=["spouse", "marital_status", "spouse_name"])
                new_bride.save(update_fields=["spouse", "marital_status", "spouse_name"])

                marriage.bride_member = new_bride
                marriage.family = family
                marriage.save(update_fields=["bride_member", "family"])

            # =================================================
            # TRANSFER_BRIDE LOGIC
            # =================================================
            elif marriage_type == "TRANSFER_BRIDE":
                
                # Deactivate bride
                bride_member.marital_status = "MARRIED"
                bride_member.is_active = False
                bride_member.inactive_reason = "TRANSFERRED_AFTER_MARRIAGE"
                bride_member.inactive_date = timezone.now().date()
                bride_member.save(update_fields=[
                    "marital_status",
                    "is_active",
                    "inactive_reason",
                    "inactive_date"
                ])

                # Update groom if internal
                if groom_member and groom_is_internal:
                    groom_member.marital_status = "MARRIED"
                    groom_member.save(update_fields=["marital_status"])

                # Calculate groom age if external
                groom_age = None
                if not groom_member and groom_dob:
                    today = date.today()
                    groom_age = today.year - groom_dob.year - (
                        (today.month, today.day) < (groom_dob.month, groom_dob.day)
                    )

                # Create DheshaKuri (transfer certificate)
                DheshaKuri.objects.create(
                    church=church,
                    marriage=marriage,
                    groom_confession_date=groom_confession_date,
                    bride_confession_date=bride_confession_date,
                    groom_name=groom_member.name if groom_member else validated_data.get("groom_name"),
                    groom_dob=groom_member.dob if groom_member else groom_dob,
                    groom_age=groom_member.age if groom_member else groom_age,
                    groom_house_name=groom_member.house_name if groom_member else groom_house_name,
                    groom_family_name=groom_member.family.family_name if groom_member else groom_family_name,
                    groom_place=groom_member.address if groom_member else groom_place,
                    groom_father=validated_data.get("groom_father"),
                    groom_mother=validated_data.get("groom_mother"),
                    bride_name=bride_member.name,
                    bride_dob=bride_member.dob,
                    bride_age=bride_member.age,
                    bride_house_name=bride_member.house_name,
                    bride_family_name=bride_member.family.family_name,
                    bride_father=validated_data.get("bride_father"),
                    bride_mother=validated_data.get("bride_mother"),
                    bride_place=bride_member.address,
                    transfer_to=validated_data.get("transfer_to"),
                )

            return marriage

    # ---------------------------------------------------
    # CLEAN RESPONSE
    # ---------------------------------------------------
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Remove sensitive or redundant fields from response
        data.pop("bride_member", None)
        data.pop("groom_member", None)
        return data

from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from datetime import date
from django.db.models import Q

from .models import Marriage, DheshaKuri, Member, Family, Relationship


# ============================================================
# MARRIAGE MEMBER SERIALIZER
# ============================================================
class MarriageMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id", 
            "name", 
            "dob", 
            "house_name", 
            "marital_status",
            "is_active", 
            "gender", 
            "address", 
            "father_name", 
            "mother_name", 
            "profession"
        ]


# ============================================================
# MAIN MARRIAGE SERIALIZER
# ============================================================
class MarriageSerializer(serializers.ModelSerializer):
    
    groom = MarriageMemberSerializer(
        source="groom_member",
        read_only=True
    )
    
    bride = MarriageMemberSerializer(
        source="bride_member",
        read_only=True
    )
    
    # Write-only fields for form logic
    groom_family = serializers.PrimaryKeyRelatedField(
        queryset=Family.objects.none(),
        required=False,
        allow_null=True,
        write_only=True
    )
    
    bride_family = serializers.PrimaryKeyRelatedField(
        queryset=Family.objects.none(),
        required=False,
        allow_null=True,
        write_only=True
    )
    
    # Confession dates (only for TRANSFER_BRIDE)
    groom_confession_date = serializers.DateField(
        required=False,
        allow_null=True,
        write_only=True
    )
    
    bride_confession_date = serializers.DateField(
        required=False,
        allow_null=True,
        write_only=True
    )
    
    # Flags for form logic
    bride_is_internal = serializers.BooleanField(
        required=False,
        write_only=True,
        default=True
    )
    
    groom_is_internal = serializers.BooleanField(
        required=False,
        write_only=True,
        default=True
    )

    # 🔥 family removed from Marriage model — these are write-only inputs
    # only, never saved onto Marriage itself. queryset=.none() as a
    # placeholder here (required at class-definition time); the real
    # queryset is assigned in __init__ below.
    relation_of_bride_with_main_member = serializers.PrimaryKeyRelatedField(
        queryset=Relationship.objects.none(),
        required=False,
        allow_null=True,
        write_only=True
    )

    relation_of_groom_with_main_member = serializers.PrimaryKeyRelatedField(
        queryset=Relationship.objects.none(),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = Marriage
        fields = "__all__"
        read_only_fields = ("church", "register_number", "created_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        church = self.context.get("church")

        if "relation_of_bride_with_main_member" in self.fields:
            self.fields["relation_of_bride_with_main_member"].queryset = Relationship.objects.all()
        if "relation_of_groom_with_main_member" in self.fields:
            self.fields["relation_of_groom_with_main_member"].queryset = Relationship.objects.all()

        if church:
            # 🔥 "family" removed from queryset filtering — no longer a
            # Marriage model field, only groom_family / bride_family remain
            if "groom_family" in self.fields:
                self.fields["groom_family"].queryset = Family.objects.filter(church=church)
            
            if "bride_family" in self.fields:
                self.fields["bride_family"].queryset = Family.objects.filter(church=church)
            
            # Filter available grooms
            if "groom_member" in self.fields:
                self.fields["groom_member"].queryset = Member.objects.filter(
                    church=church,
                    is_active=True,
                    expired=False
                ).exclude(
                    gender="FEMALE"
                ).exclude(
                    Q(marital_status="MARRIED") | 
                    Q(marital_status="Married")
                )
            
            # Filter available brides
            if "bride_member" in self.fields:
                self.fields["bride_member"].queryset = Member.objects.filter(
                    church=church,
                    is_active=True,
                    expired=False,
                    gender="FEMALE"
                ).exclude(
                    Q(marital_status="MARRIED") | 
                    Q(marital_status="Married")
                )

    def validate(self, data):
        church = self.context["church"]
        marriage_type = data.get("marriage_type")
        
        bride_is_internal = data.get("bride_is_internal", True)
        groom_is_internal = data.get("groom_is_internal", True)
        groom_family = data.get("groom_family")
        bride_family = data.get("bride_family")
        groom_member = data.get("groom_member")
        bride_member = data.get("bride_member")
        groom_confession = data.get("groom_confession_date")
        bride_confession = data.get("bride_confession_date")
        transfer_to = data.get("transfer_to")

        # 🔥 "family" church-ownership check removed — field no longer
        # exists on Marriage. groom_family / bride_family are still
        # validated against the church via their own querysets above.

        if groom_member and groom_member.church != church:
            raise serializers.ValidationError({
                "groom_member": "Groom does not belong to this church."
            })

        if bride_member and bride_member.church != church:
            raise serializers.ValidationError({
                "bride_member": "Bride does not belong to this church."
            })

        if not marriage_type:
            raise serializers.ValidationError({
                "marriage_type": "Marriage type is required."
            })

        # Spouse validation
        if groom_member and bride_member and groom_member == bride_member:
            raise serializers.ValidationError({
                "members": "Groom and bride cannot be the same member."
            })

        if groom_member and groom_member.spouse:
            raise serializers.ValidationError({
                "groom_member": "Groom already has a spouse linked."
            })

        if bride_member and bride_member.spouse:
            raise serializers.ValidationError({
                "bride_member": "Bride already has a spouse linked."
            })

        # --------------------------------------------
        # ADD_BRIDE VALIDATION
        # --------------------------------------------
        if marriage_type == "ADD_BRIDE":
            if not groom_member:
                raise serializers.ValidationError({
                    "groom_member": "Groom must be an existing member for ADD_BRIDE."
                })

            # 🔥 Groom must be a regular dependent, never already a head.
            if groom_member.is_family_head:
                raise serializers.ValidationError({
                    "groom_member": (
                        "A family head cannot be married through this flow. "
                        "The groom must be a regular dependent member."
                    )
                })

            if not groom_family:
                raise serializers.ValidationError({
                    "groom_family": "Groom's family is required for ADD_BRIDE."
                })
            
            if groom_member.family != groom_family:
                raise serializers.ValidationError({
                    "groom_family": "Groom does not belong to selected family."
                })
            
            if bride_is_internal:
                if not bride_member:
                    raise serializers.ValidationError({
                        "bride_member": "Bride member required for internal bride."
                    })
                if not bride_family:
                    raise serializers.ValidationError({
                        "bride_family": "Bride's family required."
                    })
                if bride_member.family != bride_family:
                    raise serializers.ValidationError({
                        "bride_family": "Bride does not belong to selected family."
                    })
                if bride_member.gender != "FEMALE":
                    raise serializers.ValidationError({
                        "bride_member": "Selected member must be female."
                    })
            else:
                if not data.get("bride_name"):
                    raise serializers.ValidationError({
                        "bride_name": "Bride name required for external bride."
                    })
            
            if groom_confession or bride_confession:
                raise serializers.ValidationError({
                    "confession_dates": "Confession dates not required for ADD_BRIDE."
                })
            
            if transfer_to:
                raise serializers.ValidationError({
                    "transfer_to": "Transfer destination not required for ADD_BRIDE."
                })

        # --------------------------------------------
        # TRANSFER_BRIDE VALIDATION
        # --------------------------------------------
        elif marriage_type == "TRANSFER_BRIDE":
            if not bride_member:
                raise serializers.ValidationError({
                    "bride_member": "Bride must be an existing member for TRANSFER_BRIDE."
                })
            
            if not bride_family:
                raise serializers.ValidationError({
                    "bride_family": "Bride's family is required."
                })
            
            if bride_member.family != bride_family:
                raise serializers.ValidationError({
                    "bride_family": "Bride does not belong to selected family."
                })
            
            if bride_member.gender != "FEMALE":
                raise serializers.ValidationError({
                    "bride_member": "Selected member must be female."
                })
            
            if not transfer_to:
                raise serializers.ValidationError({
                    "transfer_to": "Transfer destination is required."
                })
            
            if groom_is_internal:
                if not groom_member:
                    raise serializers.ValidationError({
                        "groom_member": "Groom member required for internal groom."
                    })
                if not groom_family:
                    raise serializers.ValidationError({
                        "groom_family": "Groom's family required."
                    })
                if groom_member.family != groom_family:
                    raise serializers.ValidationError({
                        "groom_family": "Groom does not belong to selected family."
                    })
                if groom_member.gender == "FEMALE":
                    raise serializers.ValidationError({
                        "groom_member": "Selected member must be male."
                    })
            else:
                if not data.get("groom_name"):
                    raise serializers.ValidationError({
                        "groom_name": "Groom name required for external groom."
                    })
            
            if not groom_confession or not bride_confession:
                raise serializers.ValidationError({
                    "confession_dates": "Both confession dates are required."
                })
        
        return data

    def create(self, validated_data):
        marriage_type = validated_data.get("marriage_type")
        church = validated_data.get("church")
        
        groom_family = validated_data.pop("groom_family", None)
        bride_family = validated_data.pop("bride_family", None)
        groom_confession_date = validated_data.pop("groom_confession_date", None)
        bride_confession_date = validated_data.pop("bride_confession_date", None)
        bride_is_internal = validated_data.pop("bride_is_internal", True)
        groom_is_internal = validated_data.pop("groom_is_internal", True)

        # 🔥 pop out — write-only inputs, never fields on Marriage
        relation_of_bride = validated_data.pop("relation_of_bride_with_main_member", None)
        relation_of_groom = validated_data.pop("relation_of_groom_with_main_member", None)
        
        groom_member = validated_data.get("groom_member")
        bride_member = validated_data.get("bride_member")
        
        groom_dob = validated_data.get("groom_dob")
        groom_house_name = validated_data.get("groom_house_name", "")
        groom_family_name = validated_data.get("groom_family_name", "")
        groom_place = validated_data.get("groom_address", "")

        with transaction.atomic():
            # Lock groom
            if groom_member:
                groom_member = Member.objects.select_for_update().get(id=groom_member.id)
                if groom_member.spouse:
                    raise serializers.ValidationError({
                        "groom_member": "Groom already married."
                    })

            # Lock bride
            if bride_member:
                bride_member = Member.objects.select_for_update().get(id=bride_member.id)
                if bride_member.spouse:
                    raise serializers.ValidationError({
                        "bride_member": "Bride already married."
                    })

            # Auto-fill groom details if internal
            if groom_member:
                validated_data["groom_name"] = groom_member.name
                validated_data["groom_dob"] = groom_member.dob
                validated_data["groom_house_name"] = groom_member.house_name
                validated_data["groom_family_name"] = groom_member.family.family_name if groom_member.family else ""
                validated_data["groom_address"] = groom_member.address
                validated_data["groom_father"] = groom_member.father_name or ""
                validated_data["groom_mother"] = groom_member.mother_name or ""
                validated_data["nationality_of_groom"] = getattr(groom_member, "nationality", "") or ""

            # Auto-fill bride details if internal
            if bride_member:
                validated_data["bride_name"] = bride_member.name
                validated_data["bride_dob"] = bride_member.dob
                validated_data["bride_house_name"] = bride_member.house_name
                validated_data["bride_family_name"] = bride_member.family.family_name if bride_member.family else ""
                validated_data["bride_address"] = bride_member.address
                validated_data["bride_father"] = bride_member.father_name or ""
                validated_data["bride_mother"] = bride_member.mother_name or ""
                validated_data["nationality_of_bride"] = getattr(bride_member, "nationality", "") or ""

            # Create marriage — validated_data no longer contains "family"
            # or the relation_of_*_with_main_member keys, so this is safe
            marriage = Marriage.objects.create(**validated_data)

            # =================================================
            # ADD_BRIDE LOGIC
            # =================================================
            if marriage_type == "ADD_BRIDE":
                family = groom_member.family
                house_name = groom_member.house_name
                house_sequence = groom_member.house_sequence
                relation_bride = relation_of_bride

                if bride_member and bride_is_internal:
                    original_email = bride_member.email

                    bride_member.is_active = False
                    bride_member.inactive_reason = "MARRIED_MOVED_TO_HUSBAND_FAMILY"
                    bride_member.inactive_date = timezone.now().date()
                    bride_member.email = None
                    bride_member.save(update_fields=[
                        "is_active", "inactive_reason", "inactive_date", "email"
                    ])

                    new_bride = Member.objects.create(
                        church=church,
                        family=family,
                        house_name=house_name,
                        house_sequence=house_sequence,
                        name=bride_member.name,
                        gender=bride_member.gender,
                        dob=bride_member.dob,
                        email=original_email,
                        mobile_no=bride_member.mobile_no,
                        phone_no=bride_member.phone_no,
                        blood_group=bride_member.blood_group,
                        profession=bride_member.profession,
                        address=validated_data.get("bride_address") or groom_member.address,
                        grade=bride_member.grade,
                        educational_qualification=bride_member.educational_qualification,
                        relationship=relation_bride,
                        father_name=bride_member.father_name,
                        mother_name=bride_member.mother_name,
                        marital_status="MARRIED",
                        is_active=True,
                    )
                else:
                    bride_name = validated_data.get("bride_name")
                    if not bride_name:
                        raise serializers.ValidationError({
                            "bride_name": "Bride name is required for external bride."
                        })

                    new_bride = Member.objects.create(
                        church=church,
                        family=family,
                        house_name=house_name,
                        house_sequence=house_sequence,
                        name=bride_name,
                        gender="FEMALE",
                        dob=validated_data.get("bride_dob"),
                        father_name=validated_data.get("bride_father"),
                        mother_name=validated_data.get("bride_mother"),
                        relationship=relation_bride,
                        marital_status="MARRIED",
                        address=validated_data.get("bride_address") or groom_member.address,
                        is_active=True,
                    )

                # Link spouses
                groom_member.spouse = new_bride
                new_bride.spouse = groom_member
                groom_member.marital_status = "MARRIED"
                new_bride.marital_status = "MARRIED"
                groom_member.spouse_name = new_bride.name
                new_bride.spouse_name = groom_member.name

                groom_member.save(update_fields=["spouse", "marital_status", "spouse_name"])
                new_bride.save(update_fields=["spouse", "marital_status", "spouse_name"])

                # 🔥 "family" removed from Marriage — only bride_member updated
                marriage.bride_member = new_bride
                marriage.save(update_fields=["bride_member"])

            # =================================================
            # TRANSFER_BRIDE LOGIC
            # =================================================
            elif marriage_type == "TRANSFER_BRIDE":
                bride_member.marital_status = "MARRIED"
                bride_member.is_active = False
                bride_member.inactive_reason = "TRANSFERRED_AFTER_MARRIAGE"
                bride_member.inactive_date = timezone.now().date()
                bride_member.save(update_fields=[
                    "marital_status", "is_active", "inactive_reason", "inactive_date"
                ])

                if groom_member and groom_is_internal:
                    groom_member.marital_status = "MARRIED"
                    groom_member.save(update_fields=["marital_status"])

                groom_age = None
                if not groom_member and groom_dob:
                    today = date.today()
                    groom_age = today.year - groom_dob.year - (
                        (today.month, today.day) < (groom_dob.month, groom_dob.day)
                    )

                DheshaKuri.objects.create(
                    church=church,
                    marriage=marriage,
                    groom_confession_date=groom_confession_date,
                    bride_confession_date=bride_confession_date,
                    groom_name=groom_member.name if groom_member else validated_data.get("groom_name"),
                    groom_dob=groom_member.dob if groom_member else groom_dob,
                    groom_age=groom_member.age if groom_member else groom_age,
                    groom_house_name=groom_member.house_name if groom_member else groom_house_name,
                    groom_family_name=groom_member.family.family_name if groom_member else groom_family_name,
                    groom_place=groom_member.address if groom_member else groom_place,
                    groom_father=validated_data.get("groom_father"),
                    groom_mother=validated_data.get("groom_mother"),
                    bride_name=bride_member.name,
                    bride_dob=bride_member.dob,
                    bride_age=bride_member.age,
                    bride_house_name=bride_member.house_name,
                    bride_family_name=bride_member.family.family_name,
                    bride_father=validated_data.get("bride_father"),
                    bride_mother=validated_data.get("bride_mother"),
                    bride_place=bride_member.address,
                    transfer_to=validated_data.get("transfer_to"),
                )

            return marriage

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop("bride_member", None)
        data.pop("groom_member", None)
        return data


# ============================================================
# MARRIAGE CERTIFICATE SERIALIZER
# ============================================================
class MarriageCertificateSerializer(serializers.ModelSerializer):
    church_name = serializers.CharField(source="church.name")
    # 🔥 "family" removed from model — using bride_family_name instead.
    # Confirm with the client whether this should show the bride's or
    # groom's family name; swap source="groom_family_name" if needed.
    family_name = serializers.CharField(source="bride_family_name")
    
    groom_full_name = serializers.SerializerMethodField()
    bride_full_name = serializers.SerializerMethodField()
    groom_dob = serializers.SerializerMethodField()
    bride_dob = serializers.SerializerMethodField()
    groom_age = serializers.SerializerMethodField()
    bride_age = serializers.SerializerMethodField()
    groom_occupation = serializers.SerializerMethodField()
    bride_occupation = serializers.SerializerMethodField()
    groom_address = serializers.SerializerMethodField()
    bride_address = serializers.SerializerMethodField()

    class Meta:
        model = Marriage
        fields = [
            "id",
            "register_number",
            "date",
            "church_name",
            "family_name",
            "groom_full_name",
            "groom_dob",
            "groom_age",
            "groom_occupation",
            "groom_address",
            "bride_full_name",
            "bride_dob",
            "bride_age",
            "bride_occupation",
            "bride_address",
            "groom_father",
            "groom_mother",
            "bride_father",
            "bride_mother",
            "nationality_of_groom",
            "nationality_of_bride",
            "witness_bride_side",
            "witness_groom_side",
            "minister_of_marriage",
            "other_priests",
            "remarks",
        ]

    def get_groom_full_name(self, obj):
        return obj.groom_member.name if obj.groom_member else obj.groom_name

    def get_bride_full_name(self, obj):
        return obj.bride_member.name if obj.bride_member else obj.bride_name

    def get_groom_dob(self, obj):
        if obj.groom_member:
            return obj.groom_member.dob
        return obj.groom_dob

    def get_bride_dob(self, obj):
        if obj.bride_member:
            return obj.bride_member.dob
        return obj.bride_dob

    def get_groom_age(self, obj):
        if obj.groom_member:
            return obj.groom_member.age
        if obj.groom_dob:
            today = date.today()
            return today.year - obj.groom_dob.year - (
                (today.month, today.day) < (obj.groom_dob.month, obj.groom_dob.day)
            )
        return None
    
    def get_bride_age(self, obj):
        if obj.bride_member:
            return obj.bride_member.age
        if obj.bride_dob:
            today = date.today()
            return today.year - obj.bride_dob.year - (
                (today.month, today.day) < (obj.bride_dob.month, obj.bride_dob.day)
            )
        return None

    def get_groom_occupation(self, obj):
        return obj.groom_member.profession if obj.groom_member else None

    def get_bride_occupation(self, obj):
        return obj.bride_member.profession if obj.bride_member else None

    def get_groom_address(self, obj):
        if obj.groom_member:
            return obj.groom_member.address
        return obj.groom_address

    def get_bride_address(self, obj):
        if obj.bride_member:
            return obj.bride_member.address
        return obj.bride_address


# ============================================================
# DHESHA KURI SERIALIZER
# ============================================================
class DheshaKuriSerializer(serializers.ModelSerializer):
    church_name = serializers.CharField(source="church.name")

    class Meta:
        model = DheshaKuri
        fields = [
            "id",
            "church_name",
            "created_at",
            "transfer_to",
            "groom_name",
            "groom_dob",
            "groom_age",
            "groom_house_name",
            "groom_family_name",
            "groom_father",
            "groom_mother",
            "groom_place",
            "groom_confession_date",
            "bride_name",
            "bride_dob",
            "bride_age",
            "bride_house_name",
            "bride_family_name",
            "bride_father",
            "bride_mother",
            "bride_place",
            "bride_confession_date",
        ]


# ============================================================
# INACTIVE MEMBER SERIALIZER
# ============================================================
class InactiveMemberSerializer(serializers.ModelSerializer):
    family_name = serializers.CharField(source="family.family_name", read_only=True)

    class Meta:
        model = Member
        fields = [
            "id",
            "name",
            "gender",
            "dob",
            "marital_status",
            "house_name",
            "family_name",
            "is_active",
            "inactive_reason",
            "inactive_date",
        ]
        
#Death Register
from django.utils.dateparse import parse_date

class DeathRegisterSerializer(serializers.ModelSerializer):

    member = serializers.PrimaryKeyRelatedField(read_only=True)
    member_name = serializers.CharField(source="member.name", read_only=True)
    family_name = serializers.CharField(
        source="member.family.family_name",
        read_only=True
    )

    house_name = serializers.CharField(
        source="member.house_name",
        read_only=True
    )

    # 🔥 FIX: Add explicit date fields with input formats
    died_on = serializers.DateField(
        input_formats=['%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d', '%d/%m/%Y'],
        required=False,
        allow_null=True
    )
    funeral_on = serializers.DateField(
        input_formats=['%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d', '%d/%m/%Y'],
        required=False,
        allow_null=True
    )

    class Meta:
        model = DeathRegister
        fields = "__all__"
        read_only_fields = ("reg_no", "church", "member", "status")

    def validate(self, data):
        instance = self.instance
        member = instance.member if instance else None

        if not member:
            raise serializers.ValidationError("Member is required.")

        # 🔥 Member must already be expired (safety check)
        if not member.expired:
            raise serializers.ValidationError(
                "Member must be marked expired first."
            )

        # 🔥 Get dates from validated data (they'll already be date objects)
        died_on = data.get("died_on")
        funeral_on = data.get("funeral_on")
        
        # If instance exists and date not in data, get from instance
        if died_on is None and instance:
            died_on = instance.died_on
        if funeral_on is None and instance:
            funeral_on = instance.funeral_on

        tomb_type = data.get("tomb_type", instance.tomb_type if instance else None)
        tomb_charge = data.get("tomb_charge", instance.tomb_charge if instance else None)
        reason_of_death = data.get("reason_of_death", instance.reason_of_death if instance else None)

        # 🔥 Required validations for completion readiness
        if not died_on:
            raise serializers.ValidationError({
                "died_on": "Date of death is required."
            })

        if not funeral_on:
            raise serializers.ValidationError({
                "funeral_on": "Funeral date is required."
            })

        if not tomb_type:
            raise serializers.ValidationError({
                "tomb_type": "Tomb type is required."
            })

        if tomb_charge is None:
            raise serializers.ValidationError({
                "tomb_charge": "Tomb charge must be provided."
            })
        
        if not reason_of_death or not reason_of_death.strip():
            raise serializers.ValidationError({
                "reason_of_death": "Reason of death is required."
            })
            
        # 🔥 Additional validation: funeral should be after death
        if died_on and funeral_on and funeral_on < died_on:
            raise serializers.ValidationError({
                "funeral_on": "Funeral date cannot be before death date."
            })
            
        return data
    
from django.contrib.auth import get_user_model
User = get_user_model()
class FamilyHeadUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Member
        fields = [
            "name",
            "baptismal_name",
            "gender",
            "email",
            "marital_status",
            "spouse_name",
            "dob",
            "mobile_no",
            "phone_no",
            "blood_group",
            "father_name",
            "mother_name",
            "date_of_baptism",
            "parish_of_baptism",
            "educational_qualification",
            "sunday_school_qualification",
            "profession",
            "ward",
            "grade",
            "family_image",
            "joining_date",
            "transferred_from",
            "address",
            "relationship"
        ]

    def validate(self, data):
        instance = self.instance

        if not instance.is_family_head:
            raise serializers.ValidationError(
                "This member is not a family head."
            )

        # Prevent duplicate email
        if "email" in data:
            email = data["email"]
            if Member.objects.filter(email=email).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError({
                    "email": "Email already exists."
                })

        return data

    def update(self, instance, validated_data):
        new_email = validated_data.get("email", instance.email)

        with transaction.atomic():

            member = super().update(instance, validated_data)

            # Update linked user email if head email changed
            if instance.is_family_head and instance.user:
                user = instance.user

                if user.email != new_email:
                    user.email = new_email
                    user.username = new_email  # username used for login
                    user.save(update_fields=["email", "username"])

        return member
    

class RegisterSettingSerializer(serializers.ModelSerializer):

    class Meta:
        model = RegisterSetting
        fields = "__all__"
        read_only_fields = ("church",)

#priest master 
class PriestNameSerializer(serializers.ModelSerializer):

    class Meta:
        model = Church
        fields = ["vicar", "asst_vicar1", "asst_vicar2", "asst_vicar3"]



class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Events
        fields = '__all__'
        read_only_fields = ("church", "created_at")

class OfferingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offering
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

    def validate(self, data):
        is_cancelled = data.get("is_cancelled", getattr(self.instance, "is_cancelled", False))
        cancel_reason = data.get("cancel_reason", getattr(self.instance, "cancel_reason", ""))
        if is_cancelled and not cancel_reason:
            raise serializers.ValidationError(
                {"cancel_reason": "Cancel reason is required when marking as cancelled."}
            )
        return data
    
class VisitorMasterSerializer(serializers.ModelSerializer):

    class Meta:
        model = VisitorMaster
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_visitor_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Visitor name cannot be empty")
        return value
    
class SubscriptionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Subscription
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

    def validate(self, data):
        start_date = data.get("start_date", getattr(self.instance, "start_date", None))
        end_date = data.get("end_date", getattr(self.instance, "end_date", None))

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date cannot be before start date."}
            )

        is_cancelled = data.get("is_cancelled", getattr(self.instance, "is_cancelled", False))
        cancel_reason = data.get("cancel_reason", getattr(self.instance, "cancel_reason", ""))
        if is_cancelled and not cancel_reason:
            raise serializers.ValidationError(
                {"cancel_reason": "Cancel reason is required when marking as cancelled."}
            )

        return data
    
class AccountGroupMasterSerializer(serializers.ModelSerializer):
    under_group_name = serializers.CharField(
        source="under_group.group_name", read_only=True
    )

    class Meta:
        model = AccountGroupMaster
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_group_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Group name cannot be empty")
        return value

    def validate(self, data):
        # Prevent a group from being set as its own parent
        under_group = data.get("under_group")
        if under_group and self.instance and under_group.id == self.instance.id:
            raise serializers.ValidationError(
                {"under_group": "A group cannot be its own parent."}
            )
        return data
    
class AccountLedgerMasterSerializer(serializers.ModelSerializer):
    account_group_name = serializers.CharField(
        source="account_group.group_name", read_only=True
    )

    class Meta:
        model = AccountLedgerMaster
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_ledger_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Ledger name cannot be empty")
        return value
    
class PaymentMasterSerializer(serializers.ModelSerializer):
    account_ledger_name = serializers.CharField(
        source="account_ledger.ledger_name", read_only=True
    )

    class Meta:
        model = PaymentMaster
        fields = "__all__"
        read_only_fields = ("church",)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

    def validate_party_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Party name cannot be empty")
        return value
    
class QurbanaReceiptsSerializer(serializers.ModelSerializer):

    class Meta:
        model = QurbanaReceipts
        fields = "__all__"
        read_only_fields = ("church")

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty")
        return value


class CommitteeMasterSerializer(serializers.ModelSerializer):

    class Meta:
        model = CommitteeMaster
        fields = "__all__"
        read_only_fields = ("church",)

    def validate(self, data):
        from_date = data.get("committee_from_date", getattr(self.instance, "committee_from_date", None))
        to_date = data.get("committee_to_date", getattr(self.instance, "committee_to_date", None))
        if from_date and to_date and to_date < from_date:
            raise serializers.ValidationError(
                {"committee_to_date": "To date cannot be before from date."}
            )
        return data


class CommitteeMemberSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.name", read_only=True)
    designation_name = serializers.CharField(
        source="designation.designation_name", read_only=True
    )
    committee_name = serializers.CharField(
        source="committee.committee_name", read_only=True
    )

    class Meta:
        model = CommitteeMember
        fields = "__all__"
        read_only_fields = ("church",)

class MemberDirectorySerializer(serializers.ModelSerializer):
    relationship = serializers.CharField(source="relationship.name", read_only=True)
    family_name = serializers.CharField(source="family.family_name", read_only=True)
    ward_name = serializers.CharField(source="ward.ward_name", read_only=True)
    grade = serializers.CharField(source="grade.name", read_only=True)

    class Meta:
        model = Member
        fields = [
            "id",
            "name",
            "gender",
            "age",
            "email",
            "mobile_no",
            "phone_no",
            "marital_status",
            "spouse_name",
            "relationship",
            "is_family_head",
            "family_name",
            "ward_name",
            "grade",
            "profession",
            "blood_group",
            "father_name",
            "mother_name",
            "house_name",
            "address",
        ]