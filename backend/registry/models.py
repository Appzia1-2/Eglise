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

from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from dateutil.relativedelta import relativedelta

class Package(models.Model):
    code = models.CharField(max_length=50, unique=True, help_text="Unique package code (e.g., PKG-001)")
    name = models.CharField(max_length=100)
    member_limit = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Maximum members allowed. Leave blank for unlimited"
    )
    
    # Pricing (only monthly and yearly rates)
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
    
    def can_delete(self):
        """Check if package can be deleted (hard delete)"""
        return not self.is_in_use
    
    def can_edit(self):
        """Check if package can be edited"""
        return not self.is_in_use
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    class Meta:
        ordering = ['code']

from decimal import Decimal
from datetime import date, datetime

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

    # 🔥 duration_months ONLY for end_date calculation.
    # It should NEVER be multiplied into price calculations.
    duration_months = models.PositiveIntegerField(
        default=12,
        help_text="Number of months purchased - ONLY affects end_date, NOT price"
    )

    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)

    custom_capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Custom member capacity if different from package limit"
    )

    # 🔥 PRICING SNAPSHOT — captured once, at purchase.
    # Without this, editing a Package silently rewrites what every existing
    # church already bought, because get_rate()/get_capacity() read the
    # package live. Nullable so pre-existing rows keep working unchanged.
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

    is_active = models.BooleanField(default=False)
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

    # Upgrade tracking
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
    upgrade_date = models.DateField(null=True, blank=True)
    pro_rata_credit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Church Subscription'
        verbose_name_plural = 'Church Subscriptions'

    def __str__(self):
        return f"{self.church.name} - {self.package.name} ({self.billing_cycle})"

    def save(self, *args, **kwargs):
        """Snapshot pricing on purchase, then auto-calculate end date"""
        # 🔥 Capture the package's terms once. The API clears locked_rate
        # deliberately when a church switches package or billing cycle,
        # which counts as a fresh purchase and re-snapshots here.
        if self.locked_rate is None and self.package_id:
            if self.billing_cycle == 'MONTHLY':
                self.locked_rate = self.package.rate_per_member_monthly
            else:
                self.locked_rate = self.package.rate_per_member_yearly
            self.locked_capacity = self.package.member_limit
            self.locked_package_name = self.package.name

        if self.start_date and self.duration_months:
            # Ensure start_date is a date object
            if isinstance(self.start_date, datetime):
                self.start_date = self.start_date.date()
            self.end_date = self.start_date + relativedelta(months=self.duration_months)
        super().save(*args, **kwargs)

    # ============ DATE & EXPIRATION METHODS ============

    def is_expired(self):
        """Check if subscription has expired"""
        if not self.end_date:
            return False
        return self.end_date < date.today()

    def expires_in_days(self):
        """Get number of days until expiration"""
        if not self.end_date:
            return None
        days_left = (self.end_date - date.today()).days
        return max(0, days_left)

    def get_used_days(self):
        """Get number of days used in current subscription"""
        if not self.start_date:
            return 0
        today = date.today()
        if today < self.start_date:
            return 0
        return (today - self.start_date).days

    def get_remaining_days(self):
        """Get number of days remaining in current subscription"""
        if not self.end_date:
            return 0
        today = date.today()
        if today > self.end_date:
            return 0
        return (self.end_date - today).days

    def get_total_days(self):
        """Get total days in subscription period"""
        if not self.start_date or not self.end_date:
            return 0
        return (self.end_date - self.start_date).days

    def get_progress_percentage(self):
        """Get percentage of subscription completed"""
        total_days = self.get_total_days()
        if total_days <= 0:
            return 0
        used_days = self.get_used_days()
        percentage = (used_days / total_days) * 100
        return round(min(100, percentage), 2)

    # ============ PRICING METHODS ============

    def get_rate(self):
        """
        Rate per member. The purchase-time snapshot wins over the live
        package, so admin edits to a Package never change what an existing
        church is paying.
        """
        if self.locked_rate is not None:
            return self.locked_rate
        # Fallback for rows created before snapshots existed
        if self.billing_cycle == 'MONTHLY':
            return self.package.rate_per_member_monthly
        return self.package.rate_per_member_yearly

    def get_capacity(self):
        """
        Member capacity. Precedence: custom_capacity > snapshot > live package.
        """
        if self.custom_capacity:
            return self.custom_capacity
        if self.locked_capacity is not None:
            return self.locked_capacity
        return self.package.member_limit

    def get_total_price(self):
        """
        Calculate total price for this subscription.
        CRITICAL: duration_months is NOT multiplied here.
        duration_months ONLY controls the subscription end_date.

        Formula:
        - YEARLY: rate_per_member_yearly × capacity
        - MONTHLY: rate_per_member_monthly × capacity

        Example:
        - rate = 1800, capacity = 25
        - total = 1800 × 25 = 45,000
        """
        capacity = self.get_capacity()
        rate = self.get_rate()
        return rate * capacity

    # 🔥 These two were near-duplicates that read the live package directly,
    # bypassing the snapshot entirely (get_member_limit is used by to_dict).
    # They now just delegate to the canonical methods above.
    def get_amount_per_member(self):
        """Alias for get_rate()"""
        return self.get_rate()

    def get_member_limit(self):
        """Alias for get_capacity()"""
        return self.get_capacity()

    # ============ UPGRADE METHODS ============

    def calculate_upgrade_cost(self, new_package, new_billing_cycle):
        """
        Calculate upgrade cost with pro-rata credit.

        The NEW package is priced at its current live rate (it's a new
        purchase). The credit is derived from get_total_price(), which uses
        the OLD snapshot — so the church is credited what they actually paid.

        Args:
            new_package: The package to upgrade to
            new_billing_cycle: 'MONTHLY' or 'YEARLY'

        Returns:
            dict: Contains new_price, credit_amount, final_amount, etc.
        """
        capacity = self.get_capacity()

        if new_billing_cycle == 'MONTHLY':
            rate = new_package.rate_per_member_monthly
        else:
            rate = new_package.rate_per_member_yearly

        new_price = rate * capacity

        # Calculate pro-rata credit
        total_days = self.get_total_days()
        remaining_days = self.get_remaining_days()

        if total_days > 0:
            remaining_percentage = remaining_days / total_days
            original_price = self.get_total_price()
            credit = original_price * Decimal(str(remaining_percentage))
        else:
            credit = Decimal('0')

        final_amount = max(Decimal('0'), new_price - credit)

        return {
            'new_price': round(new_price, 2),
            'credit_amount': round(credit, 2),
            'final_amount': round(final_amount, 2),
            'used_percentage': round(((total_days - remaining_days) / total_days) * 100, 2) if total_days > 0 else 0,
            'remaining_percentage': round((remaining_days / total_days) * 100, 2) if total_days > 0 else 0,
            'billing_cycle': new_billing_cycle,
            'capacity': capacity,
            'duration_months': self.duration_months
        }

    def is_upgradable(self):
        """Check if subscription can be upgraded"""
        return self.is_active and not self.is_expired()

    def get_upgrade_history(self):
        """Get full upgrade history for this subscription"""
        history = []
        current = self
        while current.previous_subscription:
            prev = current.previous_subscription
            history.append({
                'from_package': prev.locked_package_name or (prev.package.name if prev.package else "Unknown"),
                'to_package': current.locked_package_name or (current.package.name if current.package else "Unknown"),
                'upgrade_date': current.upgrade_date,
                'pro_rata_credit': float(current.pro_rata_credit) if current.pro_rata_credit else 0,
            })
            current = prev
        return history

    # ============ STATUS METHODS ============

    def get_status(self):
        """Get machine-readable status"""
        if self.is_expired():
            return 'EXPIRED'
        if self.is_active:
            return 'ACTIVE'
        if self.payment_status == 'PAID':
            return 'PAID'
        return 'INACTIVE'

    def get_status_display(self):
        """Get display-friendly status"""
        status_map = {
            'ACTIVE': 'Active',
            'EXPIRED': 'Expired',
            'PAID': 'Paid',
            'INACTIVE': 'Inactive',
            'UNPAID': 'Unpaid',
            'PENDING': 'Pending',
        }
        return status_map.get(self.get_status(), 'Unknown')

    def can_renew(self):
        """Check if subscription can be renewed"""
        return self.is_expired() or self.get_remaining_days() <= 30

    def needs_renewal(self):
        """Check if subscription needs renewal (expiring within 30 days)"""
        if not self.end_date:
            return False
        days_left = self.expires_in_days()
        return days_left is not None and days_left <= 30 and not self.is_expired()

    # ============ JSON SERIALIZATION ============

    def to_dict(self):
        """Convert subscription to dictionary for API responses"""
        return {
            'id': self.id,
            'church_id': self.church.id if self.church else None,
            'church_name': self.church.name if self.church else None,
            'church_code': self.church.code if self.church else None,
            'package_id': self.package.id if self.package else None,
            'package_name': self.package.name if self.package else None,
            # 🔥 What the package was called at purchase, in case it was renamed
            'purchased_package_name': self.locked_package_name or None,
            'package_code': self.package.code if self.package else None,
            'billing_cycle': self.billing_cycle,
            'duration_months': self.duration_months,
            'payment_status': self.payment_status,
            'is_active': self.is_active,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'total_price': float(self.get_total_price()),
            'rate_per_member': float(self.get_rate()),
            'member_limit': self.get_member_limit(),
            'progress_percentage': self.get_progress_percentage(),
            'remaining_days': self.get_remaining_days(),
            'is_expired': self.is_expired(),
            'status': self.get_status_display(),
            'pricing_origin': self.pricing_origin,
            'upgrade_date': self.upgrade_date.isoformat() if self.upgrade_date else None,
            'pro_rata_credit': float(self.pro_rata_credit) if self.pro_rata_credit else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("church", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.church.name})"



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
        choices=(("MALE", "Male"), ("FEMALE", "Female"))
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
    spouse_name = models.CharField(max_length=150, blank=True)

    dob = models.DateField(null=True, blank=True)
    age = models.PositiveIntegerField(editable=False, null=True, blank=True)

    mobile_no = models.CharField(max_length=15,blank=True)
    phone_no = models.CharField(max_length=15, blank=True)

    blood_group = models.CharField(max_length=5, blank=True)
    expired = models.BooleanField(default=False)

    father_name = models.CharField(max_length=150, blank=True)
    mother_name = models.CharField(max_length=150, blank=True)

    date_of_baptism = models.DateField(null=True, blank=True)
    parish_of_baptism = models.CharField(max_length=150, blank=True)

    educational_qualification = models.CharField(max_length=150, blank=True)
    sunday_school_qualification = models.CharField(max_length=150, blank=True)

    profession = models.CharField(max_length=150, blank=True)

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

    joining_date = models.DateField(null=True, blank=True)
    transferred_from = models.CharField(max_length=150, blank=True)
    address = models.TextField(blank=True)
    is_family_head = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    inactive_reason = models.CharField(
        max_length=100,
        blank=True
        )
    inactive_date = models.DateField(
        null=True,
        blank=True
    )

    def save(self, *args, **kwargs):

        was_head = None
        if self.pk:
            was_head = Member.objects.filter(
                pk=self.pk
            ).values_list("is_family_head", flat=True).first()

    # 🔥 Enforce single active head per (family + house_name + house_sequence)
        if self.is_family_head:
            Member.objects.filter(
            family=self.family,
            house_name=self.house_name,
            house_sequence=self.house_sequence,
            is_family_head=True,
            is_active=True
        ).exclude(pk=self.pk).update(is_family_head=False)

    # 🔢 Age calculation
        if self.dob:
            today = date.today()
            self.age = today.year - self.dob.year - (
                (today.month, today.day) < (self.dob.month, self.dob.day)
        )

        super().save(*args, **kwargs)

    # 👤 Auto create login for new head
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

    god_father = models.CharField(max_length=150)
    god_mother = models.CharField(max_length=150)

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
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("COMPLETED", "Completed"),
    )
    
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
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )
    
    died_on = models.DateField(null=True, blank=True)
    funeral_on = models.DateField(null=True, blank=True)
    
    tomb_type = models.ForeignKey(
        TombType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    tomb_charge = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True
    )
    
    tomb_idn = models.CharField(max_length=100, blank=True)
    reason_of_death = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("church", "reg_no")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.member.name} - {self.status} ({self.reg_no or 'No Reg No'})"

    def save(self, *args, **kwargs):
        """
        Override save to handle date conversions and register number generation
        """
        # 🔥 FIX 1: Ensure dates are proper date objects before saving
        self._clean_dates()
        
        # 🔥 FIX 2: Generate register number if status is COMPLETED
        if self.status == "COMPLETED" and not self.reg_no:
            self._generate_register_number()
        
        # Call the parent save method
        super().save(*args, **kwargs)

    def _clean_dates(self):
        """
        Convert string dates to proper date objects
        """
        from django.utils.dateparse import parse_date
        
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
            import traceback
            logger.error(traceback.format_exc())
            
            # 🔥 FALLBACK: Generate a temporary number
            import time
            timestamp = int(time.time())
            self.reg_no = f"TEMP-DEATH-{timestamp}"
            logger.warning(f"Using temporary register number: {self.reg_no}")

    def is_completed(self):
        """Check if death record is completed"""
        return self.status == "COMPLETED"
    
    def is_pending(self):
        """Check if death record is pending"""
        return self.status == "PENDING"
    
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
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    narration = models.TextField(blank=True)

    is_cancelled = models.BooleanField(default=False)
    cancel_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

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
    visitor_address = models.CharField(max_length=300, blank=True, null=True)
    remarks = models.CharField(max_length=300, blank=True, null=True)

    def __str__(self):
        return f"{self.visitor_name} ({self.visitor_date})"
    

