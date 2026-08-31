from datetime import date

from rest_framework import serializers
from .models import Baptism, Bill, Church, DeathRegister, Designation, DheshaKuri, Diocese, Events, Grade, Priest,  RegisterSetting, Relationship, TombFee, TombType, UpgradeRequest,  Ward, Family, Member, Offering, VisitorMaster, Subscription, AccountGroupMaster, AccountLedgerMaster, PaymentMaster,  QurbanaReceipts, CommitteeMaster, CommitteeMember
from .services import can_add_member, generate_folio_number, generate_register_number
from rest_framework import serializers
from .models import Package
from .models import ChurchSubscription, Package
from django.utils import timezone


from rest_framework import serializers
from registry.models import Diocese

class DioceseSerializer(serializers.ModelSerializer):
    """
    Full Diocese serializer with all fields
    """
    country_name = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Diocese
        fields = [
            'id',
            'name',
            'metropolitan_name',
            'email',
            'contact_details',
            'address',
            'city',
            'state',
            'country',
            'country_name',
            'full_address',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_country_name(self, obj):
        """Get the country name from the country field"""
        return obj.country.name if obj.country else None
    
    def get_full_address(self, obj):
        """Get the complete formatted address"""
        return obj.get_full_address()

class DioceseListSerializer(serializers.ModelSerializer):
    """
    Simplified Diocese serializer for list views
    """
    country_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Diocese
        fields = [
            'id',
            'name',
            'metropolitan_name',
            'city',
            'state',
            'country',
            'country_name',
            'is_active'
        ]
    
    def get_country_name(self, obj):
        return obj.country.name if obj.country else None

class DioceseCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating Diocese
    """
    class Meta:
        model = Diocese
        fields = [
            'name',
            'metropolitan_name',
            'email',
            'contact_details',
            'address',
            'city',
            'state',
            'country',
        ]
    
    def validate_email(self, value):
        """Validate that email is unique"""
        if Diocese.objects.filter(email=value).exists():
            raise serializers.ValidationError("A diocese with this email already exists.")
        return value
    
    def validate(self, data):
        """Validate that required fields are present"""
        required_fields = ['name', 'email', 'address', 'city', 'state', 'country']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: f"{field} is required."})
        return data

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


from rest_framework import serializers
from .models import Package, Church, ChurchSubscription, Bill

class PackageSerializer(serializers.ModelSerializer):
    """Admin Package Serializer"""
    is_in_use = serializers.BooleanField(read_only=True)
    church_count = serializers.IntegerField(read_only=True)
    can_delete = serializers.BooleanField(read_only=True)
    can_edit = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Package
        fields = [
            "id",
            "code",
            "name",
            "member_limit",
            "rate_per_member_monthly",
            "rate_per_member_yearly",
            "is_active",
            "is_in_use",
            "church_count",
            "can_delete",
            "can_edit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ['code', 'created_at', 'updated_at']

class SubscribeSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()
    billing_cycle = serializers.ChoiceField(choices=['MONTHLY', 'YEARLY'])
    capacity = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, data):
        package_id = data.get('package_id')
        billing_cycle = data.get('billing_cycle')
        capacity = data.get('capacity')
        
        try:
            package = Package.objects.get(id=package_id, is_active=True)
        except Package.DoesNotExist:
            raise serializers.ValidationError("Package not found or inactive")
        
        data['package'] = package
        
        # Validate capacity
        if package.member_limit:
            if capacity and capacity > package.member_limit:
                raise serializers.ValidationError(
                    f"Capacity exceeds package limit of {package.member_limit}"
                )
        
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "church",
            "created_at",
            "updated_at",
        )

    def validate_family_name(self, value):
        value = value.strip().capitalize()
        church = self.context["church"]

        qs = Family.objects.filter(
            church=church,
            family_name=value
        )

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
        read_only_fields = ("church", "created_at", "updated_at")  # ✅ Added timestamps


class TombFeeSerializer(serializers.ModelSerializer):

    class Meta:
        model = TombFee
        fields = "__all__"
        read_only_fields = ("church", "created_at", "updated_at")  # ✅ Added timestamps

    def validate(self, data):
        church = self.context["request"].user.church
        tomb_type = data.get("tomb_type")

        # ✅ Check if tomb_type exists before accessing .church
        if not tomb_type:
            raise serializers.ValidationError(
                {"tomb_type": "This field is required."}
            )

        # ✅ Verify tomb_type belongs to this church
        if tomb_type.church != church:
            raise serializers.ValidationError(
                {"tomb_type": "Invalid tomb type for this church."}
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

from datetime import date as date_cls

from django.db.models import Q
from rest_framework import serializers

from registry.models import Priest


class PriestSerializer(serializers.ModelSerializer):

    # ========================================================
    # DESIGNATION
    # ========================================================

    designation_label = serializers.CharField(
        source="get_designation_display",
        read_only=True
    )

    # ========================================================
    # IMAGE URL
    # ========================================================

    image_url = serializers.SerializerMethodField(
        read_only=True
    )

    # ========================================================
    # STATUS
    # ========================================================

    status = serializers.SerializerMethodField(
        read_only=True
    )

    class Meta:
        model = Priest

        fields = [
            # ==================================================
            # ID / CHURCH
            # ==================================================

            "id",
            "church",

            # ==================================================
            # IMAGE
            # ==================================================

            "image",
            "image_url",

            # ==================================================
            # BASIC INFORMATION
            # ==================================================

            "name",
            "family_name",
            "designation",
            "designation_label",
            "phone_number",

            # ==================================================
            # SERVICE INFORMATION
            # ==================================================

            "date_from",
            "date_to",

            # ==================================================
            # ADDRESS
            # ==================================================

            "address_line1",
            "address_line2",
            "city",
            "state",
            "country",
            "postal_code",

            # ==================================================
            # ACTIVE
            # ==================================================

            "is_active",

            # ==================================================
            # CALCULATED
            # ==================================================

            "status",

            # ==================================================
            # RECORD INFORMATION
            # ==================================================

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "church",
            "image_url",
            "designation_label",
            "status",
            "created_at",
            "updated_at",
        ]

    # ========================================================
    # IMAGE URL
    # ========================================================

    def get_image_url(self, obj):

        request = self.context.get("request")

        if not obj.image:
            return None

        try:
            url = obj.image.url

            if request:
                return request.build_absolute_uri(url)

            return url

        except Exception:
            return None

    # ========================================================
    # STATUS
    # ========================================================

    def get_status(self, obj):

        today = date_cls.today()

        # ----------------------------------------------------
        # Manually inactive
        # ----------------------------------------------------

        if not obj.is_active:
            return "PREVIOUS"

        # ----------------------------------------------------
        # Service hasn't started
        # ----------------------------------------------------

        if obj.date_from and obj.date_from > today:
            return "UPCOMING"

        # ----------------------------------------------------
        # Currently serving
        # ----------------------------------------------------

        if obj.date_from and obj.date_from <= today:

            # Ongoing
            if obj.date_to is None:
                return "CURRENT"

            # End date has not passed
            if obj.date_to >= today:
                return "CURRENT"

        # ----------------------------------------------------
        # Previous
        # ----------------------------------------------------

        return "PREVIOUS"

    # ========================================================
    # VALIDATION
    # ========================================================

    def validate(self, data):

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return data

        church = getattr(
            request.user,
            "church",
            None
        )

        if not church:
            raise serializers.ValidationError({
                "detail":
                    "No church is associated with this account."
            })

        # ====================================================
        # VALUES
        # ====================================================

        designation = data.get(
            "designation",
            getattr(
                self.instance,
                "designation",
                "MAIN"
            )
        )

        date_from = data.get(
            "date_from",
            getattr(
                self.instance,
                "date_from",
                None
            )
        )

        date_to = data.get(
            "date_to",
            getattr(
                self.instance,
                "date_to",
                None
            )
        )

        is_active = data.get(
            "is_active",
            getattr(
                self.instance,
                "is_active",
                True
            )
        )

        today = date_cls.today()

        # ====================================================
        # DATE FROM REQUIRED
        # ====================================================

        if not date_from:

            raise serializers.ValidationError({
                "date_from":
                    "Serving-from date is required."
            })

        # ====================================================
        # DATE VALIDATION
        # ====================================================

        if date_to and date_from:

            if date_to < date_from:

                raise serializers.ValidationError({
                    "date_to":
                        "Serving-to date cannot be earlier "
                        "than serving-from date."
                })

        # ====================================================
        # CURRENTLY SERVING
        # ====================================================

        if is_active and date_to:

            raise serializers.ValidationError({
                "date_to":
                    "A currently serving vicar cannot have "
                    "a Serving To date."
            })

        # ====================================================
        # PREVIOUS VICAR
        # ====================================================

        if not is_active and not date_to:

            raise serializers.ValidationError({
                "date_to":
                    "Serving-to date is required for a "
                    "previous vicar."
            })

        # ====================================================
        # ASSISTANT VICAR
        #
        # MAXIMUM 3 CURRENT ASSISTANT VICARS
        #
        # Assistants CAN overlap.
        # ====================================================

        if designation == "ASSISTANT" and is_active:

            assistant_count = Priest.objects.filter(
                church=church,
                designation="ASSISTANT",
                is_active=True,

                # Already started serving
                date_from__isnull=False,
                date_from__lte=today
            ).filter(
                # Still serving
                Q(date_to__isnull=True) |
                Q(date_to__gte=today)
            )

            # Don't count the same record when editing
            if self.instance:

                assistant_count = assistant_count.exclude(
                    pk=self.instance.pk
                )

            if assistant_count.count() >= 3:

                raise serializers.ValidationError({
                    "designation":
                        "Maximum of 3 active Assistant "
                        "Vicars are allowed."
                })

        # ====================================================
        # VICAR
        #
        # ONLY ONE VICAR
        #
        # Assistant Vicars are completely ignored here.
        # ====================================================

        if designation == "MAIN":

            existing_vicars = Priest.objects.filter(
                church=church,
                designation="MAIN"
            )

            # Don't compare with itself during edit
            if self.instance:

                existing_vicars = existing_vicars.exclude(
                    pk=self.instance.pk
                )

            for existing in existing_vicars:

                existing_start = existing.date_from
                existing_end = existing.date_to

                if not existing_start:
                    continue

                # ============================================
                # EXISTING VICAR IS ONGOING
                # ============================================

                if existing_end is None:

                    raise serializers.ValidationError({
                        "date_from": (
                            f"{existing.name} is already "
                            "serving as Vicar until ongoing. "
                            "The service period cannot overlap."
                        )
                    })

                # ============================================
                # EXISTING VICAR HAS AN END DATE
                # ============================================

                # New Vicar starts on or before old Vicar ends
                if date_from <= existing_end:

                    until = existing_end.strftime(
                        "%d %b %Y"
                    )

                    raise serializers.ValidationError({
                        "date_from": (
                            f"{existing.name} is already "
                            f"serving as Vicar until {until}. "
                            "The service period cannot overlap."
                        )
                    })

        # ====================================================
        # DONE
        # ====================================================

        return data
from datetime import date

from django.db import DataError, IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import Member

import logging


logger = logging.getLogger(__name__)

# ============================================================
# CUSTOM USER MODEL
# ============================================================

User = get_user_model()


# ============================================================
# FAMILY MEMBER SERIALIZER
# ============================================================

class MemberSerializer(serializers.ModelSerializer):

    class Meta:
        model = Member
        fields = "__all__"

        read_only_fields = (
            "church",
            "age",
            "ward",
            "address",
            "family_image",
        )

    # ========================================================
    # DATE OF BIRTH
    # ========================================================

    def validate_dob(self, value):

        if value and value > date.today():
            raise serializers.ValidationError(
                "Date of birth cannot be in the future."
            )

        return value

    # ========================================================
    # EMAIL
    # ========================================================

    def validate_email(self, value):

        if not value:
            return value

        qs = Member.objects.filter(
            email=value
        )

        if self.instance:
            qs = qs.exclude(
                pk=self.instance.pk
            )

        if qs.exists():
            raise serializers.ValidationError(
                "This email is already used by another member in the system."
            )

        if User.objects.filter(
            username=value
        ).exists():

            if (
                self.instance
                and self.instance.email == value
            ):
                pass
            else:
                raise serializers.ValidationError(
                    "This email is already used as a login username."
                )

        return value

    # ========================================================
    # SPOUSE
    # ========================================================

    def validate_spouse(self, value):

        if not value:
            return value

        # ----------------------------------------------------
        # Cannot be own spouse
        # ----------------------------------------------------

        if (
            self.instance
            and value.pk == self.instance.pk
        ):
            raise serializers.ValidationError(
                "A member cannot be their own spouse."
            )

        # ----------------------------------------------------
        # Gender validation
        # ----------------------------------------------------

        if (
            self.instance
            and self.instance.gender == value.gender
        ):
            raise serializers.ValidationError(
                "Spouse must be of opposite gender."
            )

        # ----------------------------------------------------
        # Already married
        # ----------------------------------------------------

        if (
            value.spouse
            and (
                not self.instance
                or value.spouse.pk != self.instance.pk
            )
        ):
            raise serializers.ValidationError(
                "This person is already married to someone else."
            )

        # ----------------------------------------------------
        # Expired member
        # ----------------------------------------------------

        if value.expired:
            raise serializers.ValidationError(
                "Cannot set an expired member as spouse."
            )

        return value

    # ========================================================
    # MAIN VALIDATION
    # ========================================================

    def validate(self, data):

        # ====================================================
        # IMPORTANT
        # ====================================================
        #
        # DO NOT call can_add_member() here.
        #
        # Subscription capacity applies ONLY to FAMILY HEADS.
        #
        # Dependents are allowed under an existing family head
        # and DO NOT consume subscription capacity.
        #
        # ====================================================

        # ====================================================
        # CREATE
        # ====================================================

        if not self.instance:

            # ------------------------------------------------
            # Family head cannot be created through this API
            # ------------------------------------------------

            if data.get("is_family_head"):

                raise serializers.ValidationError({
                    "is_family_head":
                        "Use family head API to create family head."
                })

            # ------------------------------------------------
            # Required family
            # ------------------------------------------------

            family = data.get("family")

            if not family:

                raise serializers.ValidationError({
                    "family":
                        "Family is required."
                })

            # ------------------------------------------------
            # House information
            # ------------------------------------------------

            house_name = data.get(
                "house_name"
            )

            house_sequence = data.get(
                "house_sequence",
                1
            )

            if not house_name:

                raise serializers.ValidationError({
                    "house_name":
                        "House name is required."
                })

            # ------------------------------------------------
            # Address cannot be manually assigned
            # ------------------------------------------------

            if data.get("address"):

                raise serializers.ValidationError({
                    "address":
                        "Address should not be assigned manually."
                })

            # ------------------------------------------------
            # Ward cannot be manually assigned
            # ------------------------------------------------

            if data.get("ward"):

                raise serializers.ValidationError({
                    "ward":
                        "Ward should not be assigned manually."
                })

            # ------------------------------------------------
            # Family image only for family head
            # ------------------------------------------------

            if data.get("family_image"):

                raise serializers.ValidationError({
                    "family_image":
                        "Family image can only be uploaded for family head."
                })

            # ------------------------------------------------
            # Find active family head for this household
            # ------------------------------------------------

            head = Member.objects.filter(
                family=family,
                house_name__iexact=house_name.strip(),
                house_sequence=house_sequence,
                is_family_head=True,
                is_active=True,
            ).first()

            # ------------------------------------------------
            # If exact household head doesn't exist
            # ------------------------------------------------

            if not head:

                # --------------------------------------------
                # Check whether same house has a head with
                # another sequence number
                # --------------------------------------------

                head_with_different_seq = Member.objects.filter(
                    family=family,
                    house_name__iexact=house_name.strip(),
                    is_family_head=True,
                    is_active=True,
                ).first()

                if head_with_different_seq:

                    raise serializers.ValidationError({
                        "house_name":
                            f"Cannot add member. Active head exists "
                            f"but with house_sequence="
                            f"{head_with_different_seq.house_sequence}. "
                            f"Please use "
                            f"house_sequence="
                            f"{head_with_different_seq.house_sequence}."
                    })

                # --------------------------------------------
                # No active head
                # --------------------------------------------

                raise serializers.ValidationError({
                    "house_name":
                        "Cannot add member. No active head for this house."
                })

        # ====================================================
        # UPDATE
        # ====================================================

        else:

            instance = self.instance

            # ------------------------------------------------
            # Relationship
            # ------------------------------------------------

            relationship = data.get(
                "relationship",
                instance.relationship
            )

            # ------------------------------------------------
            # Family cannot be changed here
            # ------------------------------------------------

            family = instance.family

            # ------------------------------------------------
            # Expired cannot be manually changed
            # ------------------------------------------------

            if "expired" in data:

                raise serializers.ValidationError({
                    "expired":
                        "Use mark-dead API to mark a member as deceased."
                })

            # ------------------------------------------------
            # Family head cannot be assigned here
            # ------------------------------------------------

            if data.get("is_family_head"):

                raise serializers.ValidationError({
                    "is_family_head":
                        "Use family head API to assign family head."
                })

            # ------------------------------------------------
            # Family image
            # ------------------------------------------------

            if (
                "family_image" in data
                and not instance.is_family_head
            ):

                raise serializers.ValidationError({
                    "family_image":
                        "Only family head can have family image."
                })

            # ------------------------------------------------
            # Ward cannot be changed
            # ------------------------------------------------

            if "ward" in data:

                raise serializers.ValidationError({
                    "ward":
                        "Ward cannot be modified here."
                })

            # ------------------------------------------------
            # House sequence cannot be changed
            # ------------------------------------------------

            if (
                "house_sequence" in data
                and data["house_sequence"]
                != instance.house_sequence
            ):

                raise serializers.ValidationError({
                    "house_sequence":
                        "House sequence cannot be changed after creation."
                })

            # ------------------------------------------------
            # Find active head
            # ------------------------------------------------

            head = Member.objects.filter(
                family=family,
                house_name=instance.house_name,
                house_sequence=instance.house_sequence,
                is_family_head=True,
                is_active=True,
            ).first()

            # ------------------------------------------------
            # Family head cannot have relationship
            # ------------------------------------------------

            if (
                instance.is_family_head
                and relationship
            ):

                raise serializers.ValidationError({
                    "relationship":
                        "Family head cannot have a relationship."
                })

            # =================================================
            # RELATIONSHIP VALIDATION
            # =================================================

            if relationship:

                rel_name = relationship.name

                # ------------------------------------------------
                # Father / Mother
                # ------------------------------------------------

                if rel_name in [
                    "Father",
                    "Mother",
                ]:

                    existing = Member.objects.filter(
                        family=family,
                        relationship__name=rel_name,
                        expired=False,
                    ).exclude(
                        pk=instance.pk
                    )

                    if existing.exists():

                        raise serializers.ValidationError({
                            "relationship":
                                f"{rel_name} already exists in this family."
                        })

                # ------------------------------------------------
                # Son / Daughter
                # ------------------------------------------------

                if rel_name in [
                    "Son",
                    "Daughter",
                ]:

                    if not head:

                        raise serializers.ValidationError({
                            "relationship":
                                "Cannot assign child relationship without active head."
                        })

                    if (
                        not instance.dob
                        or not head.dob
                    ):

                        raise serializers.ValidationError({
                            "dob":
                                "DOB required to validate child relationship."
                        })

                    if instance.dob <= head.dob:

                        raise serializers.ValidationError({
                            "relationship":
                                "Child must be younger than family head."
                        })

                # ------------------------------------------------
                # In-laws
                # ------------------------------------------------

                if rel_name in [
                    "Son_In_Low",
                    "Daughter_In_Low",
                ]:

                    if not instance.spouse:

                        raise serializers.ValidationError({
                            "relationship":
                                "In-law must have spouse assigned."
                        })

                    if instance.spouse.family != family:

                        raise serializers.ValidationError({
                            "relationship":
                                "Spouse must be in the same family."
                        })

        return data

    # ============================================================
    # CREATE MEMBER
    # ============================================================

    def create(self, validated_data):

        family = validated_data.get(
            "family"
        )

        house_name = validated_data.get(
            "house_name"
        )

        house_sequence = validated_data.get(
            "house_sequence",
            1
        )

        # --------------------------------------------------------
        # Find family head
        # --------------------------------------------------------

        head = Member.objects.filter(
            family=family,
            house_name__iexact=house_name.strip(),
            house_sequence=house_sequence,
            is_family_head=True,
            is_active=True,
        ).first()

        # --------------------------------------------------------
        # Safety check
        # --------------------------------------------------------

        if not head:

            raise serializers.ValidationError({
                "house_name":
                    "Cannot add member. No active head for this house."
            })

        # --------------------------------------------------------
        # Automatically inherit head information
        # --------------------------------------------------------

        validated_data["ward"] = head.ward

        validated_data["church"] = self.context[
            "church"
        ]

        validated_data["family_image"] = head.family_image

        validated_data["address"] = head.address

        # --------------------------------------------------------
        # Create member
        # --------------------------------------------------------

        try:

            return super().create(
                validated_data
            )

        # --------------------------------------------------------
        # Database data error
        # --------------------------------------------------------

        except DataError as e:

            raise serializers.ValidationError({
                "dob":
                    f"Please check the date of birth. Error: {str(e)}"
            })

        # --------------------------------------------------------
        # Integrity error
        # --------------------------------------------------------

        except IntegrityError as e:

            logger.error(
                "Member creation IntegrityError: %s",
                str(e),
                exc_info=True,
            )

            raise serializers.ValidationError({
                "non_field_errors":
                    f"This member could not be saved. Error: {str(e)}"
            })

        # --------------------------------------------------------
        # Django validation error
        # --------------------------------------------------------

        except DjangoValidationError as e:

            raise serializers.ValidationError({
                "non_field_errors":
                    str(e)
            })

    # ============================================================
    # UPDATE MEMBER
    # ============================================================

    def update(
        self,
        instance,
        validated_data
    ):

        try:

            return super().update(
                instance,
                validated_data
            )

        # --------------------------------------------------------
        # Database data error
        # --------------------------------------------------------

        except DataError as e:

            raise serializers.ValidationError({
                "dob":
                    f"Please check the date of birth. Error: {str(e)}"
            })

        # --------------------------------------------------------
        # Integrity error
        # --------------------------------------------------------

        except IntegrityError as e:

            logger.error(
                "Member update IntegrityError: %s",
                str(e),
                exc_info=True,
            )

            raise serializers.ValidationError({
                "non_field_errors":
                    f"This member could not be saved. Error: {str(e)}"
            })

        # --------------------------------------------------------
        # Django validation error
        # --------------------------------------------------------

        except DjangoValidationError as e:

            raise serializers.ValidationError({
                "non_field_errors":
                    str(e)
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


from registry.models import TaxType, TaxRate

class TaxTypeSerializer(serializers.ModelSerializer):
    """Serializer for Tax Type"""
    country_name = serializers.SerializerMethodField()
    tax_rate_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = TaxType
        fields = [
            'id',
            'tax_type_code',
            'tax_type_name',
            'country',
            'country_name',
            'is_active',
            'description',
            'tax_rate_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_country_name(self, obj):
        if obj.country:
            return obj.country.name
        return None


class TaxRateSerializer(serializers.ModelSerializer):
    """Serializer for Tax Rate"""
    tax_type_name = serializers.CharField(source='tax_type.tax_type_name', read_only=True)
    tax_type_code = serializers.CharField(source='tax_type.tax_type_code', read_only=True)
    is_effective = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = TaxRate
        fields = [
            'id',
            'tax_rate_code',
            'tax_rate_name',
            'tax_type',
            'tax_type_name',
            'tax_type_code',
            'rate_percentage',
            'effective_from',
            'effective_until',
            'is_active',
            'is_effective',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_is_effective(self, obj):
        return obj.is_effective()

class TaxRateListSerializer(serializers.ModelSerializer):
    """Simplified Tax Rate Serializer for list view"""
    tax_type_display = serializers.CharField(source='tax_type.tax_type_name', read_only=True)
    
    class Meta:
        model = TaxRate
        fields = [
            'id',
            'tax_rate_code',
            'tax_rate_name',
            'tax_type_display',
            'rate_percentage',
            'effective_from',
            'effective_until',
            'is_active',
        ]


class TaxTypeListSerializer(serializers.ModelSerializer):
    """Simplified Tax Type Serializer for list view"""
    tax_rate_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = TaxType
        fields = [
            'id',
            'tax_type_code',
            'tax_type_name',
            'country',
            'is_active',
            'tax_rate_count',
            'created_at',
        ]



class UpgradeSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()
    billing_cycle = serializers.ChoiceField(
        choices=['MONTHLY', 'YEARLY'], 
        required=True
    )
    capacity = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        church = self.context.get("church")
        
        if not church:
            raise serializers.ValidationError("Church context is required")

        subscription = getattr(church, "churchsubscription", None)
        if not subscription or not subscription.is_active:
            raise serializers.ValidationError("No active subscription")

        try:
            new_package = Package.objects.get(id=data["package_id"], is_active=True)
        except Package.DoesNotExist:
            raise serializers.ValidationError("Invalid package or package is inactive")

        # Validate capacity
        capacity = data.get('capacity')
        if capacity:
            if new_package.member_limit and capacity > new_package.member_limit:
                raise serializers.ValidationError({
                    'capacity': f"Capacity exceeds package limit of {new_package.member_limit}"
                })

        # Check if upgrading to a higher package (based on member_limit)
        current_package = subscription.package
        if new_package.member_limit and current_package.member_limit:
            if new_package.member_limit <= current_package.member_limit:
                raise serializers.ValidationError(
                    "Upgrade must be to a package with higher member limit"
                )
        
        # Check if trying to upgrade to the same package
        if new_package.id == current_package.id:
            raise serializers.ValidationError(
                "Cannot upgrade to the same package"
            )

        # Check for pending bills
        from registry.models import Bill
        if Bill.objects.filter(
            subscription=subscription,
            status='UNPAID'
        ).exists():
            raise serializers.ValidationError(
                "Please clear pending bill before requesting upgrade"
            )

        data["subscription"] = subscription
        data["new_package"] = new_package
        data["current_package"] = current_package
        
        return data

    def create(self, validated_data):
        """
        Create upgrade request
        """
        from registry.models import UpgradeRequest
        
        subscription = validated_data["subscription"]
        new_package = validated_data["new_package"]
        
        upgrade_request = UpgradeRequest.objects.create(
            church=subscription.church,
            current_package=subscription.package,
            requested_package=new_package,
            status='PENDING',
            reason=validated_data.get('reason', ''),
        )
        
        return upgrade_request

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
# registry/serializers.py

class UpgradeRequestSerializer(serializers.ModelSerializer):
    requested_package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.filter(is_active=True)  # Changed from is_trial=False
    )
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    current_package_name = serializers.CharField(source='current_package.name', read_only=True)
    requested_package_name = serializers.CharField(source='requested_package.name', read_only=True)

    class Meta:
        model = UpgradeRequest
        fields = [
            "id",
            "church",
            "church_name",
            "current_package",
            "current_package_name",
            "requested_package",
            "requested_package_name",
            "requested_capacity",
            "reason",
            "status",
            "admin_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "church",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        package = attrs.get("requested_package")
        capacity = attrs.get("requested_capacity")
        church = self.context.get('church') or attrs.get('church')
        
        # Get current subscription
        if church:
            subscription = getattr(church, "churchsubscription", None)
            if subscription:
                attrs['current_package'] = subscription.package
        
        # Validate package is active
        if not package.is_active:
            raise serializers.ValidationError(
                {"requested_package": "Requested package is not active"}
            )
        
        # Validate capacity against member limit
        if package.member_limit:
            if capacity and capacity > package.member_limit:
                raise serializers.ValidationError(
                    {"requested_capacity": f"Capacity cannot exceed package limit of {package.member_limit}"}
                )
        
        # Check if upgrading to the same package
        current_package = attrs.get('current_package')
        if current_package and package.id == current_package.id:
            raise serializers.ValidationError(
                {"requested_package": "Cannot upgrade to the same package"}
            )
        
        # Check if it's a higher package (based on member_limit)
        if current_package and package.member_limit and current_package.member_limit:
            if package.member_limit <= current_package.member_limit:
                raise serializers.ValidationError(
                    {"requested_package": "Must upgrade to a package with higher member limit"}
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
    
# registry/serializers.py - Complete corrected FamilyHeadCreateSerializer

class FamilyHeadCreateSerializer(serializers.ModelSerializer):
    # Override foreign key fields to handle ID inputs properly
    family = serializers.PrimaryKeyRelatedField(
        queryset=Family.objects.all(),
        required=True,
        allow_null=False,
        error_messages={
            'required': 'Family is required.',
            'does_not_exist': 'Invalid family selected.',
            'incorrect_type': 'Family must be a valid ID.'
        }
    )
    
    ward = serializers.PrimaryKeyRelatedField(
        queryset=Ward.objects.all(),
        required=True,
        allow_null=False,
        error_messages={
            'required': 'Ward is required.',
            'does_not_exist': 'Invalid ward selected.',
            'incorrect_type': 'Ward must be a valid ID.'
        }
    )
    
    grade = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(),
        required=False,
        allow_null=True,
        error_messages={
            'does_not_exist': 'Invalid grade selected.',
            'incorrect_type': 'Grade must be a valid ID.'
        }
    )
    
    # Override the image field to handle file uploads properly
    family_image = serializers.ImageField(
        required=False,
        allow_null=True,
        use_url=True,
        max_length=100
    )

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

        extra_kwargs = {
            # REQUIRED FIELDS - String fields support allow_blank
            "house_name": {
                "required": True,
                "allow_blank": False,
                "max_length": 255
            },
            "name": {
                "required": True,
                "allow_blank": False,
                "max_length": 255
            },
            "gender": {
                "required": True,
                "allow_blank": False,
            },
            "marital_status": {
                "required": True,
                "allow_blank": False,
            },
            "email": {
                "required": True,
                "allow_blank": False,
                "max_length": 254
            },
            
            # OPTIONAL STRING FIELDS (support allow_blank)
            "baptismal_name": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "spouse_name": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "mobile_no": {
                "required": False,
                "allow_blank": True,
                "max_length": 20
            },
            "phone_no": {
                "required": False,
                "allow_blank": True,
                "max_length": 20
            },
            "blood_group": {
                "required": False,
                "allow_blank": True,
                "max_length": 10
            },
            "father_name": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "mother_name": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "parish_of_baptism": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "educational_qualification": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "sunday_school_qualification": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "profession": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "transferred_from": {
                "required": False,
                "allow_blank": True,
                "max_length": 255
            },
            "address": {
                "required": False,
                "allow_blank": True,
                "max_length": 500
            },
            
            # OPTIONAL DATE FIELDS (support allow_null, NOT allow_blank)
            "dob": {
                "required": False,
                "allow_null": True
            },
            "date_of_baptism": {
                "required": False,
                "allow_null": True
            },
            "joining_date": {
                "required": False,
                "allow_null": True
            },
        }

    def validate(self, data):
        church = self.context["church"]
        
        family = data.get("family")
        ward = data.get("ward")
        email = data.get("email")
        house_name = data.get("house_name")
        
        # -----------------------------------------
        # FAMILY REQUIRED
        # -----------------------------------------
        if not family:
            raise serializers.ValidationError({
                "family": "Family is required."
            })
        
        # -----------------------------------------
        # FAMILY MUST BELONG TO CHURCH
        # -----------------------------------------
        if family.church_id != church.id:
            raise serializers.ValidationError({
                "family": "Invalid family selected."
            })
        
        # -----------------------------------------
        # HOUSE NAME
        # -----------------------------------------
        if not house_name or not house_name.strip():
            raise serializers.ValidationError({
                "house_name": "House name is required."
            })
        
        # -----------------------------------------
        # WARD
        # -----------------------------------------
        if not ward:
            raise serializers.ValidationError({
                "ward": "Ward is required for family head."
            })
        
        # -----------------------------------------
        # WARD MUST BELONG TO CHURCH
        # -----------------------------------------
        if ward.church_id != church.id:
            raise serializers.ValidationError({
                "ward": "Invalid ward selected."
            })
        
        # -----------------------------------------
        # EMAIL
        # -----------------------------------------
        if not email or not email.strip():
            raise serializers.ValidationError({
                "email": "Email is required for family head login."
            })
        
        # -----------------------------------------
        # EMAIL UNIQUENESS
        # -----------------------------------------
        if Member.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                "email": "A member with this email already exists."
            })
        
        # -----------------------------------------
        # GRADE VALIDATION (if provided)
        # -----------------------------------------
        grade = data.get("grade")
        if grade and grade.church_id != church.id:
            raise serializers.ValidationError({
                "grade": "Invalid grade selected."
            })
        
        # -----------------------------------------
        # ONLY ONE ACTIVE HEAD
        # -----------------------------------------
        existing_head = Member.objects.filter(
            family=family,
            house_name__iexact=house_name.strip(),
            is_family_head=True,
            is_active=True,
            expired=False,
        ).first()
        
        if existing_head:
            raise serializers.ValidationError({
                "house_name": f"This house already has an active head: {existing_head.name}."
            })
        
        return data

    def create(self, validated_data):
        church = self.context["church"]
        
        with transaction.atomic():
            register_no = generate_register_number(church, "HEAD")
            folio_no = generate_folio_number(church)
            
            validated_data["church"] = church
            validated_data["is_family_head"] = True
            validated_data["is_active"] = True
            validated_data["expired"] = False
            validated_data["register_number"] = register_no
            validated_data["folio_number"] = folio_no
            
            head = Member.objects.create(**validated_data)
            
        return head
    
# ============================================================
# FAMILY MEMBER SERIALIZER
# ============================================================

class FamilyMemberSerializer(serializers.ModelSerializer):

    relationship = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    family_name = serializers.SerializerMethodField()
    house_name = serializers.SerializerMethodField()
    family_image = serializers.SerializerMethodField()
    spouse_name = serializers.SerializerMethodField()

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
            "spouse_name",
            "blood_group",
            "is_family_head",
            "relationship",
            "grade_name",
            "family_name",
            "family_image",
            "house_name",
            "register_number",
            "folio_number",
        ]

    # ========================================================
    # RELATIONSHIP
    # ========================================================

    def get_relationship(self, obj):

        # Family head has no relationship
        if obj.is_family_head:
            return None

        if obj.relationship:
            return obj.relationship.name

        return None

    # ========================================================
    # GRADE
    # ========================================================

    def get_grade_name(self, obj):

        if obj.grade:
            return obj.grade.name

        return None

    # ========================================================
    # FAMILY
    # ========================================================

    def get_family_name(self, obj):

        if obj.family:
            return obj.family.family_name

        return None

    # ========================================================
    # HOUSE
    # ========================================================

    def get_house_name(self, obj):

        return obj.house_name

    # ========================================================
    # SPOUSE
    # ========================================================

    def get_spouse_name(self, obj):

        # Prefer actual member relationship
        if obj.spouse:
            return obj.spouse.name

        # Fallback to manually stored spouse name
        if obj.spouse_name:
            return obj.spouse_name

        return None

    # ========================================================
    # FAMILY IMAGE
    # ========================================================

    def get_family_image(self, obj):

        request = self.context.get(
            "request"
        )

        if not request:
            return None

        # ----------------------------------------------------
        # If this member is the family head
        # ----------------------------------------------------

        if (
            obj.is_family_head
            and obj.family_image
        ):

            return request.build_absolute_uri(
                obj.family_image.url
            )

        # ----------------------------------------------------
        # Find active head of SAME HOUSEHOLD
        # ----------------------------------------------------

        head = Member.objects.filter(
            family=obj.family,
            house_name__iexact=obj.house_name.strip(),
            house_sequence=obj.house_sequence,
            is_family_head=True,
            is_active=True,
        ).first()

        # ----------------------------------------------------
        # Return head image
        # ----------------------------------------------------

        if head and head.family_image:

            return request.build_absolute_uri(
                head.family_image.url
            )

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
class DeathRegisterSerializer(serializers.ModelSerializer):
    """
    Main serializer for DeathRegister.

    Date rules:
    - Date of death must be today.
    - Funeral date cannot be before date of death.
    - Funeral date can be today or up to 4 days after death.
    """

    # ---------------------------------------------------------
    # Read-only member information
    # ---------------------------------------------------------

    member_name = serializers.CharField(
        source="member.name",
        read_only=True
    )

    family_name = serializers.CharField(
        source="member.family.family_name",
        read_only=True
    )

    house_name = serializers.CharField(
        source="member.house_name",
        read_only=True
    )

    # ---------------------------------------------------------
    # Nested TombFee details
    # ---------------------------------------------------------

    tomb_fee_details = TombFeeSerializer(
        source="tomb_fee",
        read_only=True
    )

    # ---------------------------------------------------------
    # Backward compatibility / display fields
    # ---------------------------------------------------------

    tomb_type_name = serializers.CharField(
        source="tomb_fee.tomb_type.name",
        read_only=True,
        allow_null=True
    )

    tomb_charge = serializers.DecimalField(
        source="tomb_fee.tomb_fees",
        max_digits=15,
        decimal_places=3,
        read_only=True,
        allow_null=True
    )

    # ---------------------------------------------------------
    # Available tomb fees
    # ---------------------------------------------------------

    available_tomb_fees = serializers.SerializerMethodField()

    # ---------------------------------------------------------
    # Date fields
    # ---------------------------------------------------------

    died_on = serializers.DateField(
        input_formats=[
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%Y/%m/%d",
            "%d/%m/%Y",
        ],
        required=True,
        allow_null=False
    )

    funeral_on = serializers.DateField(
        input_formats=[
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%Y/%m/%d",
            "%d/%m/%Y",
        ],
        required=True,
        allow_null=False
    )

    # ---------------------------------------------------------
    # Meta
    # ---------------------------------------------------------

    class Meta:
        model = DeathRegister

        fields = [
            "id",
            "church",
            "reg_no",

            "member",
            "member_name",
            "family_name",
            "house_name",

            "died_on",
            "funeral_on",

            "tomb_fee",
            "tomb_fee_details",
            "tomb_type_name",
            "tomb_charge",
            "available_tomb_fees",

            "tomb_idn",
            "reason_of_death",
            "remarks",

            "created_at",
        ]

        read_only_fields = (
            "reg_no",
            "church",
            "member",
            "tomb_type_name",
            "tomb_charge",
            "tomb_fee_details",
            "available_tomb_fees",
        )

    # =========================================================
    # AVAILABLE TOMB FEES
    # =========================================================

    def get_available_tomb_fees(self, obj):
        """
        Return available TombFees for the selected TombType.
        """

        if obj.tomb_fee:
            fees = TombFee.objects.filter(
                church=obj.church,
                tomb_type=obj.tomb_fee.tomb_type
            )

            return TombFeeSerializer(
                fees,
                many=True
            ).data

        return []

    # =========================================================
    # VALIDATION
    # =========================================================

    def validate(self, data):
        """
        Validate death registration data.
        """

        instance = self.instance

        # -----------------------------------------------------
        # MEMBER
        # -----------------------------------------------------

        member = (
            data.get("member")
            or (
                instance.member
                if instance
                else None
            )
        )

        if not member:
            raise serializers.ValidationError({
                "member": "Member is required."
            })

        # -----------------------------------------------------
        # CHECK IF MEMBER IS ALREADY DECEASED
        # -----------------------------------------------------

        if member.expired:
            raise serializers.ValidationError({
                "member": (
                    "Member is already marked as deceased."
                )
            })

        # -----------------------------------------------------
        # DATES
        # -----------------------------------------------------

        died_on = data.get("died_on")

        funeral_on = data.get("funeral_on")

        today = date.today()

        # -----------------------------------------------------
        # DATE OF DEATH
        #
        # Death must be TODAY.
        #
        # Example if today = 31 Aug:
        #
        # 30 Aug ❌
        # 31 Aug ✅
        # 01 Sep ❌
        # -----------------------------------------------------

        if died_on and died_on != today:
            raise serializers.ValidationError({
                "died_on": (
                    "Date of death must be today."
                )
            })

        # -----------------------------------------------------
        # FUNERAL DATE CANNOT BE BEFORE DEATH
        #
        # Example:
        #
        # Death   = 31 Aug
        # Funeral = 30 Aug ❌
        # -----------------------------------------------------

        if (
            died_on
            and funeral_on
            and funeral_on < died_on
        ):
            raise serializers.ValidationError({
                "funeral_on": (
                    "Funeral date cannot be before "
                    "the date of death."
                )
            })

        # -----------------------------------------------------
        # FUNERAL DATE MAXIMUM 4 DAYS AFTER DEATH
        #
        # Example:
        #
        # Death   = 31 Aug
        #
        # Funeral = 31 Aug ✅
        # Funeral = 01 Sep ✅
        # Funeral = 02 Sep ✅
        # Funeral = 03 Sep ✅
        # Funeral = 04 Sep ✅
        # Funeral = 05 Sep ❌
        # -----------------------------------------------------

        if died_on and funeral_on:

            max_funeral_date = (
                died_on + timedelta(days=4)
            )

            if funeral_on > max_funeral_date:
                raise serializers.ValidationError({
                    "funeral_on": (
                        "Funeral date can be a maximum "
                        "of 4 days after the date of death."
                    )
                })

        # -----------------------------------------------------
        # TOMB FEE
        # -----------------------------------------------------

        tomb_fee = data.get("tomb_fee")

        reason_of_death = data.get(
            "reason_of_death"
        )

        if not tomb_fee:
            raise serializers.ValidationError({
                "tomb_fee": (
                    "Tomb fee selection is required."
                )
            })

        # -----------------------------------------------------
        # REASON OF DEATH
        # -----------------------------------------------------

        if (
            not reason_of_death
            or not reason_of_death.strip()
        ):
            raise serializers.ValidationError({
                "reason_of_death": (
                    "Reason of death is required."
                )
            })

        # -----------------------------------------------------
        # CHURCH
        # -----------------------------------------------------

        church = (
            data.get("church")
            or (
                instance.church
                if instance
                else None
            )
        )

        # -----------------------------------------------------
        # VALIDATE TOMB FEE BELONGS TO CHURCH
        # -----------------------------------------------------

        if tomb_fee and church:

            if tomb_fee.church_id != church.id:
                raise serializers.ValidationError({
                    "tomb_fee": (
                        "Selected tomb fee does not "
                        "belong to this church."
                    )
                })

        # -----------------------------------------------------
        # VALIDATE MEMBER BELONGS TO CHURCH
        # -----------------------------------------------------

        if member.church_id != (
            church.id if church else None
        ):
            raise serializers.ValidationError({
                "member": (
                    "Member does not belong to this church."
                )
            })

        return data

    # =========================================================
    # CREATE
    # =========================================================

    def create(self, validated_data):
        """
        Create death register and automatically
        mark member as deceased.
        """

        member = validated_data.get("member")

        # -----------------------------------------------------
        # MARK MEMBER AS DECEASED
        # -----------------------------------------------------

        member.expired = True

        member.is_active = False

        member.inactive_reason = "DECEASED"

        member.inactive_date = date.today()

        member.save()

        # -----------------------------------------------------
        # UPDATE SPOUSE STATUS
        # -----------------------------------------------------

        if member.spouse:

            member.spouse.marital_status = "WIDOWED"

            member.spouse.save()

        # -----------------------------------------------------
        # CREATE DEATH REGISTER
        # -----------------------------------------------------

        death = DeathRegister.objects.create(
            **validated_data
        )

        return death
 
 
class DeathRegisterListSerializer(
    serializers.ModelSerializer
):
    """
    Simplified serializer for list view.
    """

    member_name = serializers.CharField(
        source="member.name",
        read_only=True
    )

    family_name = serializers.CharField(
        source="member.family.family_name",
        read_only=True
    )

    house_name = serializers.CharField(
        source="member.house_name",
        read_only=True
    )

    tomb_type_name = serializers.CharField(
        source="tomb_fee.tomb_type.name",
        read_only=True,
        allow_null=True
    )

    tomb_charge = serializers.DecimalField(
        source="tomb_fee.tomb_fees",
        max_digits=15,
        decimal_places=3,
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = DeathRegister

        fields = [
            "id",
            "reg_no",
            "member",
            "member_name",
            "family_name",
            "house_name",
            "died_on",
            "funeral_on",
            "tomb_type_name",
            "tomb_charge",
            "created_at",
        ]

 
 
class DeathRegisterDetailSerializer(
    serializers.ModelSerializer
):
    """
    Detailed serializer for single death record view.
    """

    member_name = serializers.CharField(
        source="member.name",
        read_only=True
    )

    family_name = serializers.CharField(
        source="member.family.family_name",
        read_only=True
    )

    house_name = serializers.CharField(
        source="member.house_name",
        read_only=True
    )

    # ---------------------------------------------------------
    # Nested TombFee
    # ---------------------------------------------------------

    tomb_fee_details = TombFeeSerializer(
        source="tomb_fee",
        read_only=True
    )

    # ---------------------------------------------------------
    # Tomb type
    # ---------------------------------------------------------

    tomb_type_name = serializers.CharField(
        source="tomb_fee.tomb_type.name",
        read_only=True,
        allow_null=True
    )

    # ---------------------------------------------------------
    # Tomb charge
    # ---------------------------------------------------------

    tomb_charge = serializers.DecimalField(
        source="tomb_fee.tomb_fees",
        max_digits=15,
        decimal_places=3,
        read_only=True,
        allow_null=True
    )

    # ---------------------------------------------------------
    # Days since death/funeral
    # ---------------------------------------------------------

    days_since_death = serializers.SerializerMethodField()

    days_since_funeral = serializers.SerializerMethodField()

    # ---------------------------------------------------------
    # Meta
    # ---------------------------------------------------------

    class Meta:
        model = DeathRegister

        fields = [
            "id",
            "reg_no",
            "church",

            "member",
            "member_name",
            "family_name",
            "house_name",

            "died_on",
            "funeral_on",

            "tomb_fee",
            "tomb_fee_details",
            "tomb_type_name",
            "tomb_charge",

            "tomb_idn",
            "reason_of_death",
            "remarks",

            "days_since_death",
            "days_since_funeral",

            "created_at",
        ]

    # =========================================================
    # DAYS SINCE DEATH
    # =========================================================

    def get_days_since_death(self, obj):
        """
        Get number of days since death.
        """

        return obj.get_days_since_death()

    # =========================================================
    # DAYS SINCE FUNERAL
    # =========================================================

    def get_days_since_funeral(self, obj):
        """
        Get number of days since funeral.
        """

        return obj.get_days_since_funeral()
 
from django.contrib.auth import get_user_model
User = get_user_model()

class FamilyHeadUpdateSerializer(serializers.ModelSerializer):
    # Override foreign key fields to handle ID inputs properly
    ward = serializers.PrimaryKeyRelatedField(
        queryset=Ward.objects.all(),
        required=False,
        allow_null=True
    )
    
    grade = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(),
        required=False,
        allow_null=True
    )

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
        
        extra_kwargs = {
            # STRING FIELDS (support allow_blank)
            "name": {
                "required": False,
                "allow_blank": False,
            },
            "baptismal_name": {
                "required": False,
                "allow_blank": True,
            },
            "gender": {
                "required": False,
                "allow_blank": False,
            },
            "email": {
                "required": False,
                "allow_blank": False,
            },
            "marital_status": {
                "required": False,
                "allow_blank": False,
            },
            "spouse_name": {
                "required": False,
                "allow_blank": True,
            },
            "mobile_no": {
                "required": False,
                "allow_blank": True,
            },
            "phone_no": {
                "required": False,
                "allow_blank": True,
            },
            "blood_group": {
                "required": False,
                "allow_blank": True,
            },
            "father_name": {
                "required": False,
                "allow_blank": True,
            },
            "mother_name": {
                "required": False,
                "allow_blank": True,
            },
            "parish_of_baptism": {
                "required": False,
                "allow_blank": True,
            },
            "educational_qualification": {
                "required": False,
                "allow_blank": True,
            },
            "sunday_school_qualification": {
                "required": False,
                "allow_blank": True,
            },
            "profession": {
                "required": False,
                "allow_blank": True,
            },
            "transferred_from": {
                "required": False,
                "allow_blank": True,
            },
            "address": {
                "required": False,
                "allow_blank": True,
            },
            
            # DATE FIELDS (support allow_null, NOT allow_blank)
            "dob": {
                "required": False,
                "allow_null": True,
            },
            "date_of_baptism": {
                "required": False,
                "allow_null": True,
            },
            "joining_date": {
                "required": False,
                "allow_null": True,
            },
            
            # FILE FIELDS
            "family_image": {
                "required": False,
                "allow_null": True,
            },
            
            # FOREIGN KEY FIELDS - handled by overridden fields above
            # We don't set extra_kwargs for ward, grade, relationship here
        }

    def validate(self, data):
        instance = self.instance

        if not instance.is_family_head:
            raise serializers.ValidationError(
                "This member is not a family head."
            )

        # Prevent duplicate email
        if "email" in data:
            email = data["email"]
            if email:
                if Member.objects.filter(email=email).exclude(pk=instance.pk).exists():
                    raise serializers.ValidationError({
                        "email": "Email already exists."
                    })
        
        # Validate ward belongs to church
        ward = data.get("ward")
        if ward and ward.church_id != instance.church_id:
            raise serializers.ValidationError({
                "ward": "Invalid ward selected."
            })
        
        # Validate grade belongs to church
        grade = data.get("grade")
        if grade and grade.church_id != instance.church_id:
            raise serializers.ValidationError({
                "grade": "Invalid grade selected."
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
        read_only_fields = ("church", "created_at", "updated_at")  # Added updated_at

class OfferingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Offering
        fields = "__all__"
        read_only_fields = (
            "church",
            "created_at",
            "updated_at",
        )

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Amount must be greater than zero"
            )
        return value

    def validate(self, data):
        is_cancelled = data.get(
            "is_cancelled",
            getattr(self.instance, "is_cancelled", False)
        )

        cancel_reason = data.get(
            "cancel_reason",
            getattr(self.instance, "cancel_reason", "")
        )

        if is_cancelled and not cancel_reason:
            raise serializers.ValidationError(
                {
                    "cancel_reason":
                    "Cancel reason is required when marking as cancelled."
                }
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
# registry/serializers.py - Add this after the existing MemberSerializer

# ============================================================
# MEMBER DETAIL SERIALIZER - For detailed member views
# ============================================================

class MemberDetailSerializer(serializers.ModelSerializer):
    """
    Detailed Member serializer with nested relationship data.
    This resolves foreign keys to their display names.
    """
    
    # Nested relationship fields with display data
    relationship = serializers.SerializerMethodField()
    family = serializers.SerializerMethodField()
    ward = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    
    # Additional computed fields
    family_name = serializers.SerializerMethodField()
    family_head_name = serializers.SerializerMethodField()
    ward_name = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    relationship_name = serializers.SerializerMethodField()
    
    # Image URL
    family_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = [
            "id",
            "register_number",
            "folio_number",
            "name",
            "baptismal_name",
            "gender",
            "email",
            "marital_status",
            "spouse_name",
            "dob",
            "age",
            "mobile_no",
            "phone_no",
            "blood_group",
            "expired",
            "father_name",
            "mother_name",
            "date_of_baptism",
            "parish_of_baptism",
            "educational_qualification",
            "sunday_school_qualification",
            "profession",
            "house_name",
            "address",
            "is_family_head",
            "is_active",
            "joining_date",
            "transferred_from",
            "created_at",
            "updated_at",
            # Nested objects
            "relationship",
            "family",
            "ward",
            "grade",
            # Display fields
            "family_name",
            "family_head_name",
            "ward_name",
            "grade_name",
            "relationship_name",
            "family_image_url",
        ]
    
    def get_relationship(self, obj):
        """Return relationship as nested object with id and name"""
        if obj.relationship:
            return {
                "id": obj.relationship.id,
                "name": obj.relationship.name
            }
        return None
    
    def get_family(self, obj):
        """Return family as nested object with id and family_name"""
        if obj.family:
            return {
                "id": obj.family.id,
                "family_name": obj.family.family_name
            }
        return None
    
    def get_ward(self, obj):
        """Return ward as nested object with id, ward_name, ward_number, place"""
        if obj.ward:
            return {
                "id": obj.ward.id,
                "ward_name": obj.ward.ward_name,
                "ward_number": obj.ward.ward_number,
                "place": obj.ward.place
            }
        return None
    
    def get_grade(self, obj):
        """Return grade as nested object with id and name"""
        if obj.grade:
            return {
                "id": obj.grade.id,
                "name": obj.grade.name
            }
        return None
    
    def get_family_name(self, obj):
        """Get family name as string"""
        return obj.family.family_name if obj.family else None
    
    def get_family_head_name(self, obj):
        """Get the family head name for this member's household"""
        if obj.family and obj.house_name:
            head = Member.objects.filter(
                family=obj.family,
                house_name=obj.house_name,
                house_sequence=obj.house_sequence,
                is_family_head=True,
                is_active=True,
                expired=False
            ).first()
            return head.name if head else None
        return None
    
    def get_ward_name(self, obj):
        """Get ward name as string"""
        return obj.ward.ward_name if obj.ward else None
    
    def get_grade_name(self, obj):
        """Get grade name as string"""
        return obj.grade.name if obj.grade else None
    
    def get_relationship_name(self, obj):
        """Get relationship name as string"""
        if obj.is_family_head:
            return "HEAD"
        return obj.relationship.name if obj.relationship else None
    
    def get_family_image_url(self, obj):
        """Get family image URL with fallback to head's image"""
        request = self.context.get("request")
        
        if not request:
            return None
        
        # If this member is the head and has an image
        if obj.is_family_head and obj.family_image:
            try:
                return request.build_absolute_uri(obj.family_image.url)
            except:
                return None
        
        # Find the head of this household
        head = Member.objects.filter(
            family=obj.family,
            house_name=obj.house_name,
            house_sequence=obj.house_sequence,
            is_family_head=True,
            is_active=True,
            expired=False
        ).first()
        
        if head and head.family_image:
            try:
                return request.build_absolute_uri(head.family_image.url)
            except:
                return None
        
        return None