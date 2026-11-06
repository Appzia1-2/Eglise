"""
One-shot ledger audit.
Run: python audit_ledger.py
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "parish_management.settings")
django.setup()

from django.db.models import Sum, Q, Count
from registry.models import (
    Church, LedgerEntry, PaymentMaster, ContraMaster, ReceiptMaster,
)

print("=" * 70)
print("1. TRIAL BALANCE (all churches combined)")
print("=" * 70)
agg = LedgerEntry.objects.filter(
    is_cancelled=False, is_reversal=False,
).aggregate(
    d=Sum("amount", filter=Q(entry_type="DEBIT")),
    c=Sum("amount", filter=Q(entry_type="CREDIT")),
)
d, c = float(agg["d"] or 0), float(agg["c"] or 0)
print(f"  Dr: Rs.{d:,.2f}")
print(f"  Cr: Rs.{c:,.2f}")
print(f"  Diff: Rs.{d - c:,.2f}")
print()

print("=" * 70)
print("2. TRIAL BALANCE (per church)")
print("=" * 70)
for church in Church.objects.filter(is_deleted=False).order_by("name"):
    a = LedgerEntry.objects.filter(
        church=church, is_cancelled=False, is_reversal=False,
    ).aggregate(
        d=Sum("amount", filter=Q(entry_type="DEBIT")),
        c=Sum("amount", filter=Q(entry_type="CREDIT")),
    )
    dc, cc = float(a["d"] or 0), float(a["c"] or 0)
    flag = "OK " if abs(dc - cc) < 0.01 else "BAD"
    print(f"  [{flag}] {church.name}: Dr Rs.{dc:,.2f} | Cr Rs.{cc:,.2f} | Diff Rs.{dc - cc:,.2f}")
print()

print("=" * 70)
print("3. PAYMENTS with != 2 live entries (corruption)")
print("=" * 70)
bad_pay = (
    PaymentMaster.objects
    .filter(is_cancelled=False)
    .annotate(n=Count("ledger_entries", filter=Q(
        ledger_entries__is_cancelled=False,
        ledger_entries__is_reversal=False)))
    .exclude(n=2)
)
print(f"  Count: {bad_pay.count()}")
for p in bad_pay:
    print(f"  BAD {p.voucher_number} | Rs.{p.amount} | entries={p.n} | church={p.church.name}")
if bad_pay.count() == 0:
    print("  clean")
print()

print("=" * 70)
print("4. CONTRAS with != 2 live entries (corruption)")
print("=" * 70)
bad_con = (
    ContraMaster.objects
    .filter(is_cancelled=False)
    .annotate(n=Count("ledger_entries", filter=Q(
        ledger_entries__is_cancelled=False,
        ledger_entries__is_reversal=False)))
    .exclude(n=2)
)
print(f"  Count: {bad_con.count()}")
for x in bad_con:
    print(f"  BAD {x.voucher_number} | Rs.{x.amount} | entries={x.n} | church={x.church.name}")
if bad_con.count() == 0:
    print("  clean")
print()

print("=" * 70)
print("5. RECEIPTS where credits != debits (corruption)")
print("=" * 70)
bad_receipts = []
for r in ReceiptMaster.objects.filter(is_cancelled=False).prefetch_related("ledger_entries"):
    live = [e for e in r.ledger_entries.all() if not e.is_cancelled and not e.is_reversal]
    credits = sum(float(e.amount) for e in live if e.entry_type == "CREDIT")
    debits  = sum(float(e.amount) for e in live if e.entry_type == "DEBIT")
    if abs(credits - debits) > 0.01:
        bad_receipts.append((r, credits, debits, len(live)))
print(f"  Count: {len(bad_receipts)}")
for r, cr, db, n in bad_receipts:
    print(f"  BAD {r.receipt_number} | credits Rs.{cr:,.2f} | debits Rs.{db:,.2f} | diff Rs.{cr - db:,.2f} | entries={n} | church={r.church.name}")
if not bad_receipts:
    print("  clean")
print()

print("=" * 70)
print("6. ORPHAN cancelled entries (cancelled but no reversal)")
print("=" * 70)
orphans = LedgerEntry.objects.filter(
    is_cancelled=True,
    is_reversal=False,
    reversed_entry__isnull=True,
)
print(f"  Count: {orphans.count()}")
for e in orphans:
    if e.payment_id:
        src = f"PAY {e.payment.voucher_number}"
    elif e.receipt_id:
        src = f"RCP {e.receipt.receipt_number}"
    elif e.contra_id:
        src = f"CON {e.contra.voucher_number}"
    else:
        src = "unknown"
    print(f"  BAD entry {e.id} | {e.entry_type} Rs.{e.amount} | {e.ledger.ledger_name} | {src} | church={e.church.name}")
if orphans.count() == 0:
    print("  clean")
print()

print("=" * 70)
print("DONE")
print("=" * 70)