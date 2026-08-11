from rest_framework import serializers
from registry.models import Church
from django.contrib.auth import authenticate
from accounts.models import User
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(email=data["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")

        user = authenticate(
            username=user.username,
            password=data["password"]
        )

        if not user:
            raise serializers.ValidationError("Invalid email or password")

        # ADMIN restriction
        if user.role == "ADMIN":
            raise serializers.ValidationError(
                "Admins must login via admin panel"
            )

        # CHURCH validation
        if user.role == "CHURCH":
            if not user.church:
                raise serializers.ValidationError("Church not linked")

        # MEMBER validation
        if user.role == "USER":
            if not user.member or not user.member.is_family_head:
                raise serializers.ValidationError(
                    "Only family head can login"
                )
        data["user"] = user
        return data

class AdminLoginSerializer(serializers.Serializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get("username", "").strip()
        password = data.get("password")

        if not identifier:
            raise serializers.ValidationError(
                {"username": "Username or email is required"}
            )

        if not password:
            raise serializers.ValidationError(
                {"password": "Password is required"}
            )

        # Find user using either username OR email
        user = (
            User.objects
            .filter(
                models.Q(username__iexact=identifier)
                | models.Q(email__iexact=identifier)
            )
            .first()
        )

        if not user:
            raise serializers.ValidationError(
                {"non_field_errors": ["Invalid admin credentials"]}
            )

        # Authenticate using the actual username
        user = authenticate(
            username=user.username,
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                {"non_field_errors": ["Invalid admin credentials"]}
            )

        # ADMIN role only
        if user.role != "ADMIN":
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "Access denied. Admin privileges required."
                    ]
                }
            )

        # Superuser only
        if not user.is_superuser:
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "Access denied. Superuser privileges required."
                    ]
                }
            )

        # Active account only
        if not user.is_active:
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "Account is inactive. Please contact support."
                    ]
                }
            )

        data["user"] = user
        return data
    
class ChurchProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Church
        fields = [
            "id",
            "name",
            "address",
            "city",
            "vicar",
            "asst_vicar1",
            "asst_vicar2",
            "asst_vicar3",
            "diocese_name",
            "logo",
            "email",
            "phone_number",
            "is_active",
        ]
        read_only_fields = ("is_active",)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                "New password and confirm password do not match"
            )

        if len(data["new_password"]) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long"
            )

        return data