class Subscription(models.Model):
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

    is_cancelled = models.BooleanField(default=False)
    cancel_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

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

    def __str__(self):
        return self.group_name
    
class AccountLedgerMaster(models.Model):
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

    status = models.BooleanField(default=True)
    reserved = models.BooleanField(default=False)

    op_balance = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.ledger_name
    
class PaymentMaster(models.Model):
    PAYMENT_MODE_CHOICES = (
        ("CASH", "Cash"),
        ("UPI", "UPI"),
        ("CARD", "Card"),
        ("CHEQUE", "Cheque"),
    )

    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    voucher_number = models.IntegerField()
    ref_no = models.IntegerField(null=True, blank=True)
    payment_date = models.DateField()
    party_name = models.CharField(max_length=100)

    payment_mode = models.CharField(
        max_length=10,
        choices=PAYMENT_MODE_CHOICES
    )

    account_ledger = models.ForeignKey(
        AccountLedgerMaster,
        on_delete=models.PROTECT,
        related_name="payments"
    )

    amount = models.FloatField()
    narration = models.CharField(max_length=300, null=True, blank=True)

    is_cancelled = models.BooleanField(default=False)

    def __str__(self):
        return f"Voucher #{self.voucher_number} - {self.party_name} ({self.amount})"
    
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

    committee_code = models.IntegerField()
    committee_name = models.CharField(max_length=50)
    committee_from_date = models.DateField()
    committee_to_date = models.DateField()

    created_at = models.DateTimeField(null=True, blank=True, auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True, auto_now=True)

    def __str__(self):
        return self.committee_name


class CommitteeMember(models.Model):
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name="committee_memberships"
    )
    designation = models.ForeignKey(
        Designation,
        on_delete=models.PROTECT,
        related_name="committee_members"
    )
    committee = models.ForeignKey(
        CommitteeMaster,
        on_delete=models.CASCADE,
        related_name="members"
    )
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="committee_members"
    )
    
    created_at = models.DateTimeField(null=True, blank=True, auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True, auto_now=True)

    def __str__(self):
        return f"{self.member.name} - {self.designation.designation_name} ({self.committee.committee_name})"