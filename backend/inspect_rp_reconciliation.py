from datetime import date
from django.db.models import Sum, Q
from registry.models import AccountLedgerMaster, LedgerEntry, BankAccount

start_date = date(2026, 11, 1)
end_date = date(2026, 11, 17)

print("\n========== BANK ACCOUNTS ==========")
for b in BankAccount.objects.filter(church_id=6).select_related("ledger"):
    print(
        "BANK:", b.id,
        b.bank_name,
        "OPENING:", b.opening_balance,
        "LEDGER:", b.ledger_id,
        b.ledger.ledger_code if b.ledger else None,
        b.ledger.ledger_name if b.ledger else None,
    )

print("\n========== IMPORTANT LEDGERS ==========")
ledgers = AccountLedgerMaster.objects.filter(
    church_id=6,
    ledger_code__in=["1000", "1100", "1200", "1300", "5001"],
).order_by("ledger_code", "id")

for ledger in ledgers:
    print("\n------------------------------------")
    print(
        "LEDGER:", ledger.id,
        "CODE:", ledger.ledger_code,
        "NAME:", ledger.ledger_name,
        "NATURE:", ledger.ledger_nature,
        "OP BALANCE:", ledger.op_balance,
    )

    qs = LedgerEntry.objects.filter(
        church_id=6,
        ledger=ledger,
        is_cancelled=False,
        is_reversal=False,
    )

    for label, entries in [
        ("BEFORE REPORT", qs.filter(entry_date__lt=start_date)),
        ("DURING REPORT", qs.filter(entry_date__range=(start_date, end_date))),
        ("UP TO END", qs.filter(entry_date__lte=end_date)),
    ]:
        totals = entries.aggregate(
            debit=Sum("amount", filter=Q(entry_type="DEBIT")),
            credit=Sum("amount", filter=Q(entry_type="CREDIT")),
        )
        print(label, totals)

    print("TRANSACTIONS:")
    for e in qs.filter(
        entry_date__lte=end_date
    ).order_by("entry_date", "id"):
        print(
            e.entry_date,
            e.entry_type,
            e.amount,
            "Receipt:", e.receipt_id,
            "Payment:", e.payment_id,
            "Contra:", e.contra_id,
            "Narration:", e.narration,
        )
