from django.db import models
from datetime import date
from datetime import timedelta
from django.forms import ValidationError
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from django.utils.timezone import now
from accounts.utils import create_family_head_user
from django_countries.fields import CountryField
from phonenumber_field.modelfields import PhoneNumberField

# registry/models.py
from django.db import models
from django_countries.fields import CountryField
from phonenumber_field.modelfields import PhoneNumberField
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError



# ============================================================
# LEDGER RESOLUTION HELPERS
# ============================================================

def get_cash_ledger(church):
    """
    Return the church's primary Cash ledger.
    Matches 'Cash in Hand'. Falls back to any ledger with 'cash' in name.
    """
    from django.db.models import Q
    return (
        AccountLedgerMaster.objects
        .filter(church=church, ledger_name__iexact="Cash in Hand")
        .first()
        or AccountLedgerMaster.objects
        .filter(church=church, ledger_name__icontains="cash")
        .exclude(ledger_name__icontains="closing")
        .first()
    )


def get_bank_ledger(church):
    """
    Return the church's primary Bank ledger.
    Matches 'Balance in Savings Account'.
    """
    from django.db.models import Q
    return (
        AccountLedgerMaster.objects
        .filter(church=church, ledger_name__iexact="Balance in Savings Account")
        .first()
        or AccountLedgerMaster.objects
        .filter(church=church, ledger_name__icontains="savings")
        .exclude(ledger_name__icontains="closing")
        .first()
    )

