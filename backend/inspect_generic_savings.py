from datetime import date
from django.db.models import Sum, Q
from registry.models import AccountLedgerMaster, LedgerEntry

start_date = date(2026, 11, 1)
end_date = date(2026, 11, 17)

ledgers = AccountLedgerMaster.objects.filter(
    church_id=6,
    ledger_code="1000",
)

for ledger in ledgers:
    print("\n" + "=" * 75)
    print("LEDGER:", ledger.id, ledger.ledger_code, ledger.ledger_name)
    print("NATURE:", ledger.ledger_nature, "OPENING:", ledger.op_balance)

    qs = LedgerEntry.objects.filter(
        ledger=ledger,
        is_cancelled=False,
        is_reversal=False,
    )

    for label, entries in [
        ("BEFORE REPORT", qs.filter(entry_date__lt=start_date)),
        ("DURING REPORT", qs.filter(entry_date__range=(start_date, end_date))),
        ("UP TO REPORT END", qs.filter(entry_date__lte=end_date)),
    ]:
        totals = entries.aggregate(
            debit=Sum("amount", filter=Q(entry_type="DEBIT")),
            credit=Sum("amount", filter=Q(entry_type="CREDIT")),
        )
        print(label, totals)

    print("\nPERIOD TRANSACTIONS:")
    for e in qs.filter(
        entry_date__range=(start_date, end_date)
    ).order_by("entry_date", "id"):
        print(
            e.entry_date, e.entry_type, e.amount,
            "Receipt:", e.receipt_id,
            "Payment:", e.payment_id,
            "Contra:", e.contra_id,
            "Narration:", e.narration,
        )
