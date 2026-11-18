from datetime import date
from django.db.models import Sum
from registry.models import AccountLedgerMaster, LedgerEntry

start_date = date(2026, 11, 1)
end_date = date(2026, 11, 17)

for code in ["1000", "1100", "1200", "1300"]:
    print("\n" + "=" * 75)

    ledgers = AccountLedgerMaster.objects.filter(
        church_id=6,
        ledger_code=code,
    )

    for ledger in ledgers:
        print("LEDGER:", ledger.id, ledger.ledger_code, ledger.ledger_name)

        entries = LedgerEntry.objects.filter(
            ledger=ledger,
            is_cancelled=False,
            is_reversal=False,
        )

        before = entries.filter(
            entry_date__lt=start_date
        ).aggregate(
            debit=Sum("amount", filter=__import__("django.db.models", fromlist=["Q"]).Q(entry_type="DEBIT")),
            credit=Sum("amount", filter=__import__("django.db.models", fromlist=["Q"]).Q(entry_type="CREDIT")),
        )

        period = entries.filter(
            entry_date__range=(start_date, end_date)
        )

        print("Opening entries:", before)
        print("Period entries:")

        for e in period.order_by("entry_date", "id"):
            print(
                e.entry_date,
                e.entry_type,
                e.amount,
                "Receipt:", e.receipt_id,
                "Payment:", e.payment_id,
                "Contra:", e.contra_id,
                e.narration,
            )
