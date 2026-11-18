from registry.models import BankAccount, LedgerEntry
from django.db.models import Sum, Q

banks = BankAccount.objects.select_related("church", "ledger").filter(
    church__name="St Marys"
)

for bank in banks:
    print("\n" + "=" * 60)
    print("BANK:", bank.bank_name, bank.masked_account_number)

    if not bank.ledger:
        print("NO LINKED LEDGER")
        continue

    qs = LedgerEntry.objects.filter(
        church=bank.church,
        ledger=bank.ledger,
        is_cancelled=False,
        is_reversal=False,
    ).exclude(narration__istartswith="Opening Balance")

    totals = qs.aggregate(
        debit=Sum("amount", filter=Q(entry_type="DEBIT")),
        credit=Sum("amount", filter=Q(entry_type="CREDIT")),
    )

    debit = totals["debit"] or 0
    credit = totals["credit"] or 0

    print("Opening:", bank.opening_balance)
    print("Debit:", debit)
    print("Credit:", credit)
    print("Closing:", bank.opening_balance + debit - credit)
