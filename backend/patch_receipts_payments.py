from pathlib import Path
import re

schedule_path = Path("registry/statutory_schedule.py")
views_path = Path("registry/views.py")

schedule = schedule_path.read_text(encoding="utf-8")

def replace_once(old, new, description):
    global schedule
    count = schedule.count(old)
    if count != 1:
        raise RuntimeError(
            f"{description}: expected 1 match, found {count}. No files have been written."
        )
    schedule = schedule.replace(old, new, 1)

# 1. Qurbana is a direct ledger, not an empty group.
replace_once(
    '    ("2110", "Qurbana Receipts", 2, None, True),',
    '    ("2110", "Qurbana Receipts", 2, "Qurbana Income", False),',
    "Qurbana ledger"
)

# 2. Add the missing parent group for interest accounts.
replace_once(
    '    ("2401", "Bank SB Interest", 2, "Bank SB Interest", False),',
    '    ("2400", "C  Interest and Income from Investments", 1, None, True),\n'
    '    ("2401", "Bank SB Interest", 2, "Bank SB Interest", False),',
    "Interest parent group"
)

# 3. Correct Parish Hall nested subtotal depth.
replace_once(
    '    ("", "b) GST not Applicable Income", 4, "b) GST not Applicable Income", False),\n'
    '    ("", "Sub Total", 2, None, False),',
    '    ("", "b) GST not Applicable Income", 4, "b) GST not Applicable Income", False),\n'
    '    ("", "Sub Total", 3, None, False),',
    "Parish Hall subtotal"
)

# 4. Add Commercial Building rental subtotal.
replace_once(
    '    ("", "b) GST not Applicable Income", 3, "b) GST not Applicable Income", False),\n'
    '    ("", "Total of Income from Church Commercial Buildings", 1, "TOTAL_GROUP_2500", False),',
    '    ("", "b) GST not Applicable Income", 3, "b) GST not Applicable Income", False),\n'
    '    ("", "Sub Total", 2, None, False),\n'
    '    ("", "Total of Income from Church Commercial Buildings", 1, "TOTAL_GROUP_2500", False),',
    "Commercial Building subtotal"
)

# 5. Correct the payment subgroup subtotal depths and labels.
replace_once(
    '    ("", "Sub Total", 3, None, False),\n\n    ("", "To Diocession Office", 2, None, True),',
    '    ("", "Sub Total", 2, None, False),\n\n    ("", "To Diocesan Office", 2, None, True),',
    "Malankara and Diocesan subtotals"
)

replace_once(
    '    ("", "Sub Total", 3, None, False),\n\n    ("", "To Other Offices", 2, None, True),',
    '    ("", "Sub Total", 2, None, False),\n\n    ("", "To Other Offices", 2, None, True),',
    "Diocesan Office subtotal"
)

replace_once(
    '    ("4012", "Gerbo Sunday Collection", 3, "Gerbo Sunday Collection", False),',
    '    ("4012", "Garbo Sunday Collection", 3, "Gerbo Sunday Collection", False),',
    "Garbo Sunday display name"
)

replace_once(
    '    ("4013", "Other collections", 3, "Other collections", False),\n'
    '    ("", "Sub Total", 3, None, False),',
    '    ("4013", "Other collections", 3, "Other collections", False),\n'
    '    ("", "Sub Total", 2, None, False),',
    "Other Offices subtotal"
)

# 6. Add the missing Charity subtotals.
replace_once(
    '    ("4309", "Other Spiritual organisations", 3, "Other Spiritual organisations", False),\n\n'
    '    ("4310", "B2 Charity Expenses", 2, None, True),',
    '    ("4309", "Other Spiritual organisations", 3, "Other Spiritual organisations", False),\n'
    '    ("", "Sub Total", 2, None, False),\n\n'
    '    ("4310", "B2 Charity Expenses", 2, None, True),',
    "Spiritual Organisations subtotal"
)

replace_once(
    '    ("4320", "Scholarships", 3, "Scholarships", False),\n\n'
    '    ("", "Total Charity Payments", 1, "TOTAL_GROUP_4300", False),',
    '    ("4320", "Scholarships", 3, "Scholarships", False),\n'
    '    ("", "Sub Total", 2, None, False),\n\n'
    '    ("", "Total Charity Payments", 1, "TOTAL_GROUP_4300", False),',
    "Charity Expenses subtotal"
)