class Diocese(models.Model):
    # Basic Information
    name = models.CharField(max_length=200, help_text="Name of the Diocese")
    metropolitan_name = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Name of the Metropolitan (Head of Diocese)"
    )
    
    # Contact Information
    email = models.EmailField(unique=True, help_text="Official email of the Diocese")
    phone_number = PhoneNumberField(
        blank=True, 
        null=True,
        help_text="Phone number with country code"
    )
    
    # Address Fields
    address_line1 = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Street address, building name, etc."
    )
    address_line2 = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Apartment, suite, unit, etc."
    )
    city = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="City where Diocese office is located"
    )
    state = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="State/Province where Diocese office is located"
    )
    country = CountryField(
        blank=True, 
        null=True, 
        blank_label="Select Country", 
        help_text="Country where Diocese office is located"
    )
    postal_code = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Postal/ZIP code"
    )
    
    # Website
    website = models.URLField(
        blank=True, 
        null=True,
        help_text="Official website of the Diocese",
        validators=[URLValidator()]
    )
    
    # Status
    is_active = models.BooleanField(
        default=True, 
        help_text="Whether this diocese is currently active"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Diocese"
        verbose_name_plural = "Dioceses"
        ordering = ['name']

    def __str__(self):
        return self.name
    
    def get_full_address(self):
        """Get full address as a string"""
        parts = []
        if self.address_line1:
            parts.append(self.address_line1)
        if self.address_line2:
            parts.append(self.address_line2)
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        if self.postal_code:
            parts.append(self.postal_code)
        if self.country:
            parts.append(str(self.country.name))
        return ", ".join(parts)


class Church(models.Model):
    name = models.CharField(max_length=200, help_text="Name of the Church")
    code = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        help_text="Auto-generated church code (CH-001)"
    )
    diocese = models.ForeignKey(
        'Diocese',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="churches"
    )
    established_year = models.IntegerField(
        blank=True,
        null=True,
        help_text="Year the church was established"
    )
    registration_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Government registration number"
    )
    currency = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Currency used by the church"
    )

    # Address Fields
    address = models.TextField(
        blank=True,
        null=True,
        help_text="Street address, building name, etc. (Address Line 1)"
    )
    address_line1 = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Apartment, suite, unit, etc. (Address Line 2)"
    )
    city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="City where church is located"
    )
    state = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="State/Province where church is located"
    )
    country = CountryField(
        blank=True,
        null=True,
        blank_label="Select Country",
        help_text="Country where church is located"
    )
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Postal/ZIP code"
    )

    # Contact Information
    email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email of the church"
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Phone number with country code"
    )
    alternate_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Alternate phone number with country code"
    )

    # Website
    website = models.URLField(
        blank=True,
        null=True,
        help_text="Official website of the church",
        validators=[URLValidator()]
    )

    # Logo/Image
    logo = models.ImageField(
        upload_to="church_logos/",
        null=True,
        blank=True,
        help_text="Church logo or image"
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this church is currently active"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Church"
        verbose_name_plural = "Churches"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        is_new = self._state.adding

        # -----------------------------------------------------
        # Auto-generate church code
        # -----------------------------------------------------
        if not self.code:
            import re
            last_church = Church.objects.filter(
                is_deleted=False
            ).order_by('-id').first()

            if last_church and last_church.code:
                match = re.search(r'(?:CH|SMC)-(\d+)', last_church.code)
                if match:
                    last_num = int(match.group(1))
                    self.code = f"CH-{str(last_num + 1).zfill(3)}"
                else:
                    self.code = "CH-001"
            else:
                self.code = "CH-001"

        super().save(*args, **kwargs)

        # -----------------------------------------------------
        # Auto-seed defaults for BRAND NEW churches
        # -----------------------------------------------------
        if is_new:
            import logging
            logger = logging.getLogger(__name__)

            # 1) Default relationships
            try:
                from registry.utils import seed_default_relationships
                seed_default_relationships(self)
            except Exception as e:
                logger.error(
                    f"Failed to seed relationships for "
                    f"church #{self.pk}: {e}"
                )

            # 2) Full chart of accounts (83 groups + ~298 ledgers)
            try:
                from registry.utils import seed_default_accounts
                seed_default_accounts(self)
            except Exception as e:
                logger.error(
                    f"Failed to seed chart of accounts for "
                    f"church #{self.pk}: {e}"
                )

    def get_full_address(self):
        """Get full address as a string"""
        parts = []
        if self.address:
            parts.append(self.address)
        if self.address_line1:
            parts.append(self.address_line1)
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        if self.postal_code:
            parts.append(self.postal_code)
        if self.country:
            parts.append(str(self.country.name))
        return ", ".join(parts)

class Package(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    member_limit = models.PositiveIntegerField(unique=True)  # Add unique=True
    rate_per_member_monthly = models.DecimalField(max_digits=8, decimal_places=2)
    rate_per_member_yearly = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_in_use(self):
        """Check if any church is using this package"""
        return self.subscriptions.filter(is_active=True).exists()
    
    @property
    def church_count(self):
        """Count of churches using this package"""
        return self.subscriptions.filter(is_active=True).count()
    
    def can_edit_or_delete(self):
        """Single method - no duplication"""
        return not self.is_in_use
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    class Meta:
        ordering = ['code']

from decimal import Decimal
from datetime import date, datetime

from datetime import date, datetime
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from django.db import models


class ChurchSubscription(models.Model):
    BILLING_CHOICES = (
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
    )

    PAYMENT_CHOICES = (
        ('PAID', 'Paid'),
        ('UNPAID', 'Unpaid'),
        ('EXPIRED', 'Expired'),
    )

    ORIGIN_CHOICES = (
        ('BASE', 'Base Purchase'),
        ('UPGRADE', 'Upgrade Purchase'),
    )

    # ============================================================
    # CHURCH & PACKAGE
    # ============================================================

    church = models.OneToOneField(
        'Church',
        on_delete=models.CASCADE,
        related_name='subscription'
    )

    package = models.ForeignKey(
        'Package',
        on_delete=models.PROTECT,
        related_name='subscriptions'
    )

    # ============================================================
    # BILLING
    # ============================================================

    billing_cycle = models.CharField(
        max_length=10,
        choices=BILLING_CHOICES,
        default='YEARLY'
    )

    payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_CHOICES,
        default='UNPAID'
    )

    # Duration is used ONLY for calculating end_date.
    # It is NOT multiplied into pricing except where the
    # yearly package rate itself is defined as a monthly rate.
    duration_months = models.PositiveIntegerField(
        default=12,
        help_text="Number of months purchased - only affects end_date"
    )

    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(
        null=True,
        blank=True
    )

    # ============================================================
    # CAPACITY
    # ============================================================

    custom_capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Custom member capacity if different from package limit"
    )

    # ============================================================
    # PRICING SNAPSHOT
    # ============================================================

    # These values are captured when the subscription is purchased.
    # This prevents future Package edits from changing existing
    # subscription pricing.

    locked_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Rate per member at time of purchase"
    )

    locked_capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Member capacity at time of purchase"
    )

    locked_package_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Package name at time of purchase"
    )

    # ============================================================
    # STATUS & CREDIT
    # ============================================================

    is_active = models.BooleanField(
        default=False
    )

    credit_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    pricing_origin = models.CharField(
        max_length=10,
        choices=ORIGIN_CHOICES,
        default='BASE'
    )

    # ============================================================
    # UPGRADE TRACKING
    # ============================================================

    previous_subscription = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='upgraded_to'
    )

    upgrade_from_package = models.ForeignKey(
        'Package',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='upgraded_from'
    )

    upgrade_date = models.DateField(
        null=True,
        blank=True
    )

    pro_rata_credit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # ============================================================
    # TIMESTAMPS
    # ============================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Church Subscription'
        verbose_name_plural = 'Church Subscriptions'

    def __str__(self):
        return f"{self.church.name} - {self.package.name} ({self.billing_cycle})"

    # ============================================================
    # SAVE
    # ============================================================

    def save(self, *args, **kwargs):
        """
        Snapshot package pricing on purchase and automatically
        calculate the subscription end date.

        TAX IS NOT CALCULATED HERE.
        Tax is handled separately by the Bill model.
        """

        # Capture package terms once at purchase.
        #
        # The API can clear locked_rate when the church changes
        # package or billing cycle. That represents a fresh purchase,
        # so the package pricing is captured again.
        if self.locked_rate is None and self.package_id:

            if self.billing_cycle == 'MONTHLY':
                self.locked_rate = (
                    self.package.rate_per_member_monthly
                )
            else:
                self.locked_rate = (
                    self.package.rate_per_member_yearly
                )

            self.locked_capacity = self.package.member_limit
            self.locked_package_name = self.package.name

        # Calculate subscription end date.
        if self.start_date and self.duration_months:

            # Ensure start_date is a date object
            if isinstance(self.start_date, datetime):
                self.start_date = self.start_date.date()

            self.end_date = (
                self.start_date
                + relativedelta(months=self.duration_months)
            )

        super().save(*args, **kwargs)

    # ============================================================
    # DATE & EXPIRATION METHODS
    # ============================================================

    def is_expired(self):
        """Check if subscription has expired."""

        if not self.end_date:
            return False

        return self.end_date < date.today()

    def expires_in_days(self):
        """Get number of days until expiration."""

        if not self.end_date:
            return None

        days_left = (
            self.end_date - date.today()
        ).days

        return max(0, days_left)

    def get_used_days(self):
        """Get number of days used in current subscription."""

        if not self.start_date:
            return 0

        today = date.today()

        if today < self.start_date:
            return 0

        return (
            today - self.start_date
        ).days

    def get_remaining_days(self):
        """Get number of days remaining in current subscription."""

        if not self.end_date:
            return 0

        today = date.today()

        if today > self.end_date:
            return 0

        return (
            self.end_date - today
        ).days

    def get_total_days(self):
        """Get total number of days in subscription period."""

        if not self.start_date or not self.end_date:
            return 0

        return (
            self.end_date - self.start_date
        ).days

    def get_progress_percentage(self):
        """Get percentage of subscription completed."""

        total_days = self.get_total_days()

        if total_days <= 0:
            return 0

        used_days = self.get_used_days()

        percentage = (
            used_days / total_days
        ) * 100

        return round(
            min(100, percentage),
            2
        )

    # ============================================================
    # PRICING METHODS
    # ============================================================

    def get_rate(self):
        """
        Get rate per member.

        Purchase-time snapshot takes priority over the live package.

        This means editing a Package later does not change the
        price of an existing subscription.
        """

        if self.locked_rate is not None:
            return self.locked_rate

        # Fallback for old subscriptions created before snapshots
        # existed.
        if self.billing_cycle == 'MONTHLY':
            return self.package.rate_per_member_monthly

        return self.package.rate_per_member_yearly

    def get_capacity(self):
        """
        Get member capacity.

        Priority:

        1. custom_capacity
        2. locked_capacity
        3. current package member_limit
        """

        if self.custom_capacity:
            return self.custom_capacity

        if self.locked_capacity is not None:
            return self.locked_capacity

        return self.package.member_limit

    def get_base_price(self):
        """
        Get subscription base price WITHOUT TAX.

        YEARLY:
            rate × 12 × capacity

        MONTHLY:
            rate × capacity

        Tax is NOT calculated here.
        """

        capacity = self.get_capacity()
        rate = self.get_rate()

        if self.billing_cycle == 'YEARLY':
            return rate * 12 * capacity

        return rate * capacity

    def get_total_price(self):
        """
        Get total subscription price WITHOUT TAX.

        YEARLY:
            rate × 12 × capacity

        MONTHLY:
            rate × capacity

        Tax is handled separately by the Bill model.
        """

        return self.get_base_price()

    def get_amount_per_member(self):
        """Get rate per member."""

        return self.get_rate()

    def get_member_limit(self):
        """Get subscription member capacity."""

        return self.get_capacity()

    # ============================================================
    # UPGRADE METHODS
    # ============================================================

    def calculate_upgrade_cost(
        self,
        new_package,
        new_billing_cycle
    ):
        """
        Calculate upgrade cost using pro-rata credit.

        IMPORTANT:
        No tax is calculated here.

        The new package price is calculated first.
        Then the unused portion of the old subscription is
        deducted as pro-rata credit.

        Tax should be calculated later by the Bill model.
        """

        capacity = self.get_capacity()

        # --------------------------------------------------------
        # Calculate NEW subscription base price
        # --------------------------------------------------------

        if new_billing_cycle == 'MONTHLY':

            rate = (
                new_package.rate_per_member_monthly
            )

            new_base_price = (
                rate * capacity
            )

        else:

            rate = (
                new_package.rate_per_member_yearly
            )

            new_base_price = (
                rate * 12 * capacity
            )

        # No tax here.
        new_price = new_base_price

        # --------------------------------------------------------
        # Calculate pro-rata credit
        # --------------------------------------------------------

        total_days = self.get_total_days()
        remaining_days = self.get_remaining_days()

        if total_days > 0:

            remaining_percentage = (
                remaining_days / total_days
            )

            # This uses the OLD subscription's
            # purchase-time pricing snapshot.
            original_price = (
                self.get_total_price()
            )

            credit = (
                original_price
                * Decimal(str(remaining_percentage))
            )

        else:

            credit = Decimal('0')

        # --------------------------------------------------------
        # Final upgrade amount
        # --------------------------------------------------------

        final_amount = max(
            Decimal('0'),
            new_price - credit
        )

        return {
            'new_base_price': round(
                new_base_price,
                2
            ),

            'new_price': round(
                new_price,
                2
            ),

            'credit_amount': round(
                credit,
                2
            ),

            'final_amount': round(
                final_amount,
                2
            ),

            'used_percentage': round(
                (
                    (total_days - remaining_days)
                    / total_days
                ) * 100,
                2
            ) if total_days > 0 else 0,

            'remaining_percentage': round(
                (
                    remaining_days
                    / total_days
                ) * 100,
                2
            ) if total_days > 0 else 0,

            'billing_cycle': new_billing_cycle,

            'capacity': capacity,

            'duration_months': self.duration_months
        }

    def is_upgradable(self):
        """Check if subscription can be upgraded."""

        return (
            self.is_active
            and not self.is_expired()
        )

    def get_upgrade_history(self):
        """Get full upgrade history for this subscription."""

        history = []

        current = self

        while current.previous_subscription:

            prev = current.previous_subscription

            history.append({
                'from_package': (
                    prev.locked_package_name
                    or (
                        prev.package.name
                        if prev.package
                        else "Unknown"
                    )
                ),

                'to_package': (
                    current.locked_package_name
                    or (
                        current.package.name
                        if current.package
                        else "Unknown"
                    )
                ),

                'upgrade_date': current.upgrade_date,

                'pro_rata_credit': (
                    float(current.pro_rata_credit)
                    if current.pro_rata_credit
                    else 0
                ),
            })

            current = prev

        return history

    # ============================================================
    # STATUS METHODS
    # ============================================================

    def get_status(self):
        """Get machine-readable subscription status."""

        if self.is_expired():
            return 'EXPIRED'

        if self.is_active:
            return 'ACTIVE'

        if self.payment_status == 'PAID':
            return 'PAID'

        return 'INACTIVE'

    def get_status_display(self):
        """Get display-friendly subscription status."""

        status_map = {
            'ACTIVE': 'Active',
            'EXPIRED': 'Expired',
            'PAID': 'Paid',
            'INACTIVE': 'Inactive',
            'UNPAID': 'Unpaid',
            'PENDING': 'Pending',
        }

        return status_map.get(
            self.get_status(),
            'Unknown'
        )

    def can_renew(self):
        """Check if subscription can be renewed."""

        return (
            self.is_expired()
            or self.get_remaining_days() <= 30
        )

    def needs_renewal(self):
        """
        Check if subscription needs renewal.

        Returns True when the subscription is active and has
        30 or fewer days remaining.
        """

        if not self.end_date:
            return False

        days_left = self.expires_in_days()

        return (
            days_left is not None
            and days_left <= 30
            and not self.is_expired()
        )

    # ============================================================
    # JSON SERIALIZATION
    # ============================================================

    def to_dict(self):
        """
        Convert subscription to dictionary for API responses.

        TAX IS NOT INCLUDED because tax is calculated by the
        Bill model.
        """

        return {
            'id': self.id,

            'church_id': (
                self.church.id
                if self.church
                else None
            ),

            'church_name': (
                self.church.name
                if self.church
                else None
            ),

            'church_code': (
                self.church.code
                if self.church
                else None
            ),

            'package_id': (
                self.package.id
                if self.package
                else None
            ),

            'package_name': (
                self.package.name
                if self.package
                else None
            ),

            # Package name at purchase time
            'purchased_package_name': (
                self.locked_package_name
                or None
            ),

            'package_code': (
                self.package.code
                if self.package
                else None
            ),

            'billing_cycle': self.billing_cycle,

            'duration_months': self.duration_months,

            'payment_status': self.payment_status,

            'is_active': self.is_active,

            'start_date': (
                self.start_date.isoformat()
                if self.start_date
                else None
            ),

            'end_date': (
                self.end_date.isoformat()
                if self.end_date
                else None
            ),

            # Price WITHOUT TAX
            'base_price': float(
                self.get_base_price()
            ),

            # Total subscription price WITHOUT TAX
            'total_price': float(
                self.get_total_price()
            ),

            'rate_per_member': float(
                self.get_rate()
            ),

            'member_limit': (
                self.get_member_limit()
            ),

            'progress_percentage': (
                self.get_progress_percentage()
            ),

            'remaining_days': (
                self.get_remaining_days()
            ),

            'is_expired': (
                self.is_expired()
            ),

            'status': (
                self.get_status_display()
            ),

            'pricing_origin': (
                self.pricing_origin
            ),

            'upgrade_date': (
                self.upgrade_date.isoformat()
                if self.upgrade_date
                else None
            ),

            'pro_rata_credit': (
                float(self.pro_rata_credit)
                if self.pro_rata_credit
                else 0
            ),

            'created_at': (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),

            'updated_at': (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
        }
    
# registry/models.py - Tax Type Model

class TaxType(models.Model):
    """Tax Type Master - Defines different types of taxes"""
    
    tax_type_code = models.CharField(
        max_length=20, 
        unique=True,
        help_text="Unique code for the tax type (e.g., GST, VAT, ST)"
    )
    tax_type_name = models.CharField(
        max_length=100,
        help_text="Full name of the tax type (e.g., Goods and Services Tax)"
    )
    country = CountryField(
        blank=True,
        null=True,
        blank_label="Select Country",
        help_text="Country where this tax type is applicable"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this tax type is currently active"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Additional description or notes about this tax type"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['tax_type_code']
        verbose_name = 'Tax Type'
        verbose_name_plural = 'Tax Types'
    
    def __str__(self):
        return f"{self.tax_type_code} - {self.tax_type_name}"
    
    def get_display_name(self):
        """Get display name with country if available"""
        if self.country:
            return f"{self.tax_type_name} ({self.country.name})"
        return self.tax_type_name

class TaxRate(models.Model):
    """Tax Rate Master - Defines tax rates for different tax types"""
    
    tax_rate_code = models.CharField(
        max_length=20, 
        unique=True,
        help_text="Unique code for the tax rate (e.g., GST-18, VAT-12)"
    )
    tax_rate_name = models.CharField(
        max_length=100,
        help_text="Name of the tax rate (e.g., GST @ 18%, VAT @ 12%)"
    )
    tax_type = models.ForeignKey(
        TaxType,
        on_delete=models.PROTECT,
        related_name='tax_rates',
        help_text="Tax type this rate belongs to"
    )
    rate_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Tax rate percentage (e.g., 18.00 for 18%)"
    )
    effective_from = models.DateField(
        help_text="Date from which this tax rate is effective"
    )
    effective_until = models.DateField(
        null=True,
        blank=True,
        help_text="Date until which this tax rate is effective (leave blank for no end date)"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this tax rate is currently active"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Additional description or notes about this tax rate"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['tax_type', '-effective_from']
        verbose_name = 'Tax Rate'
        verbose_name_plural = 'Tax Rates'
        unique_together = ['tax_type', 'rate_percentage', 'effective_from']
    
    def __str__(self):
        return f"{self.tax_rate_code} - {self.tax_rate_name}"
    
    def is_effective(self, check_date=None):
        """Check if this tax rate is effective on a given date"""
        if check_date is None:
            check_date = date.today()  # Use date.today() from imported module
        if self.effective_until:
            return self.effective_from <= check_date <= self.effective_until
        return self.effective_from <= check_date
    
    def get_effective_status(self):
        """Get human-readable effective status"""
        if self.is_effective():
            return "Active"
        elif self.effective_from > date.today():
            return f"Starts from {self.effective_from.strftime('%d %b %Y')}"
        else:
            return "Expired"
    
    def get_display_rate(self):
        """Get rate with percentage symbol"""
        return f"{self.rate_percentage}%"
    
    def calculate_tax(self, amount):
        """Calculate tax amount for a given amount"""
        return (amount * self.rate_percentage) / 100
    
    def calculate_total_with_tax(self, amount):
        """Calculate total amount including tax"""
        return amount + self.calculate_tax(amount)


class Ward(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="wards"
    )
    ward_name = models.CharField(max_length=100)
    ward_number = models.PositiveIntegerField()
    place = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("church", "ward_number")
        ordering = ["ward_number"]

    def __str__(self):
        return f"{self.ward_name} ({self.church.name})"


class Family(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="families"
    )

    family_name = models.CharField(max_length=150)
    history = models.TextField(blank=True)
    origin = models.CharField(max_length=150, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["church", "family_name"]

    def save(self, *args, **kwargs):
        if self.family_name:
            self.family_name = self.family_name.strip().capitalize()
        super().save(*args, **kwargs)

    def get_active_head(self):
        return self.members.filter(
            is_family_head=True,
            expired=False,
            is_active=True
        ).first()

    def __str__(self):
        return self.family_name


class Relationship(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.PROTECT,
        related_name="relationships"
    )

    name = models.CharField(max_length=50)

    reserved = models.BooleanField(
        default=False,
        help_text="True for system-seeded relationships that cannot be edited or deleted."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("church", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.church.name})"

    @property
    def display_name(self):
        """Human-friendly name — replaces underscores with spaces."""
        return self.name.replace("_", " ")



class Grade(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.PROTECT,
        related_name="grades"
    )

    name = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("church", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.church.name})"
    
class TombType(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="tomb_type"
    )

    name = models.CharField(max_length=150)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        unique_together = ["church", "name"]

    def __str__(self):
        return self.name
    
class TombFee(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="tomb_fees"
    )
    tomb_type = models.ForeignKey(
        TombType,
        on_delete=models.CASCADE,
        related_name="fees"
    )
    tomb_fees = models.DecimalField(max_digits=15, decimal_places=3)
    indication = models.CharField(max_length=255)
    specification = models.TextField(blank=True)
    
    created_at = models.DateTimeField(
        auto_now_add=True  # ✅ Set on creation, never changes
    )
    
    updated_at = models.DateTimeField(
        auto_now=True  # ✅ Updates on every save
    )
    
    class Meta:
        unique_together = ["church", "tomb_type", "indication"]

    def __str__(self):
        return f"{self.tomb_type.name} - {self.tomb_fees}"

class Designation(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="designation"
    )

    designation_name = models.CharField(max_length=150)

    # ✅ NEW: Lock system defaults
    reserved = models.BooleanField(
        default=False,
        help_text="True for system-seeded designations that cannot be edited or deleted."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["church", "designation_name"]

    def __str__(self):
        return self.designation_name

class Priest(models.Model):

    DESIGNATION_CHOICES = (
        ("MAIN", "Vicar"),
        ("ASSISTANT", "Assistant Vicar"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="priests"
    )

    # ==============================
    # BASIC INFORMATION
    # ==============================

    image = models.ImageField(
        upload_to="vicars/",
        null=True,
        blank=True
    )

    name = models.CharField(
        max_length=255
    )

    designation = models.CharField(
        max_length=20,
        choices=DESIGNATION_CHOICES,
        default="MAIN"
    )

    is_active = models.BooleanField(
        default=True
    )

    family_name = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    phone_number = models.CharField(
        max_length=30,
        blank=True,
        null=True
    )

    # ==============================
    # ADDRESS
    # ==============================

    address_line1 = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    address_line2 = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    city = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    state = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    country = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    # ==============================
    # SERVICE INFORMATION
    # ==============================

    date_from = models.DateField(
        null=True,
        blank=True
    )

    date_to = models.DateField(
        null=True,
        blank=True
    )

    # ==============================
    # RECORD INFORMATION
    # ==============================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # ==============================
    # SAVE — AUTO-CLOSE PREVIOUS VICAR
    # ==============================

    def save(self, *args, **kwargs):
        """
        When a new MAIN vicar starts on date_from, automatically
        close every earlier, still-open MAIN vicar by setting
        date_to = new.date_from - 1 day and is_active = False.

        This guarantees that at most ONE MAIN vicar is "currently
        serving" at any point in time, without requiring the admin
        to manually edit the previous record.
        """
        is_new_open_vicar = (
            self.designation == "MAIN"
            and self.is_active
            and self.date_from
            and not self.date_to
        )

        super().save(*args, **kwargs)

        if is_new_open_vicar:
            from datetime import timedelta as _td

            Priest.objects.filter(
                church=self.church,
                designation="MAIN",
                is_active=True,
                date_from__lt=self.date_from,
                date_to__isnull=True,
            ).exclude(pk=self.pk).update(
                date_to=self.date_from - _td(days=1),
                is_active=False,
            )

    # ==============================
    # STRING
    # ==============================

    def __str__(self):
        return self.name

    
class Member(models.Model):
    register_number = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    folio_number = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="members"
    )

    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name="members"
    )

    name = models.CharField(max_length=150)
    baptismal_name = models.CharField(max_length=150, blank=True)

    gender = models.CharField(
        max_length=10,
        choices=(
            ("MALE", "Male"),
            ("FEMALE", "Female")
        )
    )

    email = models.EmailField(
        unique=True,
        null=True,
        blank=True
    )

    marital_status = models.CharField(
        max_length=20,
        choices=(
            ("SINGLE", "Single"),
            ("MARRIED", "Married"),
            ("WIDOWED", "Widowed"),
            ("DIVORCED", "Divorced"),
        )
    )

    house_name = models.CharField(max_length=150)
    house_sequence = models.PositiveIntegerField(default=1)

    spouse = models.OneToOneField(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="partner"
    )

    spouse_name = models.CharField(
        max_length=150,
        blank=True
    )

    dob = models.DateField(
        null=True,
        blank=True
    )

    age = models.PositiveIntegerField(
        editable=False,
        null=True,
        blank=True
    )

    mobile_no = models.CharField(
        max_length=15,
        blank=True
    )

    phone_no = models.CharField(
        max_length=15,
        blank=True
    )

    blood_group = models.CharField(
        max_length=5,
        blank=True
    )

    expired = models.BooleanField(
        default=False
    )

    father_name = models.CharField(
        max_length=150,
        blank=True
    )

    mother_name = models.CharField(
        max_length=150,
        blank=True
    )

    date_of_baptism = models.DateField(
        null=True,
        blank=True
    )

    parish_of_baptism = models.CharField(
        max_length=150,
        blank=True
    )

    educational_qualification = models.CharField(
        max_length=150,
        blank=True
    )

    sunday_school_qualification = models.CharField(
        max_length=150,
        blank=True
    )

    profession = models.CharField(
        max_length=150,
        blank=True
    )

    relationship = models.ForeignKey(
        Relationship,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    ward = models.ForeignKey(
        Ward,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="members"
    )

    family_image = models.ImageField(
        upload_to="family_images/",
        null=True,
        blank=True
    )

    grade = models.ForeignKey(
        Grade,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    joining_date = models.DateField(
        null=True,
        blank=True
    )

    transferred_from = models.CharField(
        max_length=150,
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    is_family_head = models.BooleanField(
        default=False
    )

    is_active = models.BooleanField(
        default=True
    )

    inactive_reason = models.CharField(
        max_length=100,
        blank=True
    )

    inactive_date = models.DateField(
        null=True,
        blank=True
    )

    # ============================================================
    # TIMESTAMPS
    # ============================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # ============================================================
    # SAVE
    # ============================================================

    def save(self, *args, **kwargs):

        was_head = None

        if self.pk:
            was_head = Member.objects.filter(
                pk=self.pk
            ).values_list(
                "is_family_head",
                flat=True
            ).first()

        # Enforce single active head per
        # family + house_name + house_sequence
        if self.is_family_head:
            Member.objects.filter(
                family=self.family,
                house_name=self.house_name,
                house_sequence=self.house_sequence,
                is_family_head=True,
                is_active=True
            ).exclude(
                pk=self.pk
            ).update(
                is_family_head=False
            )

        # Age calculation
        if self.dob:
            today = date.today()

            self.age = (
                today.year
                - self.dob.year
                - (
                    (today.month, today.day)
                    < (self.dob.month, self.dob.day)
                )
            )

        super().save(*args, **kwargs)

        # Auto create login for new family head
        if self.is_family_head and self.is_active:

            if was_head is False or was_head is None:

                if not self.email:
                    raise ValidationError(
                        "Family head must have an email address."
                    )

                create_family_head_user(self)

    def __str__(self):
        return self.name


class Bill(models.Model):
    BILL_TYPE_CHOICES = (
        ("NEW", "New Subscription"),
        ("UPGRADE", "Upgrade"),
        ("EXTENSION", "Extension"),
        ("RENEW", "Renewal"),
    )
    STATUS_CHOICES = (
        ("UNPAID", "Unpaid"),
        ("PAID", "Paid"),
        ("CANCELLED", "Cancelled"),
    )
    PAYMENT_METHOD_CHOICES = (
        ("CASH", "Cash"),
        ("UPI", "UPI"),
        ("CARD", "Card"),
        ("CHEQUE", "Cheque"),
    )

    bill_number = models.CharField(max_length=30, unique=True, blank=True, null=True)
    invoice_number = models.CharField(max_length=30, unique=True, blank=True, null=True)

    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name="bills")
    subscription = models.ForeignKey(ChurchSubscription, on_delete=models.CASCADE, related_name="bills")

    bill_type = models.CharField(max_length=20, choices=BILL_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    billing_cycle = models.CharField(max_length=10, choices=(("MONTHLY", "Monthly"), ("YEARLY", "Yearly")), null=True, blank=True)
    duration_months = models.PositiveIntegerField(null=True, blank=True)

    # Payment fields
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, default='CASH')
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    payment_receipt = models.ImageField(upload_to="payment_receipts/", null=True, blank=True)

    # Tax fields
    tax_type = models.ForeignKey(TaxType, on_delete=models.SET_NULL, null=True, blank=True, related_name='bills')
    tax_rate = models.ForeignKey(TaxRate, on_delete=models.SET_NULL, null=True, blank=True, related_name='bills')
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="UNPAID")
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    breakdown = models.JSONField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.bill_number:
            self.bill_number = f"EGLS-BILL-{timezone.now().year}-{self.pk or 'NEW'}"
        if not self.invoice_number:
            self.invoice_number = f"EGLS-INV-{timezone.now().year}-{self.pk or 'NEW'}"

        # Calculate tax if tax_type and tax_rate are set
        if self.tax_type and self.tax_rate and self.amount:
            self.tax_percentage = self.tax_rate.rate_percentage
            self.tax_amount = (self.amount * self.tax_percentage) / 100
            self.total_amount = self.amount + self.tax_amount
        else:
            self.total_amount = self.amount

        super().save(*args, **kwargs)

        # Fix NEW placeholder after first save
        if "NEW" in self.bill_number or "NEW" in self.invoice_number:
            self.bill_number = f"EGLS-BILL-{timezone.now().year}-{self.pk}"
            self.invoice_number = f"EGLS-INV-{timezone.now().year}-{self.pk}"
            super().save(update_fields=["bill_number", "invoice_number"])

    def __str__(self):
        return f"Bill #{self.bill_number} - {self.church.name}"


class UpgradeRequest(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="upgrade_requests"
    )

    current_package = models.ForeignKey(
        Package,
        on_delete=models.PROTECT,
        related_name="+"
    )

    requested_package = models.ForeignKey(
        Package,
        on_delete=models.PROTECT,
        related_name="+"
    )

    requested_capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Only for custom or higher member request"
    )

    reason = models.TextField(blank=True)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.church.name} → {self.requested_package.name}"


#Baptism
class Baptism(models.Model):
    BAPTISM_CATEGORY_CHOICES = (
        ("PARISH", "Parish (Church Member)"),
        ("OTHER", "Other (Outsider)"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="baptisms"
    )

    baptism_category = models.CharField(
        max_length=10,
        choices=BAPTISM_CATEGORY_CHOICES
    )

    # ---------- COMMON FIELDS ----------
    date_of_baptism = models.DateField()
    register_number = models.CharField(max_length=50)
    place_of_birth = models.CharField(max_length=150)

    name = models.CharField(max_length=150)
    baptismal_name = models.CharField(max_length=150)

    gender = models.CharField(
        max_length=10,
        choices=(("MALE", "Male"), ("FEMALE", "Female"))
    )

    dob = models.DateField(null=True, blank=True)
    address = models.TextField()

    parish_of_baptism = models.CharField(max_length=150)
    panchayath = models.CharField(max_length=150,blank=True,null=True)
    priest_name = models.CharField(max_length=150,blank=True,null=True)

    god_father = models.CharField(
    max_length=150,
    blank=True,
    null=True,
    )

    god_mother = models.CharField(
    max_length=150,
    blank=True,
    null=True,
    )

    father_name = models.CharField(max_length=150)
    mother_name = models.CharField(max_length=150)

    remarks = models.TextField(blank=True)

    # ---------- PARISH ONLY ----------
    family = models.ForeignKey(
        Family,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    main_member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="as_main_member_in_baptisms"
    )

    relation_with_main_member = models.ForeignKey(
        Relationship,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="baptism_record"
        )
    
    member = models.OneToOneField(
        Member,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="baptism"
        )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("church", "register_number")

    def __str__(self):
        return f"{self.name} ({self.register_number})"
    
    def save(self, *args, **kwargs):

        if not self.register_number:

            from registry.services import generate_register_number

            self.register_number = generate_register_number(
            self.church,
            "BAPTISM"
            )

        super().save(*args, **kwargs)


from django.db import models
from django.utils import timezone
from datetime import date

class Marriage(models.Model):
    MARRIAGE_TYPE_CHOICES = (
        ("ADD_BRIDE", "Add Bride to Parish"),
        ("TRANSFER_BRIDE", "Transfer Bride from Parish"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="marriages"
    )

    marriage_type = models.CharField(
        max_length=20,
        choices=MARRIAGE_TYPE_CHOICES
    )

    date = models.DateField()
    register_number = models.CharField(max_length=50, unique=True)
    
    # -------------------------
    # GROOM DETAILS
    # -------------------------
    groom_member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="marriages_as_groom"
    )

    groom_name = models.CharField(max_length=150, blank=True)
    groom_dob = models.DateField(blank=True, null=True)
    groom_house_name = models.CharField(max_length=150, blank=True)
    groom_family_name = models.CharField(max_length=150, blank=True)
    groom_address = models.TextField(blank=True)
    groom_father = models.CharField(max_length=150, blank=True)
    groom_mother = models.CharField(max_length=150, blank=True)

    # -------------------------
    # BRIDE DETAILS
    # -------------------------
    bride_member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="marriages_as_bride"
    )

    bride_name = models.CharField(max_length=150, blank=True)
    bride_dob = models.DateField(blank=True, null=True)
    bride_house_name = models.CharField(max_length=150, blank=True)
    bride_family_name = models.CharField(max_length=150, blank=True)
    bride_address = models.TextField(blank=True)
    bride_father = models.CharField(max_length=150, blank=True)
    bride_mother = models.CharField(max_length=150, blank=True)

    # -------------------------
    # ADDITIONAL INFO
    # -------------------------
    nationality_of_groom = models.CharField(max_length=100, blank=True)
    nationality_of_bride = models.CharField(max_length=100, blank=True)

    # -------------------------
    # WITNESSES
    # -------------------------
    witness_bride_side = models.CharField(max_length=150, blank=True)
    witness_groom_side = models.CharField(max_length=150, blank=True)

    # -------------------------
    # MINISTERS
    # -------------------------
    minister_of_marriage = models.CharField(max_length=150, blank=True)
    other_priests = models.TextField(blank=True)

    # -------------------------
    # TRANSFER INFO (only for transfer type)
    # -------------------------
    transfer_to = models.CharField(max_length=150, blank=True)
    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("church", "register_number")
        ordering = ["-date"]

    def save(self, *args, **kwargs):
        if not self.register_number:
            from registry.services import generate_register_number
            self.register_number = generate_register_number(
                self.church,
                "MARRIAGE"
            )
        super().save(*args, **kwargs)

    def __str__(self):
        groom_display = (
            self.groom_member.name
            if self.groom_member
            else self.groom_name
        )
        return f"{self.register_number} - {groom_display}"


class DheshaKuri(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="dhesha_kuris"
    )

    marriage = models.OneToOneField(
        Marriage,
        on_delete=models.CASCADE,
        related_name="dhesha_kuri"
    )

    groom_confession_date = models.DateField()
    bride_confession_date = models.DateField()

    # -------------------------
    # GROOM SNAPSHOT
    # -------------------------
    groom_name = models.CharField(max_length=150)
    groom_dob = models.DateField(null=True, blank=True)
    groom_age = models.PositiveIntegerField(null=True, blank=True)
    groom_house_name = models.CharField(max_length=150, blank=True)
    groom_family_name = models.CharField(max_length=150, blank=True)
    groom_father = models.CharField(max_length=150)
    groom_mother = models.CharField(max_length=150)
    groom_place = models.CharField(max_length=200, blank=True)

    # -------------------------
    # BRIDE SNAPSHOT
    # -------------------------
    bride_name = models.CharField(max_length=150)
    bride_dob = models.DateField(null=True, blank=True)
    bride_age = models.PositiveIntegerField(null=True, blank=True)
    bride_house_name = models.CharField(max_length=150)
    bride_family_name = models.CharField(max_length=150)
    bride_father = models.CharField(max_length=150)
    bride_mother = models.CharField(max_length=150)
    bride_place = models.CharField(max_length=200, blank=True)

    transfer_to = models.CharField(max_length=200)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("church", "marriage")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Dhesha Kuri - {self.bride_name}"

#Death Register Model
import logging
from django.db import models
from django.utils import timezone
from datetime import date, datetime

logger = logging.getLogger(__name__)

class DeathRegister(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="death_registers"
    )
 
    reg_no = models.CharField(max_length=50, blank=True, null=True)
 
    member = models.OneToOneField(
        Member,
        on_delete=models.PROTECT,
        related_name="death_record"
    )
    
    died_on = models.DateField()
    funeral_on = models.DateField()
    
    # Reference TombFee instead of storing raw charge
    tomb_fee = models.ForeignKey(
        TombFee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="death_records"
    )
    
    tomb_idn = models.CharField(max_length=100, blank=True)
    reason_of_death = models.TextField()
    remarks = models.TextField(blank=True)
 
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        unique_together = ("church", "reg_no")
        ordering = ["-created_at"]
 
    def __str__(self):
        return f"{self.member.name} ({self.reg_no or 'No Reg No'})"
 
    @property
    def tomb_charge(self):
        """Get the fee amount from the selected TombFee"""
        return self.tomb_fee.tomb_fees if self.tomb_fee else None
    
    @property
    def tomb_type(self):
        """Get the tomb type from the selected TombFee"""
        return self.tomb_fee.tomb_type if self.tomb_fee else None
 
    def save(self, *args, **kwargs):
        """
        Override save to handle date conversions and register number generation
        """
        # Clean dates before saving
        self._clean_dates()
        
        # Generate register number if not present
        if not self.reg_no:
            self._generate_register_number()
        
        # Call the parent save method
        super().save(*args, **kwargs)
 
    def _clean_dates(self):
        """
        Convert string dates to proper date objects
        """
        # Clean died_on
        if self.died_on:
            if isinstance(self.died_on, str):
                parsed = parse_date(self.died_on)
                if parsed:
                    self.died_on = parsed
                else:
                    logger.warning(f"Invalid died_on date format: {self.died_on}")
                    self.died_on = None
            elif not isinstance(self.died_on, date):
                logger.warning(f"died_on is not a date object: {type(self.died_on)}")
                self.died_on = None
        
        # Clean funeral_on
        if self.funeral_on:
            if isinstance(self.funeral_on, str):
                parsed = parse_date(self.funeral_on)
                if parsed:
                    self.funeral_on = parsed
                else:
                    logger.warning(f"Invalid funeral_on date format: {self.funeral_on}")
                    self.funeral_on = None
            elif not isinstance(self.funeral_on, date):
                logger.warning(f"funeral_on is not a date object: {type(self.funeral_on)}")
                self.funeral_on = None
 
    def _generate_register_number(self):
        """
        Safely generate register number with error handling
        """
        try:
            from registry.services import generate_register_number
            
            self.reg_no = generate_register_number(
                self.church,
                "DEATH"
            )
            logger.info(f"Generated register number: {self.reg_no} for death record")
            
        except Exception as e:
            logger.error(f"Failed to generate register number: {e}")
            logger.error(traceback.format_exc())
            
            # Fallback: Generate a temporary number
            timestamp = int(time.time())
            self.reg_no = f"TEMP-DEATH-{timestamp}"
            logger.warning(f"Using temporary register number: {self.reg_no}")
    
    def get_days_since_death(self):
        """Get number of days since death"""
        if self.died_on:
            today = date.today()
            return (today - self.died_on).days
        return None
    
    def get_days_since_funeral(self):
        """Get number of days since funeral"""
        if self.funeral_on:
            today = date.today()
            return (today - self.funeral_on).days
        return None
 

class RegisterSetting(models.Model):

    REGISTER_TYPES = (
        ("HEAD", "Family Head Register"),
        ("BAPTISM", "Baptism Register"),
        ("MARRIAGE", "Marriage Register"),
        ("DEATH", "Death Register"),
        ("CERTIFICATE", "Certificate"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="register_settings"
    )

    register_type = models.CharField(
        max_length=20,
        choices=REGISTER_TYPES
    )

    # ---------- REGISTER NUMBER ----------
    register_prefix = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    register_suffix = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    next_register_number = models.PositiveIntegerField(
        default=1
    )

    register_padding = models.PositiveIntegerField(
        default=4,
        help_text="Example: 0001"
    )

    # ---------- FOLIO NUMBER (for HEAD register) ----------
    folio_prefix = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    folio_suffix = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    next_folio_number = models.PositiveIntegerField(
        default=1
    )

    folio_padding = models.PositiveIntegerField(
        default=4
    )

    # ---------- FINANCIAL YEAR ----------
    use_financial_year = models.BooleanField(
        default=False
    )

    financial_year = models.PositiveIntegerField(
    null=True,
    blank=True,
    help_text="Example: 2025 for FY 2025-26"
    )

    financial_year_start_month = models.PositiveIntegerField(
    null=True,
    blank=True,
    help_text="Start month (1-12)"
    )

    financial_year_end_month = models.PositiveIntegerField(
    null=True,
    blank=True,
    help_text="End month (1-12)"
    )

    financial_year_format = models.CharField(
        max_length=20,
        default="YYYY-YY",
        help_text="Example: 2025-26"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("church", "register_type")

    def __str__(self):
        return f"{self.church.name} - {self.register_type}"

class Events(models.Model):

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="events"
    )

    name = models.CharField(max_length=200)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"
    
class Offering(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="offerings"
    )

    event = models.ForeignKey(
        Events,
        on_delete=models.PROTECT,
        related_name="offerings"
    )

    member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        related_name="offerings"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    narration = models.TextField(blank=True)

    is_cancelled = models.BooleanField(default=False)
    cancel_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.member.name} - {self.amount} ({self.event.name})"
    
class VisitorMaster(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="visitors"
    )

    visitor_name = models.CharField(max_length=100)
    visitor_date = models.DateField()
    reason_to_visit = models.CharField(
        max_length=300,
        blank=True,
        null=True
    )
    visitor_address = models.CharField(
        max_length=300,
        blank=True,
        null=True
    )
    remarks = models.CharField(
        max_length=300,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.visitor_name} ({self.visitor_date})"
    

class Subscription(models.Model):
    BILLING_CYCLE_CHOICES = (
        ("MONTHLY", "Monthly"),
        ("YEARLY", "Yearly"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="subscriptions"
    )
    grade = models.ForeignKey(
        Grade,
        on_delete=models.PROTECT,
        related_name="subscriptions"
    )

    term = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    # NEW
    billing_cycle = models.CharField(
        max_length=10,
        choices=BILLING_CYCLE_CHOICES,
        default="MONTHLY",
        help_text="Whether this subscription is charged monthly or yearly."
    )

    ledger = models.ForeignKey(
        "AccountLedgerMaster",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="subscriptions",
        help_text="Ledger this subscription posts to."
    )

    is_cancelled = models.BooleanField(default=False)
    cancel_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.grade.name} - {self.term} ({self.amount})"
    
class AccountGroupMaster(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="account_groups"
    )

    account_code = models.IntegerField(null=True, blank=True)

    group_name = models.CharField(max_length=100)

    alias = models.CharField(max_length=300, null=True, blank=True)

    under_group = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sub_groups"
    )

    status = models.BooleanField(default=True)
    reserved = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.group_name
    
