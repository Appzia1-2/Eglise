# backend/registry/services.py

from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Q

from .models import Member, Package


# =====================================================
# CONSTANTS
# =====================================================

MONTHLY = "MONTHLY"
YEARLY = "YEARLY"


# =====================================================
# HELPERS
# =====================================================

def get_cycle_months(billing_cycle: str) -> int:
    """
    MONTHLY  → 1 month
    YEARLY   → 12 months
    """
    return 1 if billing_cycle == MONTHLY else 12


def get_rate(package, billing_cycle, *, upgrade=False):
    """Rate per member for the given billing cycle. `upgrade` is ignored."""
    if billing_cycle == MONTHLY:
        return Decimal(package.rate_per_member_monthly)
    return Decimal(package.rate_per_member_yearly)


def get_capacity(obj, custom_capacity=None):
    """
    Resolve member capacity. Works for both Package and ChurchSubscription.
    """
    from .models import Package, ChurchSubscription

    if isinstance(obj, Package):
        if custom_capacity:
            return Decimal(custom_capacity)
        return Decimal(obj.member_limit or 0)

    if isinstance(obj, ChurchSubscription):
        if obj.custom_capacity:
            return Decimal(obj.custom_capacity)
        if obj.locked_capacity is not None:
            return Decimal(obj.locked_capacity)
        return Decimal(obj.package.member_limit or 0)

    raise TypeError(f"get_capacity: unsupported type {type(obj)}")


# =====================================================
# NEW / RENEW BILL
# =====================================================

def calculate_new_bill_amount(package, billing_cycle, capacity):
    """Used for NEW or RENEW bills only."""
    months = get_cycle_months(billing_cycle)
    rate = get_rate(package, billing_cycle)
    return rate * Decimal(capacity) * Decimal(months)


# =====================================================
# PRORATED UPGRADE
# =====================================================

def calculate_prorated_upgrade_amount(
    subscription, target_package, target_billing_cycle, target_capacity=None,
):
    ZERO = Decimal("0.00")
    if not subscription or not subscription.start_date:
        return {"amount": ZERO, "credit": ZERO, "breakdown": None}

    today = date.today()
    total_months = subscription.duration_months or get_cycle_months(subscription.billing_cycle)
    start = subscription.start_date

    # months fully elapsed (no off-by-one)
    months_used = (
        (today.year - start.year) * 12
        + (today.month - start.month)
    )
    months_used = max(min(months_used, total_months), 0)
    remaining_months = max(total_months - months_used, 0)

    # OLD plan uses the SNAPSHOT rate, not the live package
    old_rate = Decimal(subscription.get_rate())  # respects locked_rate
    old_monthly_rate = old_rate if subscription.billing_cycle == MONTHLY else old_rate / Decimal(12)
    old_capacity = Decimal(subscription.get_capacity())
    old_remaining_value = (old_monthly_rate * old_capacity * Decimal(remaining_months)).quantize(Decimal("0.01"))

    # NEW plan
    new_rate = get_rate(target_package, target_billing_cycle)
    new_monthly_rate = new_rate if target_billing_cycle == MONTHLY else new_rate / Decimal(12)
    new_capacity = get_capacity(target_package, target_capacity)
    new_remaining_value = (new_monthly_rate * new_capacity * Decimal(remaining_months)).quantize(Decimal("0.01"))

    amount_to_pay = max(ZERO, new_remaining_value - old_remaining_value)

    return {
        "amount": amount_to_pay,
        "credit": ZERO,
        "breakdown": {
            "type": "UPGRADE",
            "mode": "PRORATED_DIFFERENCE",
            "months_used": months_used,
            "remaining_months": remaining_months,
            "old_rate": float(old_rate),
            "old_monthly_rate": float(old_monthly_rate),
            "old_capacity": int(old_capacity),
            "old_remaining_value": float(old_remaining_value),
            "new_rate": float(new_rate),
            "new_monthly_rate": float(new_monthly_rate),
            "new_capacity": int(new_capacity),
            "new_remaining_value": float(new_remaining_value),
            "amount_to_pay": float(amount_to_pay),
        },
    }


def calculate_package_pricing(package, billing_cycle):
    """Display only — used by pricing preview endpoints."""
    months = get_cycle_months(billing_cycle)
    rate = get_rate(package, billing_cycle)
    capacity = package.member_limit or 1
    monthly_amount = rate * Decimal(capacity)
    return {
        "billing_cycle": billing_cycle,
        "months": months,
        "rate": float(rate),
        "capacity": capacity,
        "monthly": float(monthly_amount),
        "total": float(monthly_amount * Decimal(months)),
    }


