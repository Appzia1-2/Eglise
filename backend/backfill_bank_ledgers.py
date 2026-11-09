from registry.models import BankAccount, AccountGroupMaster, AccountLedgerMaster, LedgerEntry

DRY_RUN = True   # set to False after reviewing the output

for b in BankAccount.objects.filter(ledger__isnull=True).select_related("church"):
    church = b.church
    group = AccountGroupMaster.objects.filter(
        church=church, group_name="I. Opening Balances"
    ).first()
    tagged = LedgerEntry.objects.filter(bank_account=b).count()
    print(f"{church.name} | acct #{b.id} {b.display_name} | opening={b.opening_balance} "
          f"| group={'OK' if group else 'MISSING'} | entries already tagged to it: {tagged}")
    if DRY_RUN or not group:
        continue
    b.ledger = AccountLedgerMaster.objects.create(
        church=church,
        ledger_name=f"Bank - {b.bank_name} {b.masked_account_number}",
        account_group=group,
        ledger_nature="ASSET",
        status=True,
        reserved=False,
        ledger_code=None,
    )
    b.save(update_fields=["ledger"])
    print("   -> ledger created")