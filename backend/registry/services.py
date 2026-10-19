from datetime import date
from decimal import Decimal
from .models import Member, Package
from django.db import transaction
from django.db.models import Q

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
    if billing_cycle == MONTHLY:
        rate = (
            package.upgrade_rate_monthly
            if upgrade else
            package.rate_per_member_monthly
        )
    else:
        rate = (
            package.upgrade_rate_yearly
            if upgrade else
            package.rate_per_member_yearly
        )

    if rate is None:
        return None

    return Decimal(rate)


def get_capacity(subscription_or_package, custom_capacity=None) -> Decimal:
    """
    Resolves member capacity safely
    """
    if hasattr(subscription_or_package, "is_custom"):
        # Package
        if subscription_or_package.is_custom:
            if not custom_capacity:
                raise ValueError("custom_capacity required for custom package")
            return Decimal(custom_capacity)
        return Decimal(subscription_or_package.member_limit)

    # Subscription
    if subscription_or_package.package.is_custom:
        return Decimal(subscription_or_package.custom_capacity)

    return Decimal(subscription_or_package.package.member_limit)


# =====================================================
# NEW / RENEW BILL
# =====================================================

def calculate_new_bill_amount(package, billing_cycle, capacity) -> Decimal:
    """
    Used for NEW or RENEW bills only
    """
    if package.is_trial:
        return Decimal("0.00")

    months = get_cycle_months(billing_cycle)
    rate = get_rate(package, billing_cycle)

    return rate * capacity * Decimal(months)


# =====================================================
# PRORATED UPGRADE
# =====================================================

def calculate_prorated_upgrade_amount(
    subscription,
    target_package,
    target_billing_cycle,
    target_capacity=None,
):
    """
    SaaS upgrade calculation (MONTH-BASED)

    FINAL RULES (LOCKED):
    - Month-based proration only
    - Any started calendar month counts as consumed
    - OLD plan value:
        • BASE rate if pricing_origin == BASE
        • UPGRADE rate if pricing_origin == UPGRADE
    - NEW plan value: TARGET package upgrade rate
    """

    ZERO = Decimal("0.00")

    # -------------------------------------------------
    # BLOCK INVALID STATES
    # -------------------------------------------------
    if not subscription or subscription.package.is_trial:
        return {"amount": ZERO, "credit": ZERO, "breakdown": None}

    if not subscription.start_date:
        return {"amount": ZERO, "credit": ZERO, "breakdown": None}

    today = date.today()

    # -------------------------------------------------
    # TOTAL MONTHS IN CURRENT PLAN
    # -------------------------------------------------
    total_months = get_cycle_months(subscription.billing_cycle)

    # -------------------------------------------------
    # MONTHS USED (CALENDAR-BASED)
    # -------------------------------------------------
    start = subscription.start_date
    months_used = (
        (today.year - start.year) * 12
        + (today.month - start.month)
        + 1
    )
    months_used = max(min(months_used, total_months), 1)

    remaining_months = max(total_months - months_used, 0)

    # -------------------------------------------------
    # OLD PLAN RATE (DEPENDS ON PRICING ORIGIN)
    # -------------------------------------------------
    if subscription.pricing_origin == "BASE":
        old_rate = get_rate(
            subscription.package,
            subscription.billing_cycle,
            upgrade=False,
        )
    else:
        old_rate = get_rate(
            subscription.package,
            subscription.billing_cycle,
            upgrade=True,
        )

    if old_rate is None:
        raise ValueError(
            f"Rate not configured for current package {subscription.package}"
        )

    old_capacity = get_capacity(subscription)

    old_remaining_value = (
        old_rate * old_capacity * Decimal(remaining_months)
    ).quantize(Decimal("0.01"))

    # -------------------------------------------------
    # TARGET UPGRADE RATE (MANDATORY)
    # -------------------------------------------------
    upgrade_rate = get_rate(
        target_package,
        target_billing_cycle,
        upgrade=True,
    )

    if upgrade_rate is None:
        raise ValueError(
            f"Upgrade rate not configured for target package {target_package}"
        )

    new_capacity = get_capacity(target_package, target_capacity)

    # -----------------------------
    # MONTHLY TARGET
    # -----------------------------
    if target_billing_cycle == MONTHLY:
        monthly_amount = (
            upgrade_rate * new_capacity
        ).quantize(Decimal("0.01"))

        return {
            "amount": monthly_amount,
            "credit": old_remaining_value,
            "breakdown": {
                "type": "UPGRADE",
                "mode": "MONTH_BASED",
                "months_used": months_used,
                "members": int(new_capacity),
                "remaining_months": remaining_months,
                "old_rate": float(old_rate),
                "upgrade_rate": float(upgrade_rate),
                "old_remaining_value": float(old_remaining_value),
                "monthly_amount": float(monthly_amount),
                "explanation": (
                    f"₹{upgrade_rate} × {new_capacity} members for 1 month"
                ),
            },
        }

    # -----------------------------
    # YEARLY TARGET
    # -----------------------------
    new_remaining_value = (
        upgrade_rate * new_capacity * Decimal(remaining_months)
    ).quantize(Decimal("0.01"))

    amount_to_pay = (new_remaining_value - old_remaining_value).quantize(
        Decimal("0.01")
    )
    amount_to_pay = max(amount_to_pay, ZERO)

    return {
        "amount": amount_to_pay,
        "credit": ZERO,
        "breakdown": {
            "type": "UPGRADE",
            "mode": "MONTH_BASED",
            "months_used": months_used,
            "members": int(new_capacity),
            "remaining_months": remaining_months,
            "old_rate": float(old_rate),
            "upgrade_rate": float(upgrade_rate),
            "old_remaining_value": float(old_remaining_value),
            "new_remaining_value": float(new_remaining_value),
            "upgrade_amount": float(amount_to_pay),
            "explanation": (
                f"(₹{upgrade_rate} × {new_capacity} × {remaining_months}) "
                f"− (₹{old_rate} × {old_capacity} × {remaining_months})"
            ),
        },
    }