class AccountLedgerMaster(models.Model):
    NATURE_CHOICES = (
        ("ASSET", "Asset"),
        ("LIABILITY", "Liability"),
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
        ("EQUITY", "Equity"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="account_ledgers"
    )

    ledger_code = models.IntegerField(null=True, blank=True)

    ledger_name = models.CharField(max_length=100)

    alias = models.CharField(max_length=300, null=True, blank=True)

    account_group = models.ForeignKey(
        AccountGroupMaster,
        on_delete=models.PROTECT,
        related_name="ledgers"
    )

    ledger_nature = models.CharField(
        max_length=15,
        choices=NATURE_CHOICES,
        default="ASSET",
        help_text="Drives whether debit or credit increases this ledger."
    )

    status = models.BooleanField(default=True)
    reserved = models.BooleanField(default=False)

    op_balance = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.ledger_name

    # ============================================================
    # BALANCE
    # ============================================================

    def get_current_balance(self):
        """
        Opening balance adjusted by the ledger's natural direction.

        Sign convention (returns a positive number when the ledger is
        on its natural side):
          ASSET / EXPENSE            : opening + debits  − credits
          LIABILITY / INCOME / EQUITY: opening + credits − debits

        Both cancelled originals AND their reversal entries are
        excluded, so a cancelled voucher leaves zero net effect on
        the balance.
        """
        from django.db.models import Sum, Q

        agg = self.entries.filter(
            is_cancelled=False,
            is_reversal=False,
        ).aggregate(
            debits=Sum("amount", filter=Q(entry_type="DEBIT")),
            credits=Sum("amount", filter=Q(entry_type="CREDIT")),
        )

        debits = float(agg["debits"] or 0)
        credits = float(agg["credits"] or 0)
        opening = float(self.op_balance or 0)

        if self.ledger_nature in ("ASSET", "EXPENSE"):
            return opening + debits - credits
        return opening + credits - debits

    @property
    def current_balance(self):
        return self.get_current_balance()
    
class LedgerEntry(models.Model):
    """
    Single-entry ledger posting.

    DEBIT  -> increases the ledger balance
    CREDIT -> decreases the ledger balance
    Cancel is handled by a reversing entry, not deletion.
    """

    ENTRY_TYPE_CHOICES = (
        ("DEBIT", "Debit"),
        ("CREDIT", "Credit"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="ledger_entries"
    )

    ledger = models.ForeignKey(
        AccountLedgerMaster,
        on_delete=models.PROTECT,
        related_name="entries"
    )

    entry_type = models.CharField(
        max_length=6,
        choices=ENTRY_TYPE_CHOICES
    )

    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    entry_date = models.DateField()

    narration = models.CharField(
        max_length=300,
        blank=True,
        null=True
    )

    # ---------------- Source links ----------------
    payment = models.ForeignKey(
        "PaymentMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries"
    )

    receipt = models.ForeignKey(          # ✅ NEW
        "ReceiptMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries"
    )
    contra = models.ForeignKey(              # ← NEW
        "ContraMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )

    # ---------------- Cancel handling ----------------
    is_cancelled = models.BooleanField(default=False)
    is_reversal = models.BooleanField(
        default=False,
        help_text="True if this row is a reversing entry for a cancelled document."
    )
    reversed_entry = models.OneToOneField(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reversed_by"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-entry_date", "-id"]
        verbose_name = "Ledger Entry"
        verbose_name_plural = "Ledger Entries"

    def __str__(self):
        return f"{self.entry_type} {self.amount} - {self.ledger.ledger_name}"

    @staticmethod
    def resolve_entry_type(ledger, is_payment_out=True):
        """
        Legacy helper kept for compatibility.
        """
        nature = (ledger.ledger_nature or "ASSET").upper()

        if nature in ("ASSET",):
            entry_type = "CREDIT" if is_payment_out else "DEBIT"
        else:
            entry_type = "DEBIT" if is_payment_out else "CREDIT"

        return entry_type

class ReceiptMaster(models.Model):
    """
    Receipt header. Money coming IN.

    Posting:
      1. CREDIT on each income ledger     (income increases on credit)
      2. DEBIT  on the Cash / Bank ledger (asset increases on debit)

    Debits == Credits. Books balance.
    """

    PAYMENT_TYPE_CHOICES = (
        ("BANK", "Bank"),
        ("CASH", "Cash"),
    )

    TRANSACTION_TYPE_CHOICES = (
        ("BANK_TRANSFER", "Bank Transfer"),
        ("UPI", "UPI"),
        ("CARD", "Card"),
        ("CHEQUE", "Cheque"),
        ("CASH", "Cash"),
    )

    CANCEL_REASON_CHOICES = (
        ("INCORRECT_ENTRY", "Incorrect receipt entry"),
        ("DUPLICATE", "Duplicate receipt"),
        ("WRONG_AMOUNT", "Wrong amount"),
        ("WRONG_PARTY", "Wrong member / party"),
        ("BANK_REJECTED", "Bank rejected"),
        ("OTHER", "Other"),
    )

    church = models.ForeignKey(
        "Church",
        on_delete=models.CASCADE,
        related_name="receipts",
    )

    receipt_number = models.CharField(
        max_length=30,
        blank=True,
        null=True,
    )

    receipt_date = models.DateField()

    ref_no = models.CharField(
        max_length=50,
        null=True,
        blank=True,
    )

    member = models.ForeignKey(
        "Member",
        on_delete=models.PROTECT,
        related_name="receipts",
    )

    payment_type = models.CharField(
        max_length=10,
        choices=PAYMENT_TYPE_CHOICES,
        default="BANK",
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES,
        blank=True,
        null=True,
    )

    bank_account = models.ForeignKey(
        "BankAccount",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="receipts",
    )

    narration = models.TextField(
        blank=True,
        null=True,
    )

    grand_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
    )

    is_cancelled = models.BooleanField(default=False)
    cancel_reason = models.CharField(
        max_length=30,
        choices=CANCEL_REASON_CHOICES,
        null=True,
        blank=True,
    )
    cancel_remarks = models.TextField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-receipt_date", "-id"]
        verbose_name = "Receipt"
        verbose_name_plural = "Receipts"
        unique_together = [("church", "receipt_number")]

    def __str__(self):
        return (
            f"{self.receipt_number} - "
            f"{self.member.name if self.member else ''} "
            f"({self.grand_total})"
        )

    # ============================================================
    # NUMBERING (race-safe)
    # ============================================================

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            from django.db import transaction

            with transaction.atomic():
                year = timezone.now().year
                last = (
                    ReceiptMaster.objects
                    .select_for_update()
                    .filter(
                        church=self.church,
                        receipt_number__startswith=f"RCP-{year}-",
                    )
                    .order_by("-id")
                    .first()
                )

                if last and last.receipt_number:
                    try:
                        n = int(last.receipt_number.split("-")[-1]) + 1
                    except (ValueError, IndexError):
                        n = 1
                else:
                    n = 1

                self.receipt_number = f"RCP-{year}-{str(n).zfill(5)}"

                super().save(*args, **kwargs)
                return

        super().save(*args, **kwargs)

    # ============================================================
    # LEDGER POSTING  — THE FIX
    # ============================================================

    def post_to_ledger(self):
        """
        Post TWO entries per receipt:

          1. CREDIT on each income ledger     (income ↑ on credit)
          2. DEBIT  on the Cash / Bank ledger (asset ↑ on debit)

        Previously BOTH sides were posted as DEBIT, which made
        total debits ≠ total credits and broke every income
        ledger balance.

        Raises ValidationError if no Cash / Bank ledger is configured —
        never silently posts only one side.

        Idempotent.
        """
        if self.ledger_entries.filter(
            is_cancelled=False, is_reversal=False
        ).exists():
            return

        # ----- 1. Income side — CREDIT per line -----
        total = 0
        for line in self.lines.all():
            LedgerEntry.objects.create(
                church=self.church,
                ledger=line.ledger,
                entry_type="CREDIT",              # ✅ FIXED (was DEBIT)
                amount=line.amount,
                entry_date=self.receipt_date,
                narration=(
                    self.narration
                    or f"Receipt {self.receipt_number}"
                ),
                receipt=self,
            )
            total += float(line.amount or 0)

        if total <= 0:
            return

        # ----- 2. Cash / Bank side — DEBIT -----
        if self.payment_type == "CASH":
            cash_bank_ledger = get_cash_ledger(self.church)
        else:
            cash_bank_ledger = get_bank_ledger(self.church)

        if not cash_bank_ledger:
            raise ValidationError(
                "Cash / Bank ledger is not configured for this church. "
                "Cannot post receipt."
            )

        LedgerEntry.objects.create(
            church=self.church,
            ledger=cash_bank_ledger,
            entry_type="DEBIT",                   # money in
            amount=total,
            entry_date=self.receipt_date,
            narration=(
                self.narration
                or f"Receipt {self.receipt_number}"
            ),
            receipt=self,
        )

    # ============================================================
    # REVERSAL (unchanged — generic opposite-entry logic works)
    # ============================================================

    def reverse_ledger_entry(self):
        """
        On cancel: mark originals cancelled and create an opposite
        reversal for each. A cancelled receipt leaves zero net
        effect on any ledger.
        """
        originals = list(
            self.ledger_entries.filter(
                is_cancelled=False, is_reversal=False
            )
        )

        if not originals:
            return

        for original in originals:
            if getattr(original, "reversed_by", None):
                continue

            original.is_cancelled = True
            original.save(update_fields=["is_cancelled"])

            opposite = (
                "CREDIT"
                if original.entry_type == "DEBIT"
                else "DEBIT"
            )

            reversal = LedgerEntry.objects.create(
                church=self.church,
                ledger=original.ledger,
                entry_type=opposite,
                amount=original.amount,
                entry_date=timezone.now().date(),
                narration=f"Reversal of {self.receipt_number}",
                receipt=self,
                is_reversal=True,
            )

            original.reversed_entry = reversal
            original.save(update_fields=["reversed_entry"])


class ReceiptLine(models.Model):
    """
    One Particulars line on a receipt.
    Each line is a single ledger + amount, optionally linked to a
    subscription so receipts and subscriptions can be reconciled.
    """

    receipt = models.ForeignKey(
        "ReceiptMaster",
        on_delete=models.CASCADE,
        related_name="lines"
    )

    ledger = models.ForeignKey(
        "AccountLedgerMaster",
        on_delete=models.PROTECT,
        related_name="receipt_lines"
    )

    # NEW — which subscription is this payment for (if any)
    subscription = models.ForeignKey(
        "Subscription",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receipt_lines"
    )

    amount = models.DecimalField(max_digits=15, decimal_places=2)

    position = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "id"]
        verbose_name = "Receipt Line"
        verbose_name_plural = "Receipt Lines"

    def __str__(self):
        return f"{self.ledger.ledger_name} - {self.amount}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        total = (
            ReceiptLine.objects
            .filter(receipt=self.receipt)
            .aggregate(s=models.Sum("amount"))["s"]
            or 0
        )
        ReceiptMaster.objects.filter(pk=self.receipt_id).update(
            grand_total=total
        )
    