# =====================================================
# SUBSCRIPTION CHECKS
# =====================================================

def can_add_member(church):
    """
    Check whether a new FAMILY HEAD can be added.

    Returns
    -------
    (allowed: bool, message: str | None, info: dict)
    """
    subscription = getattr(church, "subscription", None)

    if not subscription or not subscription.is_active:
        return (
            False,
            "No active subscription.",
            {"current": 0, "limit": 0, "remaining": 0},
        )

    if subscription.is_expired():
        return (
            False,
            "Subscription has expired. Please renew to add more members.",
            {"current": 0, "limit": 0, "remaining": 0},
        )

    package = subscription.package

    # --------------------------------------------------
    # Resolve limit — prefer snapshot, fall back to live package
    # --------------------------------------------------
    if subscription.custom_capacity:
        limit = subscription.custom_capacity
    elif subscription.locked_capacity is not None:
        limit = subscription.locked_capacity
    else:
        limit = package.member_limit or 0

    # --------------------------------------------------
    # Count only ACTIVE FAMILY HEADS
    # --------------------------------------------------
    current_count = church.members.filter(
        is_family_head=True,
        is_active=True,
        expired=False,
    ).count()

    remaining = max(0, limit - current_count)

    if current_count >= limit:
        return (
            False,
            f"Member limit reached ({current_count}/{limit}). "
            f"Please upgrade your package to add more family heads.",
            {"current": current_count, "limit": limit, "remaining": 0},
        )

    return (
        True,
        None,
        {"current": current_count, "limit": limit, "remaining": remaining},
    )


# =====================================================
# UPGRADE SUGGESTIONS
# =====================================================

def get_next_subscription_action(church):
    subscription = getattr(church, "subscription", None)

    if not subscription or not subscription.is_active:
        return None

    package = subscription.package

    members = church.members.filter(
        is_family_head=True,
        is_active=True,
        expired=False,
    ).count()

    if members <= package.member_limit:
        return None

    next_package = (
        Package.objects
        .filter(is_active=True, member_limit__gt=package.member_limit)
        .order_by("member_limit")
        .first()
    )

    if not next_package:
        return None

    return {
        "type": "UPGRADE_REQUIRED",
        "current_package": package,
        "current_members": members,
        "suggested_package": next_package,
    }


# =====================================================
# DEATH
# =====================================================

@transaction.atomic
def handle_member_death(member):
    if member.expired:
        return

    if member.is_family_head:
        member.is_family_head = False

        if hasattr(member, "user"):
            member.user.is_active = False
            member.user.save(update_fields=["is_active"])

    spouse = Member.objects.filter(
        Q(spouse=member) | Q(pk=member.spouse_id)
    ).first()

    member.expired = True
    member.is_active = False
    member.inactive_reason = "DECEASED"
    member.inactive_date = date.today()
    member.save()

    if spouse:
        spouse.marital_status = "WIDOWED"
        spouse.spouse = None
        spouse.save(update_fields=["marital_status", "spouse"])

        member.spouse = None
        member.save(update_fields=["spouse"])


# =====================================================
# REGISTER / FOLIO NUMBERING
# =====================================================

# Default prefix / padding per register type, used when
# get_or_create has to create a RegisterSetting from scratch.
DEFAULT_REGISTER_FORMATS = {
    "HEAD":        {"prefix": "FH-",  "padding": 4},
    "BAPTISM":     {"prefix": "BAP-", "padding": 4},
    "MARRIAGE":    {"prefix": "MAR-", "padding": 4},
    "DEATH":       {"prefix": "DEA-", "padding": 4},
    "CERTIFICATE": {"prefix": "CERT-", "padding": 4},
}


def _financial_year_label(setting, today=None):
    """
    Return the FY label for the given date using the setting's
    start_month / format. Empty string if FY is off.
    """
    if not setting.use_financial_year:
        return ""

    today = today or date.today()
    start_month = setting.financial_year_start_month or 4

    year = today.year if today.month >= start_month else today.year - 1
    end_year = year + 1

    fmt = setting.financial_year_format or "YYYY-YY"
    if fmt == "YYYY-YY":
        return f"{year}-{str(end_year)[-2:].zfill(2)}"
    if fmt == "YYYY-YYYY":
        return f"{year}-{end_year}"
    if fmt == "YYYY":
        return str(year)
    if fmt == "YY":
        return str(year)[-2:].zfill(2)
    return f"{year}-{str(end_year)[-2:].zfill(2)}"


