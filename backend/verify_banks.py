from registry.models import BankAccount

for b in BankAccount.objects.all():
    print(b.id, b.display_name, "| ledger:", b.ledger,
          "| balance:", b.ledger.get_current_balance() if b.ledger else None)