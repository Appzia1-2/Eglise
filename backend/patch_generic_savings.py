from pathlib import Path
import shutil

path = Path("registry/views.py")
source = path.read_text(encoding="utf-8")

old = '''                cur = bank_group_sum_cur
                prev = bank_group_sum_prev
'''

new = '''                # Include standalone Savings Account ledgers that
                # are not linked to a BankAccount record.
                # These are asset balances, not additional receipts.
                if b_type == "1000":
                    linked_bank_ledger_ids = [
                        bank.ledger_id
                        for bank in active_banks
                        if bank.ledger_id
                    ]

                    other_savings_ledgers = (
                        AccountLedgerMaster.objects
                        .filter(
                            church=church,
                            ledger_code="1000",
                            ledger_nature="ASSET",
                        )
                        .exclude(
                            id__in=linked_bank_ledger_ids
                        )
                    )

                    for savings_ledger in other_savings_ledgers:
                        if is_closing:
                            savings_cur = self._running_balance(
                                church,
                                savings_ledger,
                                date_to,
                                inclusive=True,
                            )
                            savings_prev = (
                                self._running_balance(
                                    church,
                                    savings_ledger,
                                    prev_to,
                                    inclusive=True,
                                )
                                if prev_to else 0.0
                            )
                        else:
                            savings_cur = (
                                self._running_balance(
                                    church,
                                    savings_ledger,
                                    date_from,
                                    inclusive=False,
                                )
                                if date_from else 0.0
                            )
                            savings_prev = (
                                self._running_balance(
                                    church,
                                    savings_ledger,
                                    prev_from,
                                    inclusive=False,
                                )
                                if prev_from else 0.0
                            )

                        bank_group_sum_cur += savings_cur
                        bank_group_sum_prev += savings_prev

                        rows.append({
                            "section": "",
                            "code": "",
                            "name": savings_ledger.ledger_name,
                            "depth": depth + 1,
                            "row_type": "ledger_child",
                            "current_year": round(savings_cur, 2),
                            "previous_year": round(savings_prev, 2),
                        })

                cur = bank_group_sum_cur
                prev = bank_group_sum_prev
'''

count = source.count(old)
if count != 1:
    raise RuntimeError(
        f"Expected exactly 1 matching block, found {count}. "
        "No changes written."
    )

backup = Path("registry/views.py.before_generic_savings_fix.bak")
if not backup.exists():
    shutil.copy2(path, backup)

source = source.replace(old, new, 1)
path.write_text(source, encoding="utf-8")

print("PATCH APPLIED SUCCESSFULLY")
print("Backup:", backup)