# NEW MODEL
class BankAccount(models.Model):
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name="bank_accounts")
    bank_name = models.CharField(max_length=150)
    account_number = models.CharField(max_length=50)
    masked_account_number = models.CharField(max_length=50, blank=True)  # auto-derived
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=150, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    opening_balance = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0.00,
        help_text="Initial balance when the account was added"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["bank_name"]
        unique_together = ("church", "account_number")

    def save(self, *args, **kwargs):
        if self.account_number and len(self.account_number) >= 4:
            self.masked_account_number = f"•••• {self.account_number[-4:]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.bank_name} {self.masked_account_number}"

class PaymentMaster(models.Model):
    PAYMENT_TYPE_CHOICES = (
        ("BANK", "Bank"),
        ("CASH", "Cash"),
    )
    PAYMENT_MODE_CHOICES = (
        ("BANK_TRANSFER", "Bank Transfer"),
        ("UPI", "UPI"),
        ("CARD", "Card"),
        ("CHEQUE", "Cheque"),
        ("CASH", "Cash"),
    )
    CANCEL_REASON_CHOICES = (
        ("INCORRECT_ENTRY", "Incorrect payment entry"),
        ("DUPLICATE", "Duplicate payment"),
        ("WRONG_AMOUNT", "Wrong amount"),
        ("WRONG_PARTY", "Wrong party"),
        ("BANK_REJECTED", "Bank rejected"),
        ("OTHER", "Other"),
    )

    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name="payments")

    # ✅ unique=True removed — uniqueness is now enforced per-church
    #    via Meta.unique_together below
    voucher_number = models.CharField(max_length=30, blank=True, null=True)

    ref_no = models.CharField(max_length=50, null=True, blank=True)
    payment_date = models.DateField()
    party_name = models.CharField(max_length=100)

    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPE_CHOICES, default="BANK")
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES)

    bank_account = models.ForeignKey(BankAccount, on_delete=models.PROTECT, null=True, blank=True, related_name="payments")

    account_ledger = models.ForeignKey(AccountLedgerMaster, on_delete=models.PROTECT, related_name="payments")

    amount = models.DecimalField(max_digits=15, decimal_places=2)
    narration = models.CharField(max_length=300, null=True, blank=True)

    is_cancelled = models.BooleanField(default=False)
    cancel_reason = models.CharField(max_length=30, choices=CANCEL_REASON_CHOICES, null=True, blank=True)
    cancel_remarks = models.TextField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-payment_date", "-id"]
        # ✅ Per-church uniqueness: two churches can both have PAY-2026-00001
        unique_together = [("church", "voucher_number")]

    def save(self, *args, **kwargs):
        if not self.voucher_number:
            year = timezone.now().year
            last = PaymentMaster.objects.filter(
                church=self.church,
                voucher_number__startswith=f"PAY-{year}-"
            ).order_by("-id").first()
            if last and last.voucher_number:
                try:
                    n = int(last.voucher_number.split("-")[-1]) + 1
                except (ValueError, IndexError):
                    n = 1
            else:
                n = 1
            self.voucher_number = f"PAY-{year}-{str(n).zfill(5)}"
        super().save(*args, **kwargs)

    # ============================================================
    # LEDGER POSTING
    # ============================================================

    def post_to_ledger(self):
        """
        Post TWO entries per payment:
          1. DEBIT on the expense / party ledger
          2. CREDIT on the Cash / Bank ledger (money out)

        Idempotent.
        """
        if self.ledger_entries.filter(
            is_cancelled=False, is_reversal=False
        ).exists():
            return

        # 1. Expense side
        LedgerEntry.objects.create(
            church=self.church,
            ledger=self.account_ledger,
            entry_type="DEBIT",
            amount=self.amount,
            entry_date=self.payment_date,
            narration=self.narration or f"Payment {self.voucher_number}",
            payment=self,
        )

        # 2. Cash / Bank side
        if self.payment_type == "CASH":
            cash_bank_ledger = get_cash_ledger(self.church)
        else:
            cash_bank_ledger = get_bank_ledger(self.church)

        if cash_bank_ledger:
            LedgerEntry.objects.create(
                church=self.church,
                ledger=cash_bank_ledger,
                entry_type="CREDIT",   # money going out
                amount=self.amount,
                entry_date=self.payment_date,
                narration=self.narration or f"Payment {self.voucher_number}",
                payment=self,
            )

    def reverse_ledger_entry(self):
        """
        On cancel: mark ALL existing unreversed entries as cancelled
        and create an opposite reversal for each.
        """
        originals = list(
            self.ledger_entries.filter(
                is_cancelled=False, is_reversal=False
            )
        )

        if not originals:
            return

        for original in originals:
            if getattr(original, "reversed_by", None):
                continue

            original.is_cancelled = True
            original.save(update_fields=["is_cancelled"])

            opposite = "CREDIT" if original.entry_type == "DEBIT" else "DEBIT"

            reversal = LedgerEntry.objects.create(
                church=self.church,
                ledger=original.ledger,
                entry_type=opposite,
                amount=original.amount,
                entry_date=timezone.now().date(),
                narration=f"Reversal of {self.voucher_number}",
                payment=self,
                is_reversal=True,
            )

            original.reversed_entry = reversal
            original.save(update_fields=["reversed_entry"])

    def __str__(self):
        return f"{self.voucher_number} - {self.party_name} ({self.amount})"
    
