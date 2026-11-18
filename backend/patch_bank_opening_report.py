from pathlib import Path
import shutil

path = Path("registry/views.py")
source = path.read_text(encoding="utf-8")

backup = Path("registry/views.py.before_bank_opening_fix.bak")
shutil.copy2(path, backup)

def replace_once(old, new, label):
    global source
    count = source.count(old)
    if count != 1:
        raise RuntimeError(
            f"{label}: expected exactly 1 match, found {count}. "
            "No changes have been written."
        )
    source = source.replace(old, new, 1)


# 1. Add a helper to include bank opening entries posted
#    during the selected reporting period.
marker = '''    # =================================================
    # RECEIPT / PAYMENT LEDGER AMOUNTS
    # =================================================
'''

helper = '''    # =================================================
    # BANK OPENING BALANCE
    # =================================================
    def _bank_opening_balance(
        self,
        church,
        ledger,
        date_from,
        date_to,
    ):
        # Normal balance before the reporting period.
        balance = (
            self._running_balance(
                church,
                ledger,
                date_from,
                inclusive=False,
            )
            if date_from
            else 0.0
        )

        # Bank opening entries posted during the selected
        # period are treated as brought-forward balances.
        opening_entries = LedgerEntry.objects.filter(
            church=church,
            ledger=ledger,
            entry_type="DEBIT",
            is_cancelled=False,
            is_reversal=False,
            narration__startswith="Opening Balance for ",
        )

        if date_from:
            opening_entries = opening_entries.filter(
                entry_date__gte=date_from
            )

        if date_to:
            opening_entries = opening_entries.filter(
                entry_date__lte=date_to
            )

        opening_total = (
            opening_entries.aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        return balance + float(opening_total)


    # =================================================
    # RECEIPT / PAYMENT LEDGER AMOUNTS
    # =================================================
'''

replace_once(marker, helper, "Bank opening helper insertion")


# 2. Use the helper for the opening bank rows.
old_bank_opening = '''                    else:
                        # Opening balance before report start date.
                        b_cur = self._running_balance(
                            church,
                            bank.ledger,
                            date_from,
                            inclusive=False,
                        )

                        b_prev = (
                            self._running_balance(
                                church,
                                bank.ledger,
                                prev_from,
                                inclusive=False,
                            )
                            if prev_from
                            else 0.0
                        )
'''

new_bank_opening = '''                    else:
                        # Include opening entries posted during the
                        # reporting period as brought-forward balances.
                        b_cur = self._bank_opening_balance(
                            church,
                            bank.ledger,
                            date_from,
                            date_to,
                        )

                        b_prev = (
                            self._bank_opening_balance(
                                church,
                                bank.ledger,
                                prev_from,
                                prev_to,
                            )
                            if prev_from
                            else 0.0
                        )
'''

replace_once(
    old_bank_opening,
    new_bank_opening,
    "Opening bank row calculation",
)


# 3. Do not count the matching capital-ledger counterpart
#    as a current-period receipt.
old_amount_filter = '''        if date_to:
            qs = qs.filter(
                entry_date__lte=date_to
            )

        if side == "INCOME":
'''

new_amount_filter = '''        if date_to:
            qs = qs.filter(
                entry_date__lte=date_to
            )

        # Bank opening balances are shown in Opening Balances,
        # not again as current-period capital receipts.
        qs = qs.filter(
            Q(narration__isnull=True)
            | ~Q(narration__startswith="Opening Balance for ")
        )

        if side == "INCOME":
'''

replace_once(
    old_amount_filter,
    new_amount_filter,
    "Opening counterpart exclusion",
)


path.write_text(source, encoding="utf-8")
print("PATCH APPLIED SUCCESSFULLY")
print("Backup:", backup)
