# registry/serializers.py
from rest_framework import serializers
from registry.models import Church, Package, ChurchSubscription, Bill, Diocese
from accounts.models import User

class ChurchSerializer(serializers.ModelSerializer):
    subscription_status = serializers.SerializerMethodField()
    package_name = serializers.SerializerMethodField()
    diocese_name = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Church
        fields = [
            'id', 
            'name', 
            'code',
            'address', 
            'address_line1',
            'city', 
            'state',
            'country',
            'postal_code',
            'diocese',
            'diocese_name',
            'established_year',
            'registration_number',
            'currency',
            'logo', 
            'email', 
            'phone_number',
            'alternate_phone',
            'website',
            'is_active', 
            'is_deleted', 
            'created_at',
            'updated_at',
            'full_address',
            'subscription_status', 
            'package_name'
        ]
    
    def get_subscription_status(self, obj):
        subscription = getattr(obj, 'churchsubscription', None)
        if subscription:
            return subscription.payment_status
        return None
    
    def get_package_name(self, obj):
        subscription = getattr(obj, 'churchsubscription', None)
        if subscription and subscription.package:
            return subscription.package.name
        return None
    
    def get_diocese_name(self, obj):
        if obj.diocese:
            return obj.diocese.name
        return None
    
    def get_full_address(self, obj):
        return obj.get_full_address() if hasattr(obj, 'get_full_address') else None


class ChurchCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new church."""

    class Meta:
        model = Church
        fields = [
            "name",
            "code",
            "diocese",
            "established_year",
            "registration_number",
            "currency",
            "address",
            "address_line1",
            "city",
            "state",
            "country",
            "postal_code",
            "email",
            "phone_number",
            "alternate_phone",
            "website",
            "logo",
            "is_active",
        ]

        extra_kwargs = {
            "code": {"required": False},

            "diocese": {
                "required": False,
                "allow_null": True,
            },

            "established_year": {
                "required": False,
                "allow_null": True,
            },

            "registration_number": {
                "required": False,
                "allow_null": True,
            },

            "currency": {
                "required": False,
                "allow_null": True,
            },

            "address": {
                "required": False,
                "allow_null": True,
            },

            "address_line1": {
                "required": False,
                "allow_null": True,
            },

            "city": {
                "required": False,
                "allow_null": True,
            },

            "state": {
                "required": False,
                "allow_null": True,
            },

            "country": {
                "required": False,
                "allow_null": True,
            },

            "postal_code": {
                "required": False,
                "allow_null": True,
            },

            "email": {
                "required": False,
                "allow_null": True,
            },

            "phone_number": {
                "required": False,
                "allow_null": True,
            },

            "alternate_phone": {
                "required": False,
                "allow_null": True,
            },

            "website": {
                "required": False,
                "allow_null": True,
            },

            "logo": {
                "required": False,
                "allow_null": True,
            },

            # IMPORTANT
            "is_active": {
                "required": False,
                "default": False,
            },
        }

    def validate_email(self, value):
        if (
            value
            and Church.objects.filter(
                email=value,
                is_deleted=False
            ).exists()
        ):
            raise serializers.ValidationError(
                "A church with this email already exists."
            )

        return value

    def validate_phone_number(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError(
                "Phone number must be at least 8 digits."
            )

        return value

    def create(self, validated_data):

        # -----------------------------------------
        # NEW CHURCH IS NOT ACTIVE BEFORE PAYMENT
        # -----------------------------------------

        validated_data["is_active"] = False

        # -----------------------------------------
        # AUTO GENERATE CHURCH CODE
        # -----------------------------------------

        if not validated_data.get("code"):

            last_church = (
                Church.objects
                .filter(is_deleted=False)
                .order_by("-id")
                .first()
            )

            if last_church and last_church.code:

                import re

                match = re.search(
                    r"(?:CH|SMC)-(\d+)",
                    last_church.code
                )

                if match:
                    last_num = int(match.group(1))

                    validated_data["code"] = (
                        f"CH-{str(last_num + 1).zfill(3)}"
                    )
                else:
                    validated_data["code"] = "CH-001"

            else:
                validated_data["code"] = "CH-001"

        # -----------------------------------------
        # CREATE CHURCH
        # -----------------------------------------

        church = super().create(validated_data)

        # -----------------------------------------
        # DO NOT ACTIVATE HERE
        #
        # Payment process will activate it later.
        # -----------------------------------------

        return church


class ChurchUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a church"""
    
    class Meta:
        model = Church
        fields = [
            'name',
            'diocese',
            'established_year',
            'registration_number',
            'currency',
            'address',
            'address_line1',
            'city',
            'state',
            'country',
            'postal_code',
            'email',
            'phone_number',
            'alternate_phone',
            'website',
            'logo',
            'is_active',
        ]
        extra_kwargs = {
            'email': {'required': False},
            'name': {'required': False},
        }
    
    def validate_email(self, value):
        if value and Church.objects.filter(email=value, is_deleted=False).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("A church with this email already exists.")
        return value


class DioceseSerializer(serializers.ModelSerializer):
    full_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Diocese
        fields = [
            'id',
            'name',
            'metropolitan_name',
            'email',
            'phone_number',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'country',
            'postal_code',
            'website',
            'is_active',
            'full_address',
            'created_at',
            'updated_at',
        ]
    
    def get_full_address(self, obj):
        return obj.get_full_address()
    
    def validate_website(self, value):
        if value and not value.startswith(('http://', 'https://')):
            value = 'https://' + value
        return value


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
            "name",
            "member_limit",
            "rate_per_member_monthly",
            "rate_per_member_yearly",
            "upgrade_rate_monthly",
            "upgrade_rate_yearly",
            "is_active",
            "is_in_use",
            "church_count",
            "can_delete",
            "can_edit",
            "created_at",
            "updated_at",
        ]
    
    def validate(self, data):
        if data.get('upgrade_rate_monthly') and data.get('upgrade_rate_monthly') < 0:
            raise serializers.ValidationError({
                'upgrade_rate_monthly': 'Upgrade rate cannot be negative'
            })
        if data.get('upgrade_rate_yearly') and data.get('upgrade_rate_yearly') < 0:
            raise serializers.ValidationError({
                'upgrade_rate_yearly': 'Upgrade rate cannot be negative'
            })
        return data


class BillSerializer(serializers.ModelSerializer):
    church_name = serializers.CharField(source='church.name', read_only=True)
    church_email = serializers.CharField(source='church.email', read_only=True)
    
    class Meta:
        model = Bill
        fields = ['id', 'church', 'church_name', 'church_email', 'subscription',
                  'bill_type', 'billing_cycle', 'duration_months', 'amount',
                  'status', 'breakdown', 'created_at', 'paid_at']


class ChurchSubscriptionSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source='package.name', read_only=True)
    church_name = serializers.CharField(source='church.name', read_only=True)
    
    class Meta:
        model = ChurchSubscription
        fields = ['id', 'church', 'church_name', 'package', 'package_name',
                  'billing_cycle', 'duration_months', 'payment_status',
                  'is_active', 'start_date', 'end_date', 'custom_capacity',
                  'credit_balance', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    total_dioceses = serializers.IntegerField()
    total_churches = serializers.IntegerField()
    active_churches = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    expiring_churches = serializers.ListField()
    recent_activities = serializers.ListField()