class QurbanaReceipts(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="qurbana_receipts"
    )
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20)
    qurbana_date = models.DateField()
    narration = models.CharField(max_length=300, null=True, blank=True)

    created_at = models.DateTimeField(null=True, blank=True, auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True, auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.qurbana_date})"




class CommitteeMaster(models.Model):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="committees"
    )

    committee_code = models.CharField(
        max_length=20,
        editable=False
    )

    committee_name = models.CharField(
        max_length=50
    )

    committee_from_date = models.DateField()

    committee_to_date = models.DateField()
    # ✅ NEW FIELDS
    president = models.ForeignKey(
        'Priest', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='presided_committees',
        help_text="Active Vicar"
    )
    vice_president = models.ForeignKey(
        'Priest', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='vice_presided_committees',
        help_text="Active Assistant Vicar"
    )

    # Multiple committee members
    # Example:
    # [
    #     {
    #         "member": 1,
    #         "designation": 2
    #     },
    #     {
    #         "member": 5,
    #         "designation": 3
    #     }
    # ]
    members = models.JSONField(
        default=list,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        null=True,
        blank=True
    )

    def save(self, *args, **kwargs):
        if not self.committee_code:
            last_committee = (
                CommitteeMaster.objects
                .filter(church=self.church)
                .order_by("-id")
                .first()
            )

            if last_committee and last_committee.committee_code:
                try:
                    last_number = int(
                        last_committee.committee_code.replace("COM-", "")
                    )
                except (ValueError, AttributeError):
                    last_number = 0
            else:
                last_number = 0

            self.committee_code = f"COM-{last_number + 1:03d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.committee_code} - {self.committee_name}"



