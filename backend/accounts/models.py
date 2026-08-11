from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("CHURCH", "Church"),
        ("USER", "User"),  # for future family head login
    )
 
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default="USER"
    )
 
    church = models.ForeignKey(
        "registry.Church",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )
 
    member = models.OneToOneField(
        "registry.Member",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="user"
    )
 
    force_password_change = models.BooleanField(
        default=True,
        help_text="Whether user must change password on first login"
    )
 
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def save(self, *args, **kwargs):
        # Automatically set role to ADMIN for superusers
        if self.is_superuser and self.role != "ADMIN":
            self.role = "ADMIN"
        super().save(*args, **kwargs)


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.created_at + timezone.timedelta(minutes=10)