# Replace only the _build_side method, leaving all other view methods intact.
method = r'''    def _build_side(self, church, schedule, date_from, date_to, prev_from, prev_to, side):
        rows = []

        active_banks = (
            BankAccount.objects
            .filter(church=church, is_active=True)
            .select_related("ledger")
        )
        banks_by_type = {"1000": [], "1100": [], "1200": []}

        for bank in active_banks:
            lname = bank.ledger.ledger_name.lower() if bank.ledger else ""
            if "deposit" in lname:
                banks_by_type["1100"].append(bank)
            elif "other" in lname:
                banks_by_type["1200"].append(bank)
            else:
                banks_by_type["1000"].append(bank)

        section_totals = {}
        group_totals = {}
        current_section = None

        # Each nested group has its own totals. Coded groups also contribute
        # to group_totals, while blank-code groups still get independent subtotals.
        active_groups = []

        group_total_names = {
            "Total of Church Receipts": "2000",
            "Total Donation Receipts": "2300",
            "Total of Interest and Income from Investments": "2400",
            "Total of Income from Church Commercial Buildings": "2500",
            "Total of Corpus Donations": "3000",
            "Total of Borrowings": "3100",
            "Total of Advances": "3200",
            "Total of Liabilities and Advances": "3300",
            "Total of Security Deposits Returned": "3350",
            "Total of Taxes and Refund": "3650",
            "Total Inter Accounts Payments": "4030",
            "Total of Religious Payments": "4200",
            "Total Charity Payments": "4300",
            "Total Taxes and Penalties": "4340",
            "Total of Finance Charges": "4500",
            "Total of Administrative Expenses": "4550",
            "Total of Fixed Assets Addition": "4600",
            "Total of Investments": "4700",
            "Total of Loans and Advances": "4750",
            "Total of Security Deposits": "4800",
            "Total of Repayment of Loans": "4850",
            "Total of Taxes and Penalty": "4900",
        }

        section_total_names = {
            "Total of Opening Balances": "I",
            "Total of Revenue Receipts (A+B+C+D+E+F+G)": "II",
            "Total of Inter Church Receipts": "III",
            "Total of Capital Receipts (A+B+C+D+E+F+G+H+I)": "IV",
            "Total of Inter Church Payments": "V",
            "Total of Revenue Payments (A+B+C+D+E+F+G+H)": "VI",
            "Total of Capital Payments (A+B+C+D+E+F+G+H+I)": "VII",
            "Total of Closing Balances": "VIII",
        }

        for code, name, depth, db_key, is_group in schedule:
            cur, prev = 0.0, 0.0

            is_section_row = code in (
                "I", "II", "III", "IV", "V", "VI", "VII", "VIII"
            )
            is_bank_row = bool(db_key and db_key.startswith("BANK"))
            is_subtotal_row = name == "Sub Total"
            is_total_row = name.startswith("Total")

            if is_section_row:
                current_section = code
                section_totals.setdefault(code, [0.0, 0.0])
                active_groups = []

            elif is_group:
                # Remove groups at this depth and all deeper levels.
                active_groups = [
                    group for group in active_groups
                    if group["depth"] < depth
                ]

                group = {
                    "code": code,
                    "name": name,
                    "depth": depth,
                    "current": 0.0,
                    "previous": 0.0,
                }
                active_groups.append(group)

                if code:
                    group_totals.setdefault(code, [0.0, 0.0])

            bank_group_sum_cur = 0.0
            bank_group_sum_prev = 0.0

            if is_bank_row:
                is_closing = db_key.startswith("BANK_CLOSE")
                b_type = (
                    "1000" if db_key.endswith("_1")
                    else "1100" if db_key.endswith("_2")
                    else "1200"
                )

                for bank in banks_by_type[b_type]:
                    if not bank.ledger:
                        continue

                    if is_closing:
                        b_cur = self._running_balance(
                            church, bank.ledger, date_to, inclusive=True
                        )
                        b_prev = (
                            self._running_balance(
                                church, bank.ledger, prev_to, inclusive=True
                            ) if prev_to else 0.0
                        )
                    else:
                        b_cur = float(bank.opening_balance or 0)
                        b_prev = 0.0

                    bank_group_sum_cur += b_cur
                    bank_group_sum_prev += b_prev

                    rows.append({
                        "section": "",
                        "code": "",
                        "name": bank.bank_name,
                        "depth": depth + 1,
                        "row_type": "ledger_child",
                        "current_year": round(b_cur, 2),
                        "previous_year": round(b_prev, 2),
                    })

                cur = bank_group_sum_cur
                prev = bank_group_sum_prev

            elif db_key and not is_group:
                ledgers = AccountLedgerMaster.objects.filter(
                    church=church,
                    ledger_name__iexact=db_key
                )

                for ledger in ledgers:
                    is_closing = code in self.CLOSING_CODES
                    is_opening = code in self.OPENING_CODES

                    if is_closing:
                        cur += self._running_balance(
                            church, ledger, date_to, inclusive=True
                        )
                        prev += (
                            self._running_balance(
                                church, ledger, prev_to, inclusive=True
                            ) if prev_to else 0.0
                        )
                    elif is_opening:
                        cur += float(ledger.op_balance or 0)
                    else:
                        cur += self._ledger_amount(
                            church, ledger, date_from, date_to, side
                        )
                        prev += (
                            self._ledger_amount(
                                church, ledger, prev_from, prev_to, side
                            ) if (prev_from or prev_to) else 0.0
                        )

            # Subtotals belong to the nearest active group at their depth.
            if is_subtotal_row:
                matching_groups = [
                    group for group in active_groups
                    if group["depth"] == depth
                ]
                if not matching_groups:
                    matching_groups = [
                        group for group in active_groups
                        if group["depth"] <= depth
                    ]

                if matching_groups:
                    subtotal_group = matching_groups[-1]
                    cur = subtotal_group["current"]
                    prev = subtotal_group["previous"]

            # Custom named totals.
            elif name in group_total_names:
                totals = group_totals.get(
                    group_total_names[name], [0.0, 0.0]
                )
                cur, prev = totals[0], totals[1]

            elif name in section_total_names:
                totals = section_totals.get(
                    section_total_names[name], [0.0, 0.0]
                )
                cur, prev = totals[0], totals[1]

            elif name == "Total Religious Receipts (A+B)":
                a = group_totals.get("2000", [0.0, 0.0])
                b = group_totals.get("2300", [0.0, 0.0])
                cur = a[0] + b[0]
                prev = a[1] + b[1]

            elif name == "Total of Inter Church Receipts":
                totals = section_totals.get("III", [0.0, 0.0])
                cur, prev = totals[0], totals[1]

            if is_section_row:
                row_type = "section"
            elif is_group:
                row_type = "group"
            elif is_subtotal_row:
                row_type = "subtotal"
            elif is_total_row:
                row_type = (
                    "total" if "A+B" in name else "subtotal"
                )
            else:
                row_type = "ledger"

            rows.append({
                "section": "",
                "code": code or "",
                "name": name,
                "depth": depth,
                "row_type": row_type,
                "current_year": round(cur, 2) if cur is not None else None,
                "previous_year": round(prev, 2) if prev is not None else None,
            })

            # Do not add group headers, subtotals or total rows again.
            if (
                not is_section_row
                and not is_group
                and not is_subtotal_row
                and not is_total_row
            ):
                calc_cur = cur if cur is not None else 0.0
                calc_prev = prev if prev is not None else 0.0

                if current_section:
                    section_totals.setdefault(
                        current_section, [0.0, 0.0]
                    )
                    section_totals[current_section][0] += calc_cur
                    section_totals[current_section][1] += calc_prev

                # Add each ledger amount to every active ancestor group.
                for group in active_groups:
                    group["current"] += calc_cur
                    group["previous"] += calc_prev

                    if group["code"]:
                        group_totals.setdefault(
                            group["code"], [0.0, 0.0]
                        )
                        group_totals[group["code"]][0] += calc_cur
                        group_totals[group["code"]][1] += calc_prev

        return rows

'''

views = views_path.read_text(encoding="utf-8")

pattern = r"    def _build_side\(.*?(?=    def _ledger_amount\()"
updated_views, count = re.subn(
    pattern,
    lambda match: method,
    views,
    count=1,
    flags=re.S
)

if count != 1:
    raise RuntimeError(
        f"Could not safely locate _build_side method. Found {count}. "
        "No files have been written."
    )

# Write only after every replacement and method match has been validated.
schedule_path.write_text(schedule, encoding="utf-8")
views_path.write_text(updated_views, encoding="utf-8")

print("Receipts and Payments schedule updates applied.")
print("Nested group calculation updated.")
print("Income and Expenditure schedules were not modified.")