# -----------------------------------------OLD DATA-----------------------------------------------------------------

class LegacyBaptism(models.Model):
    """
    Historical / back-filled baptism records.
    Does NOT create or link a Member.
    Used only for typing in old register data.
    """

    BAPTISM_CATEGORY_CHOICES = (
        ("PARISH", "Parish (Church Member)"),
        ("OTHER", "Other (Outsider)"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="legacy_baptisms"
    )

    baptism_category = models.CharField(
        max_length=10,
        choices=BAPTISM_CATEGORY_CHOICES,
        default="PARISH"
    )

    # ---- REGISTER ----
    date_of_baptism = models.DateField()
    register_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Old register number as written in the book"
    )

    # ---- PERSON ----
    name = models.CharField(max_length=150)
    baptismal_name = models.CharField(max_length=150, blank=True, null=True)
    gender = models.CharField(
        max_length=10,
        choices=(("MALE", "Male"), ("FEMALE", "Female"))
    )
    dob = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=150, blank=True, null=True)

    # ---- FAMILY (typed, not linked) ----
    family_name = models.CharField(max_length=150, blank=True, null=True)
    house_name = models.CharField(max_length=150, blank=True, null=True)
    father_name = models.CharField(max_length=150, blank=True, null=True)
    mother_name = models.CharField(max_length=150, blank=True, null=True)

    # ---- GODPARENTS ----
    god_father = models.CharField(max_length=150, blank=True, null=True)
    god_mother = models.CharField(max_length=150, blank=True, null=True)

    # ---- CHURCH / PRIEST ----
    parish_of_baptism = models.CharField(max_length=150, blank=True, null=True)
    panchayath = models.CharField(max_length=150, blank=True, null=True)
    priest_name = models.CharField(max_length=150, blank=True, null=True)

    address = models.TextField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Legacy Baptism"
        verbose_name_plural = "Legacy Baptisms"
        ordering = ["-date_of_baptism"]
        unique_together = ("church", "register_number")

    def __str__(self):
        return f"{self.name} ({self.register_number or 'no-reg'})"


