
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "parish_management.settings")
django.setup()

from registry.models import AccountLedgerMaster
from registry.statutory_schedule import INCOME_SCHEDULE, EXPENDITURE_SCHEDULE

church_id = 6

ledgers = list(AccountLedgerMaster.objects.filter(church_id=church_id))

print("\n========== CHURCH LEDGERS ==========")
print("Total ledgers:", len(ledgers))

for schedule_name, schedule, expected_nature in [
    ("INCOME", INCOME_SCHEDULE, "INCOME"),
    ("EXPENDITURE", EXPENDITURE_SCHEDULE, "EXPENSE"),
]:
    print("\n==========", schedule_name, "AUDIT ==========")

    for row in schedule:
        letter, code, name, depth, row_type, key = row

        if row_type != "ledger":
            continue

        try:
            expected_code = int(code)
        except (ValueError, TypeError):
            continue

        possible_codes = [expected_code]

        if len(str(abs(expected_code))) == 4:
            possible_codes.append(expected_code * 100)

        matches = []

        for ledger in ledgers:
            try:
                actual_code = int(ledger.ledger_code)
            except (ValueError, TypeError):
                continue

            if actual_code in possible_codes:
                matches.append(ledger)

        print("\n", code, name)

        if not matches:
            print("  MISSING")
            continue

        for ledger in matches:
            print(
                "  ID:", ledger.id,
                "| Name:", ledger.ledger_name,
                "| Code:", ledger.ledger_code,
                "| Nature:", ledger.ledger_nature,
                "| Group:", ledger.account_group
            )

            if ledger.ledger_nature != expected_nature:
                print("  WARNING: WRONG NATURE")

        if len(matches) > 1:
            print("  WARNING: MULTIPLE MATCHES")

print("\n========== AUDIT FINISHED ==========")