def _maybe_rollover_fy(setting, today=None):
    """
    If FY is enabled and the current FY label differs from the label
    stored on the setting, reset both counters. Must be called inside
    a select_for_update() block so the reset is race-safe.
    """
    if not setting.use_financial_year:
        return

    new_label = _financial_year_label(setting, today)

    # First time with FY on — record the label, don't reset
    if not setting.current_financial_year_label:
        setting.current_financial_year_label = new_label
        return

    if setting.current_financial_year_label != new_label:
        setting.next_register_number = 1
        setting.next_folio_number = 1
        setting.current_financial_year_label = new_label


def _assemble(prefix, parish_code, fy, number, suffix,
              separator, include_zeros, padding):
    if include_zeros:
        padded = str(number).zfill(padding)
    else:
        padded = str(number)

    parts = [prefix or "", parish_code or "", fy or "", padded, suffix or ""]
    return separator.join([p for p in parts if p])


def generate_register_number(church, register_type):
    from .models import RegisterSetting

    defaults = DEFAULT_REGISTER_FORMATS.get(
        register_type, {"prefix": "", "padding": 4},
    )

    with transaction.atomic():
        setting, _created = (
            RegisterSetting.objects
            .select_for_update()
            .get_or_create(
                church=church,
                register_type=register_type,
                defaults={
                    "register_prefix": defaults["prefix"],
                    "register_padding": defaults["padding"],
                    "next_register_number": 1,
                },
            )
        )

        _maybe_rollover_fy(setting)

        number = setting.next_register_number or 1
        prefix = setting.register_prefix or ""
        suffix = setting.register_suffix or ""
        separator = setting.separator or ""
        padding = setting.register_padding or 4

        parish_code = (
            (church.code or "") if setting.include_parish_code else ""
        )
        fy = _financial_year_label(setting)

        reg_no = _assemble(
            prefix=prefix,
            parish_code=parish_code,
            fy=fy,
            number=number,
            suffix=suffix,
            separator=separator,
            include_zeros=setting.include_leading_zeros,
            padding=padding,
        )

        setting.next_register_number = number + 1
        setting.save(update_fields=[
            "next_register_number",
            "next_folio_number",              # persist FY rollover of folio counter
            "current_financial_year_label",
        ])

        return reg_no


def generate_folio_number(church):
    from .models import RegisterSetting

    with transaction.atomic():
        setting, _created = (
            RegisterSetting.objects
            .select_for_update()
            .get_or_create(
                church=church,
                register_type="HEAD",
                defaults={
                    "register_prefix": "FH-",
                    "register_padding": 4,
                    "folio_prefix": "FO-",
                    "folio_padding": 4,
                    "next_register_number": 1,
                    "next_folio_number": 1,
                },
            )
        )

        _maybe_rollover_fy(setting)

        number = setting.next_folio_number or 1
        prefix = setting.folio_prefix or ""
        suffix = setting.folio_suffix or ""
        separator = setting.separator or ""
        padding = setting.folio_padding or 4

        parish_code = (
            (church.code or "") if setting.include_parish_code else ""
        )
        fy = _financial_year_label(setting)

        folio_no = _assemble(
            prefix=prefix,
            parish_code=parish_code,
            fy=fy,
            number=number,
            suffix=suffix,
            separator=separator,
            include_zeros=setting.include_leading_zeros,
            padding=padding,
        )

        setting.next_folio_number = number + 1
        setting.save(update_fields=[
            "next_register_number",           # persist FY rollover of register counter
            "next_folio_number",
            "current_financial_year_label",
        ])

        return folio_no


def reseal_vicar_windows(church):
    from .models import Priest
    from datetime import timedelta

    mains = list(
        Priest.objects.filter(
            church=church,
            designation="MAIN",
            date_from__isnull=False,
        ).order_by("date_from", "id")
    )

    if not mains:
        return

    updates = []

    for i in range(len(mains) - 1):
        current = mains[i]
        next_vicar = mains[i + 1]

        if current.date_to is not None:
            continue

        desired_end = next_vicar.date_from - timedelta(days=1)

        if current.date_from and desired_end < current.date_from:
            desired_end = current.date_from

        current.date_to = desired_end
        current.is_active = False
        updates.append(current)

    if updates:
        Priest.objects.bulk_update(updates, ["date_to", "is_active"])