def calculate_package_pricing(package, billing_cycle):
    """
    Used ONLY for display (church_detail page).
    Not used for billing.
    """

    if not package or package.is_trial:
        return None

    months = get_cycle_months(billing_cycle)

    rate = get_rate(
        package,
        billing_cycle,
        upgrade=False
    )

    capacity = (
        package.member_limit
        if not package.is_custom
        else None
    )

    monthly_amount = rate * (capacity or 1)

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
    subscription = getattr(church, "churchsubscription", None)

    if not subscription or not subscription.is_active:
        return None

    package = subscription.package

    members = church.members.filter(
        is_family_head=True,
        is_active=True,
        expired=False,
    ).count()

    if package.is_trial:
        if members >= package.trial_member_limit:
            return {
                "type": "TRIAL_EXPIRED",
                "message": "Trial limit reached.",
            }
        return None

    if package.is_custom:
        return None

    if members <= package.member_limit:
        return None

    next_package = (
        Package.objects
        .filter(
            is_trial=False,
            is_custom=False,
            member_limit__gt=package.member_limit
        )
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
#
# ✅ FIXES APPLIED
#
# 1. Padding fallbacks (`or 4`) — prevents TypeError when
#    RegisterSetting was created with padding=None.
#
# 2. Prefix / suffix defaulted to "" (never None) so the
#    generated number never contains the literal string "None".
#
# 3. select_for_update() is used, and the get_or_create
#    fallback seeds a sensible default setting so a fresh
#    church never produces a bare "0001" with no prefix.
#
# 4. Both functions are wrapped in transaction.atomic() so
#    the counter bump commits together with whatever the
#    caller inserts afterwards — PROVIDED the caller also
#    wraps its own create() in transaction.atomic() (this
#    is enforced in the views).
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


def generate_register_number(church, register_type):
    from .models import RegisterSetting

    defaults = DEFAULT_REGISTER_FORMATS.get(
        register_type,
        {"prefix": "", "padding": 4},
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

        number = setting.next_register_number or 1
        prefix = setting.register_prefix or ""
        suffix = setting.register_suffix or ""
        padding = setting.register_padding or 4

        padded_number = str(number).zfill(padding)
        reg_no = f"{prefix}{padded_number}{suffix}"

        setting.next_register_number = number + 1
        setting.save(update_fields=["next_register_number"])

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

        number = setting.next_folio_number or 1
        prefix = setting.folio_prefix or ""
        suffix = setting.folio_suffix or ""
        padding = setting.folio_padding or 4

        padded_number = str(number).zfill(padding)
        folio_no = f"{prefix}{padded_number}{suffix}"

        setting.next_folio_number = number + 1
        setting.save(update_fields=["next_folio_number"])

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