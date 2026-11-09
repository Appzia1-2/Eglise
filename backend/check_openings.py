from registry.models import BankAccount, LedgerEntry

for b in BankAccount.objects.filter(ledger__isnull=True):
    print(f"\n--- acct #{b.id} {b.bank_name} opening={b.opening_balance}")
    qs = LedgerEntry.objects.filter(
        church=b.church, narration__icontains=f"Opening Balance for {b.bank_name}"
    ).select_related("ledger")
    if not qs:
        print("   no opening entries found -> never posted")
    for e in qs:
        print(f"   entry {e.id} | {e.entry_type} {e.amount} | ledger: {e.ledger.ledger_name} "
              f"| cancelled={e.is_cancelled} | date={e.entry_date}")