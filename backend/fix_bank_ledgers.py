from django.db import transaction
from registry.models import (
    BankAccount, AccountGroupMaster, AccountLedgerMaster, LedgerEntry,
)

DRY_RUN = False   # set to False after reviewing

for b in BankAccount.objects.filter(ledger__isnull=True).select_related("church"):
    church = b.church
    group = AccountGroupMaster.objects.get(church=church, group_name="I. Opening Balances")
    narr = f"Opening Balance for {b.bank_name} ({b.masked_account_number})"
    entries = list(LedgerEntry.objects.filter(
        church=church, entry_type="DEBIT", narration=narr,
        ledger__ledger_name="Balance in Savings Account",
        is_cancelled=False, is_reversal=False,
    ))
    print(f"acct #{b.id} {b.display_name}: {len(entries)} opening entry(ies) to move "
          f"{[(e.id, str(e.amount)) for e in entries]}")
    if DRY_RUN:
        continue
    with transaction.atomic():
        led = AccountLedgerMaster.objects.create(
            church=church,
            ledger_name=f"Bank - {b.bank_name} {b.masked_account_number}",
            account_group=group, ledger_nature="ASSET",
            status=True, reserved=False, ledger_code=None,
        )
        b.ledger = led
        b.save(update_fields=["ledger"])
        for e in entries:
            e.ledger = led
            e.bank_account = b
            e.save(update_fields=["ledger", "bank_account"])
    print("   -> done")