class LegacyMarriage(models.Model):
    """
    Historical / back-filled marriage records.
    Does NOT create DheshaKuri, does NOT modify Member.marital_status.
    Used only for typing in old register data.
    """

    MARRIAGE_TYPE_CHOICES = (
        ("ADD_BRIDE", "Add Bride to Parish"),
        ("TRANSFER_BRIDE", "Transfer Bride from Parish"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="legacy_marriages"
    )

    marriage_type = models.CharField(
        max_length=20,
        choices=MARRIAGE_TYPE_CHOICES,
        default="ADD_BRIDE"
    )

    date = models.DateField()
    register_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Old register number as written in the book"
    )

    # ---- GROOM (typed) ----
    groom_name = models.CharField(max_length=150)
    groom_dob = models.DateField(null=True, blank=True)
    groom_house_name = models.CharField(max_length=150, blank=True, null=True)
    groom_family_name = models.CharField(max_length=150, blank=True, null=True)
    groom_address = models.TextField(blank=True, null=True)
    groom_father = models.CharField(max_length=150, blank=True, null=True)
    groom_mother = models.CharField(max_length=150, blank=True, null=True)
    nationality_of_groom = models.CharField(max_length=100, blank=True, null=True)

    # ---- BRIDE (typed) ----
    bride_name = models.CharField(max_length=150)
    bride_dob = models.DateField(null=True, blank=True)
    bride_house_name = models.CharField(max_length=150, blank=True, null=True)
    bride_family_name = models.CharField(max_length=150, blank=True, null=True)
    bride_address = models.TextField(blank=True, null=True)
    bride_father = models.CharField(max_length=150, blank=True, null=True)
    bride_mother = models.CharField(max_length=150, blank=True, null=True)
    nationality_of_bride = models.CharField(max_length=100, blank=True, null=True)

    # ---- WITNESSES / MINISTERS ----
    witness_bride_side = models.CharField(max_length=150, blank=True, null=True)
    witness_groom_side = models.CharField(max_length=150, blank=True, null=True)
    minister_of_marriage = models.CharField(max_length=150, blank=True, null=True)
    other_priests = models.TextField(blank=True, null=True)

    # ---- TRANSFER ----
    transfer_to = models.CharField(max_length=150, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Legacy Marriage"
        verbose_name_plural = "Legacy Marriages"
        ordering = ["-date"]
        unique_together = ("church", "register_number")

    def __str__(self):
        return f"{self.groom_name} & {self.bride_name} ({self.register_number or 'no-reg'})"



class LegacyDeath(models.Model):
    """
    Historical / back-filled death records.
    Does NOT mark a Member as expired.
    Used only for typing in old register data.
    """

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="legacy_deaths"
    )

    reg_no = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Old register number as written in the book"
    )

    # ---- PERSON (typed, not linked to Member) ----
    name = models.CharField(max_length=150)
    gender = models.CharField(
        max_length=10,
        choices=(("MALE", "Male"), ("FEMALE", "Female")),
        blank=True,
        null=True
    )
    dob = models.DateField(null=True, blank=True)
    age_at_death = models.PositiveIntegerField(null=True, blank=True)

    family_name = models.CharField(max_length=150, blank=True, null=True)
    house_name = models.CharField(max_length=150, blank=True, null=True)
    father_name = models.CharField(max_length=150, blank=True, null=True)
    mother_name = models.CharField(max_length=150, blank=True, null=True)
    marital_status = models.CharField(max_length=20, blank=True, null=True)

    # ---- DEATH / FUNERAL ----
    died_on = models.DateField()
    funeral_on = models.DateField(null=True, blank=True)
    reason_of_death = models.TextField(blank=True, null=True)
    place_of_death = models.CharField(max_length=200, blank=True, null=True)

    # ---- TOMB (typed text, no FK to TombFee) ----
    tomb_type_name = models.CharField(max_length=150, blank=True, null=True)
    tomb_idn = models.CharField(max_length=100, blank=True, null=True)
    tomb_charge = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        null=True,
        blank=True
    )

    # ---- PRIEST / CHURCH ----
    priest_name = models.CharField(max_length=150, blank=True, null=True)

    remarks = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Legacy Death"
        verbose_name_plural = "Legacy Deaths"
        ordering = ["-died_on"]
        unique_together = ("church", "reg_no")

    def __str__(self):
        return f"{self.name} ({self.reg_no or 'no-reg'})"


# ----------------------------------------------------Contra--------------------------------------------------------------------


class ContraMaster(models.Model):
    """
    Contra voucher — money movement between two of the church's own
    Cash / Bank ledgers. Not income, not expense.

    Posting:
      DEBIT  on the destination ledger (money in)
      CREDIT on the source ledger      (money out)
    """

    CONTRA_TYPE_CHOICES = (
        ("CASH_TO_BANK", "Cash Deposited to Bank"),
        ("BANK_TO_CASH", "Cash Withdrawn from Bank"),
        ("BANK_TO_BANK", "Bank to Bank Transfer"),
    )

    CANCEL_REASON_CHOICES = (
        ("INCORRECT_ENTRY", "Incorrect contra entry"),
        ("DUPLICATE", "Duplicate contra"),
        ("WRONG_AMOUNT", "Wrong amount"),
        ("WRONG_ACCOUNT", "Wrong bank / cash account"),
        ("BANK_REJECTED", "Bank rejected"),
        ("OTHER", "Other"),
    )

    church = models.ForeignKey(
        Church, on_delete=models.CASCADE, related_name="contra_vouchers"
    )

    voucher_number = models.CharField(max_length=30, blank=True, null=True)

    contra_date = models.DateField()
    ref_no = models.CharField(max_length=50, null=True, blank=True)

    contra_type = models.CharField(max_length=20, choices=CONTRA_TYPE_CHOICES)

    # Source = where money comes FROM (will be CREDITED)
    from_ledger = models.ForeignKey(
        AccountLedgerMaster,
        on_delete=models.PROTECT,
        related_name="contra_from",
    )

    # Destination = where money goes TO (will be DEBITED)
    to_ledger = models.ForeignKey(
        AccountLedgerMaster,
        on_delete=models.PROTECT,
        related_name="contra_to",
    )

    # Optional bank account references for reporting / reconciliation
    from_bank_account = models.ForeignKey(
        BankAccount, on_delete=models.PROTECT,
        null=True, blank=True, related_name="contra_from",
    )
    to_bank_account = models.ForeignKey(
        BankAccount, on_delete=models.PROTECT,
        null=True, blank=True, related_name="contra_to",
    )

    amount = models.DecimalField(max_digits=15, decimal_places=2)
    narration = models.CharField(max_length=300, null=True, blank=True)

    is_cancelled = models.BooleanField(default=False)
    cancel_reason = models.CharField(
        max_length=30, choices=CANCEL_REASON_CHOICES, null=True, blank=True
    )
    cancel_remarks = models.TextField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-contra_date", "-id"]
        unique_together = [("church", "voucher_number")]

    def __str__(self):
        return f"{self.voucher_number} - {self.amount}"

    # ---- numbering (same pattern as PaymentMaster) ----
    def save(self, *args, **kwargs):
        if not self.voucher_number:
            year = timezone.now().year
            last = ContraMaster.objects.filter(
                church=self.church,
                voucher_number__startswith=f"CON-{year}-",
            ).order_by("-id").first()

            if last and last.voucher_number:
                try:
                    n = int(last.voucher_number.split("-")[-1]) + 1
                except (ValueError, IndexError):
                    n = 1
            else:
                n = 1

            self.voucher_number = f"CON-{year}-{str(n).zfill(5)}"

        super().save(*args, **kwargs)

    # ---- posting ----
    def post_to_ledger(self):
        """
        DEBIT  destination ledger (money in)
        CREDIT source ledger      (money out)
        Idempotent.
        """
        if self.ledger_entries.filter(
            is_cancelled=False, is_reversal=False
        ).exists():
            return

        narration = self.narration or f"Contra {self.voucher_number}"

        # Destination — money comes in (DEBIT asset)
        LedgerEntry.objects.create(
            church=self.church,
            ledger=self.to_ledger,
            entry_type="DEBIT",
            amount=self.amount,
            entry_date=self.contra_date,
            narration=narration,
            contra=self,
        )

        # Source — money goes out (CREDIT asset)
        LedgerEntry.objects.create(
            church=self.church,
            ledger=self.from_ledger,
            entry_type="CREDIT",
            amount=self.amount,
            entry_date=self.contra_date,
            narration=narration,
            contra=self,
        )

    # ---- reversal (same pattern as PaymentMaster) ----
    def reverse_ledger_entry(self):
        originals = list(
            self.ledger_entries.filter(
                is_cancelled=False, is_reversal=False
            )
        )
        if not originals:
            return

        for original in originals:
            if getattr(original, "reversed_by", None):
                continue

            original.is_cancelled = True
            original.save(update_fields=["is_cancelled"])

            opposite = "CREDIT" if original.entry_type == "DEBIT" else "DEBIT"

            reversal = LedgerEntry.objects.create(
                church=self.church,
                ledger=original.ledger,
                entry_type=opposite,
                amount=original.amount,
                entry_date=timezone.now().date(),
                narration=f"Reversal of {self.voucher_number}",
                contra=self,
                is_reversal=True,
            )

            original.reversed_entry = reversal
            original.save(update_fields=["reversed_entry"])