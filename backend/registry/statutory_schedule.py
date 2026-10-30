# registry/statutory_schedule.py
"""
The MOSC Income & Expenditure statutory schedule, expressed as fixed,
ordered rows.

Each row tuple is:

    (section_letter, code, name, depth, row_type, key)

row_type ∈ {
    'section',               # lettered banner: A, B, ... L / M, ... Z
    'group',                 # a grouped heading (e.g. Bhandaram)
    'ledger',                # a leaf ledger
    'subtotal',              # computed subtotal for the enclosing group
    'total',                 # a "Total …" banner
    'adjustment',            # statutory adjustment (2214, 2215, 2999, 4999)
    'grand_total',           # TOTAL INCOME / TOTAL EXPENSES row
    'grand_total_balanced',  # the balancing TOTAL row
}

key is:
    - a ledger_name  for row_type ∈ {'ledger', 'adjustment'}
    - a group_name   for row_type ∈ {'group', 'subtotal', 'total'}
    - None           for {'section', 'grand_total', 'grand_total_balanced'}

The order here IS the order on the printed statement.
Do not re-order unless the MOSC schedule itself changes.
"""

INCOME_SCHEDULE = [
    # =============================================================
    # A. Religious Income
    # =============================================================
    ("A", "2000", "Religious Income",                            0, "section",    None),
    ("A", "2100", "Bhandaram",                                   1, "group",      "Bhandaram"),
    ("A", "2101", "Church",                                      2, "ledger",     "Church"),
    ("A", "2102", "Kurishinthotti",                              2, "ledger",     "Kurishinthotti"),
    ("A", "2103", "Others (specify)",                            2, "ledger",     "Others (specify)"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Bhandaram"),

    ("A", "2110", "Qurbana Income",                              1, "group",      "Qurbana Income"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Qurbana Income"),

    ("A", "2120", "Offerings",                                   1, "group",      "Offerings"),
    ("A", "2121", "Church",                                      2, "ledger",     "Church"),
    ("A", "2122", "Kurishinthotti",                              2, "ledger",     "Kurishinthotti"),
    ("A", "2123", "Baptism",                                     2, "ledger",     "Baptism"),
    ("A", "2124", "Funeral",                                     2, "ledger",     "Funeral"),
    ("A", "2125", "Birthday Contributions",                      2, "ledger",     "Birthday Contributions"),
    ("A", "2126", "Other Offerings",                             2, "ledger",     "Other Offerings"),
    ("A", "2127", "Offerings for Ritual Articles",               2, "ledger",     "Offerings for Ritual Articles"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Offerings"),

    ("A", "2160", "Receipts for Festivals",                      1, "group",      "Receipts for Festivals"),
    ("A", "2161", "July 3rd Festival",                           2, "ledger",     "July 3rd Festival"),
    ("A", "2162", "August 15 Festival",                          2, "ledger",     "August 15 Festival"),
    ("A", "2163", "Church Festival",                             2, "ledger",     "Church Festival"),
    ("A", "2164", "Parumala Festival",                           2, "ledger",     "Parumala Festival"),
    ("A", "2165", "Others",                                      2, "ledger",     "Others"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Receipts for Festivals"),

    ("A", "2170", "Receipts for Piligrimage",                    1, "group",      "Receipts for Piligrimage"),
    ("A", "2171", "Parumala",                                    2, "ledger",     "Parumala"),
    ("A", "2172", "Others:",                                     2, "ledger",     "Others:"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Receipts for Piligrimage"),

    ("A", "2180", "Receipts for Spiritual Organizations",        1, "group",      "Receipts for Spiritual Organizations"),
    ("A", "2181", "Sunday school",                               2, "ledger",     "Sunday school"),
    ("A", "2182", "Youth Movement",                              2, "ledger",     "Youth Movement"),
    ("A", "2183", "Vanitha Samajam",                             2, "ledger",     "Vanitha Samajam"),
    ("A", "2184", "Prarthanayogam",                              2, "ledger",     "Prarthanayogam"),
    ("A", "2185", "Bala Samajam",                                2, "ledger",     "Bala Samajam"),
    ("A", "2186", "OVBS",                                        2, "ledger",     "OVBS"),
    ("A", "2187", "MGOCSM",                                      2, "ledger",     "MGOCSM"),
    ("A", "2188", "Other spiritual organisations",               2, "ledger",     "Other spiritual organisations"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Receipts for Spiritual Organizations"),

    # ----- Members Subscriptions (statutory 2214 / 2215) -----
    ("A", "2210", "Members Subscriptions",                       1, "group",      "Members Subscriptions"),
    ("A", "2211", "Monthly subscription",                        2, "ledger",     "Monthly subscription"),
    ("A", "2212", "Current year receipts",                       2, "ledger",     "Current year receipts"),
    ("A", "2214", "Less: Advance for next year",                 2, "adjustment", "Advance for next year"),
    ("A", "2215", "Add: Subscription Receivable",                2, "adjustment", "Subscription Receivable"),
    ("A", "2216", "Other subscriptions",                         2, "ledger",     "Other subscriptions"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Members Subscriptions"),

    ("A", "2220", "Income from Church Buildings",                1, "group",      "Income from Church Buildings"),
    ("A", "2221", "Rental income of Parish Hall",                2, "group",      "Rental income of Parish Hall"),
    ("A", None,   "a) GST Applicable Income",                    3, "ledger",     "a) GST Applicable Income"),
    ("A", None,   "b) GST not Applicable Income",                3, "ledger",     "b) GST not Applicable Income"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Income from Church Buildings"),

    ("A", "2230", "Miscellaneous income",                        1, "group",      "Miscellaneous income"),
    ("A", "2231", "Income from publications",                    2, "ledger",     "Income from publications"),
    ("A", "2232", "Income from own institutions",                2, "ledger",     "Income from own institutions"),
    ("A", "2233", "Ambulance Charges",                           2, "ledger",     "Ambulance Charges"),
    ("A", "2234", "Tomb charges",                                2, "ledger",     "Tomb charges"),
    ("A", "2235", "Other Receipts",                              2, "ledger",     "Other Receipts"),
    ("A", None,   "Sub Total",                                   2, "subtotal",   "Miscellaneous income"),

    ("A", None,   "Total Religious Income",                      1, "total",      "A. Religious Income"),

    # =============================================================
    # B. Donations
    # =============================================================
    ("B", "2300", "Donations",                                   0, "section",    "B. Donations"),
    ("B", "2301", "General Donations",                           2, "ledger",     "General Donations"),
    ("B", "2302", "House Building Assistance Fund",              2, "ledger",     "House Building Assistance Fund"),
    ("B", "2303", "Marriage Assistance Fund",                    2, "ledger",     "Marriage Assistance Fund"),
    ("B", "2304", "Assistance for Poor Fund /Charity",           2, "ledger",     "Assistance for Poor Fund /Charity"),
    ("B", "2305", "Medical Assistance",                          2, "ledger",     "Medical Assistance"),
    ("B", "2306", "Education Assistances",                       2, "ledger",     "Education Assistances"),
    ("B", "2307", "Dhyanam/Suvishshayogam",                      2, "ledger",     "Dhyanam/Suvishshayogam"),
    ("B", "2308", "Church celebrations (other than perunnal)",   2, "ledger",     "Church celebrations (other than perunnal)"),
    ("B", "2309", "Meeting and conventions",                     2, "ledger",     "Meeting and conventions"),
    ("B", "2310", "Christmas Karol",                             2, "ledger",     "Christmas Karol"),
    ("B", "2311", "Parish Day",                                  2, "ledger",     "Parish Day"),
    ("B", "2312", "Lent and Passion Week",                       2, "ledger",     "Lent and Passion Week"),
    ("B", "2313", "Marriage Receipts",                           2, "ledger",     "Marriage Receipts"),
    ("B", "2314", "Harvest Festival Receipts",                   2, "ledger",     "Harvest Festival Receipts"),
    ("B", "2315", "Annadhanam and feast",                        2, "ledger",     "Annadhanam and feast"),
    ("B", "2316", "Receipt of Agricultural Produces",            2, "ledger",     "Receipt of Agricultural Produces"),
    ("B", "2317", "Other Donations",                             2, "ledger",     "Other Donations"),
    ("B", None,   "Total Donations",                             1, "total",      "B. Donations"),

    # =============================================================
    # C. Interest Income
    # =============================================================
    ("C", "2400", "Interest Income",                             0, "section",    "C. Interest Income"),
    ("C", "2401", "Bank SB Interest",                            2, "ledger",     "Bank SB Interest"),
    ("C", "2402", "Bank FD Interest",                            2, "ledger",     "Bank FD Interest"),
    ("C", "2403", "Other investment income",                     2, "ledger",     "Other investment income"),
    ("C", None,   "Total Interest and Dividend",                 1, "total",      "C. Interest Income"),

    # =============================================================
    # D. Agricultural Income
    # =============================================================
    ("D", "2450", "Agricultural Income",                         0, "section",    "D. Agricultural Income"),

    # =============================================================
    # E. Income from Commercial Buildings
    # =============================================================
    ("E", "2500", "Income from Commercial Buildings",            0, "section",    "E. Income from Commercial Buildings"),
    ("E", "2501", "Rental income from Commercial Building",      2, "group",      "Rental income from Commercial Building"),
    ("E", None,   "a) GST Applicable Income",                    3, "ledger",     "a) GST Applicable Income"),
    ("E", None,   "b) GST not Applicable Income",                3, "ledger",     "b) GST not Applicable Income"),
    ("E", None,   "Total Income from Church Commercial Buildings", 1, "total",    "E. Income from Commercial Buildings"),

    # =============================================================
    # F. Hospital Collections
    # =============================================================
    ("F", "2600", "Hospital Collections",                        0, "section",    "F. Hospital Collections"),

    # =============================================================
    # G. School/College Collections
    # =============================================================
    ("G", "2700", "School/College Collections",                  0, "section",    "G. School/College Collections"),

    # =============================================================
    # H. Inter Church / Unit Accounts
    # =============================================================
    ("H", None,   "Inter Church / unit Accounts",                0, "section",    "H. Inter Church / Unit Accounts"),
    ("H", "2800", "Special Collection Received",                 1, "group",      "Special collections"),
    ("H", "2900", "Grant and Assistance (Inter Accounts)",       1, "group",      "Grant and Assistance (Inter Accounts)"),
    ("H", "2910", "Grant from Catholicate Office",               2, "group",      "Grant from Catholicate Office"),
    ("H", "2911", "Capital Expenses",                            3, "ledger",     "Capital Expenses"),
    ("H", "2912", "Grant for Revenue Expenditure",               3, "ledger",     "Grant for Revenue Expenditure"),
    ("H", "2920", "Grant From Diocese",                          2, "group",      "Grant From Diocese"),
    ("H", "2921", "Capital Expenses",                            3, "ledger",     "Capital Expenses"),
    ("H", "2922", "Grant for Revenue Expenditure",               3, "ledger",     "Grant for Revenue Expenditure"),
    ("H", "2923", "Salary Fund",                                 3, "ledger",     "Salary Fund"),
    ("H", None,   "Total Grant and Assistances",                 2, "total",      "H. Inter Church / Unit Accounts"),
    ("H", None,   "Total Inter Church Accounts",                 1, "total",      "H. Inter Church / Unit Accounts"),

    # =============================================================
    # I. Income Accrued on Investments and Deposits
    # =============================================================
    ("I", "5820", "Income Accrued on Investments and Deposits",  0, "section",    "I. Income Accrued on Investments and Deposits"),
    ("I", "5821", "Income receivable on investments",            2, "ledger",     "Income receivable on investments"),
    ("I", "5822", "Interest receivable on advances",             2, "ledger",     "Interest receivable on advances"),
    ("I", "5823", "Interest receivable on deposits",             2, "ledger",     "Interest receivable on deposits"),
    ("I", None,   "Total Accrued Income",                        1, "total",      "I. Income Accrued on Investments and Deposits"),

    # =============================================================
    # J. Profit on Sale/redemption of investment
    # =============================================================
    ("J", "2980", "Profit on Sale/redemption of investment",     0, "section",    None),

    # =============================================================
    # K. Profit on Sale of Fixed Assets
    # =============================================================
    ("K", "2981", "Profit on Sale of Fixed Assets",              0, "section",    None),

    # =============================================================
    # Grand total + balancing
    # =============================================================
    ("",  None,   "TOTAL INCOME (A+B+C+D+E+F+G+H+I+J+K)",        0, "grand_total", None),
    ("L", "2999", "Deficit - Excess of expenditure over income", 0, "adjustment", None),
    ("",  None,   "TOTAL",                                       0, "grand_total_balanced", None),
]


EXPENDITURE_SCHEDULE = [
    # =============================================================
    # M. Payments on Inter Church / Unit Accounts
    # =============================================================
    ("M", None,   "Payments on Inter Church / Units Accounts",   0, "section",    None),
    ("M", "4000", "Special Collection Paid / Excess Paid",       1, "ledger",     "Special Collection Paid /Excess Paid"),
    ("M", "4030", "Inter Accounts Payment to Diocese",           1, "group",      "Inter Accounts Payments to Diocese"),
    ("M", "4031", "Priest salary Paid to Diocese",               2, "ledger",     "Priest salary Paid to Diocese"),
    ("M", "4032", "Methrasana Vihitham",                         2, "ledger",     "Methrasana Vihitham"),
    ("M", None,   "Sub Total",                                   2, "subtotal",   "Inter Accounts Payments to Diocese"),
    ("M", "4100", "Grant and Assistance (Inter Accounts)",       1, "group",      "Grant and Assistance (Inter Accounts)"),
    ("M", "4102", "Grant to Spiritual Organisations",            2, "ledger",     "Grant to Spiritual Organisations"),
    ("M", "4103", "Other grants",                                2, "ledger",     "Other grants"),
    ("M", None,   "Sub Total",                                   2, "subtotal",   "Grant and Assistance (Inter Accounts)"),
    ("M", None,   "Total Inter Church Payments",                 1, "total",      "M. Payments on Inter Church / Unit Accounts"),

    # =============================================================
    # N. Religious Expenses
    # =============================================================
    ("N", "4200", "Religious Expenses",                          0, "section",    "A. Religious Payments"),
    ("N", "4201", "Church Expenses",                             1, "group",      "Church Expenses"),
    ("N", "4202", "Holy Qurbana allowances",                     2, "ledger",     "Holy Qurbana Allowances"),
    ("N", "4203", "Church consumables",                          2, "ledger",     "Church Consumables/ Daily Expenses"),
    ("N", "4204", "Suvisheshayogam expenses",                    2, "ledger",     "Suvisheshayogam Expenses"),
    ("N", "4205", "Holy week and dhyanam expenses",              2, "ledger",     "Holy week and Dhyanam expenses"),
    ("N", "4206", "Annadhanam and feast expenses",               2, "ledger",     "Annadhanam and feast expenses"),
    ("N", "4207", "Food and refreshment expenses",               2, "ledger",     "Food and Refreshment Expenses"),
    ("N", "4208", "Owned institution expenses",                  2, "ledger",     "Owned institution expenses"),
    ("N", "4209", "Legal Expenses",                              2, "ledger",     "Legal Expenses"),
    ("N", "4210", "Rent paid",                                   2, "ledger",     "Rent Paid"),
    ("N", "4211", "Electricity Charges",                         2, "ledger",     "Electricity Charges"),
    ("N", "4212", "Fuel and Water Charges",                      2, "ledger",     "Fuel and Water Charges"),
    ("N", "4213", "Others",                                      2, "ledger",     "Others"),
    ("N", None,   "Sub Total",                                   2, "subtotal",   "Church Expenses"),

    ("N", "4230", "Salary and Allowances",                       1, "group",      "Salary and Allowances"),
    ("N", "4231", "Salary and allowances to priest",             2, "ledger",     "Salary and allowances to priest"),
    ("N", "4232", "Salary and allowances to others",             2, "ledger",     "Salary and allowances to others"),
    ("N", "4233", "Priest welfare fund contribution/ Gratuity",  2, "ledger",     "Priest welfare fund contribution / Gratuity"),
    ("N", "4234", "Staff welfare fund contribution",             2, "ledger",     "Staff welfare fund contribution"),
    ("N", "4235", "Allowances to Kapyar",                        2, "ledger",     "Allowances to Kapyar"),
    ("N", "4236", "Honorarium",                                  2, "ledger",     "Honorarium"),
    ("N", None,   "Sub Total",                                   2, "subtotal",   "Salary and Allowances"),

    ("N", "4250", "Miscellaneous Expenses",                      1, "group",      "Miscellaneous Expenses"),
    ("N", "4251", "Wages and cooly",                             2, "ledger",     "Wages and Cooly"),
    ("N", "4252", "Meeting and conference expenses",             2, "ledger",     "Meeting and Conference expenses"),
    ("N", "4253", "Cleaning expenses",                           2, "ledger",     "Cleaning Expenses"),
    ("N", "4254", "Ambulance Expenses",                          2, "ledger",     "Ambulance Expenses"),
    ("N", "4255", "Canteen Payments",                            2, "ledger",     "Canteen Payments"),
    ("N", "4256", "Tomb Construction",                           2, "ledger",     "Tomb Construction"),
    ("N", "4257", "Vehicle Running and maintenance Expenses",    2, "ledger",     "Vehicle Running and Maintenance Expenses"),
    ("N", "4258", "Others",                                      2, "ledger",     "Others"),
    ("N", None,   "Sub Total",                                   2, "subtotal",   "Miscellaneous Expenses"),

    ("N", "4260", "Perunnal Expenses",                           1, "group",      "Perunnal Expenses"),
    ("N", "4261", "July 3rd Festival",                           2, "ledger",     "July 3rd Festival"),
    ("N", "4262", "August 15 Festival",                          2, "ledger",     "August 15 Festival"),
    ("N", "4263", "Church Festival",                             2, "ledger",     "Church Festival"),
    ("N", "4264", "Parumala Festival",                           2, "ledger",     "Parumala Festival"),
    ("N", "4265", "Others",                                      2, "ledger",     "Others"),
    ("N", "4266", "Pilgrimage Expenses",                         2, "ledger",     "Pilgrimage Expenses"),
    ("N", None,   "Sub Total",                                   2, "subtotal",   "Perunnal Expenses"),

    ("N", "4270", "Repairs and maintenance",                     1, "group",      "Repairs and Maintenance"),
    ("N", "4271", "Buildings",                                   2, "ledger",     "Buildings"),
    ("N", "4272", "Equipments",                                  2, "ledger",     "Equipments"),
    ("N", "4273", "Computers",                                   2, "ledger",     "Computers"),
    ("N", "4274", "Vehicles",                                    2, "ledger",     "Vehicles"),
    ("N", "4275", "Others",                                      2, "ledger",     "Others"),
    ("N", None,   "Sub Total",                                   2, "subtotal",   "Repairs and Maintenance"),

    ("N", "4280", "Other Expenses",                              1, "group",      "Other Payments"),
    ("N", "4281", "Publication",                                 2, "ledger",     "Publication"),
    ("N", "4282", "Send off Expenses",                           2, "ledger",     "Send off Expenses"),
    ("N", "4283", "Celebration expenses:",                       2, "ledger",     "Celebration expenses:"),
    ("N", "4284", "Christmas",                                   2, "ledger",     "Christmas"),
    ("N", "4285", "Others",                                      2, "ledger",     "Others"),
    ("N", None,   "Sub Total",                                   2, "subtotal",   "Other Payments"),
    ("N", None,   "Total Religious Payments",                    1, "total",      "N. Religious Expenses"),

    # =============================================================
    # O. Charity Payments
    # =============================================================
    ("O", "4300", "Charity Payments",                            0, "section",    "B. Charity Payments"),
    ("O", "4301", "O1 Spiritual Organisations Expenses",         1, "group",      "B1 Spiritual Organisations Expenses"),
    ("O", "4302", "Sunday School",                               2, "ledger",     "Sunday School"),
    ("O", "4303", "Youth Movement",                              2, "ledger",     "Youth Movement"),
    ("O", "4304", "Vanitha Samajam",                             2, "ledger",     "Vanitha Samajam"),
    ("O", "4305", "Prarthanayogam",                              2, "ledger",     "Prarthanayogam"),
    ("O", "4306", "Bala Samajam",                                2, "ledger",     "Bala Samajam"),
    ("O", "4307", "OVBS",                                        2, "ledger",     "OVBS"),
    ("O", "4308", "MGOCSM",                                      2, "ledger",     "MGOCSM"),
    ("O", "4309", "Other Spiritual organisations",               2, "ledger",     "Other Spiritual organisations"),
    ("O", "4310", "O2 Charity Expenses",                         1, "group",      "B2 Charity Expenses"),
    ("O", "4311", "Medical Aid",                                 2, "ledger",     "Medical Aid"),
    ("O", "4312", "Marriage Aid",                                2, "ledger",     "Marriage Aid"),
    ("O", "4313", "Housing Aid",                                 2, "ledger",     "Housing Aid"),
    ("O", "4314", "Education and Scholership",                   2, "ledger",     "Education and Scholership"),
    ("O", "4315", "Rice Distribution",                           2, "ledger",     "Rice Distribution"),
    ("O", "4316", "Deaddiction Movement",                        2, "ledger",     "Deaddiction Movement"),
    ("O", "4317", "Other Charity",                               2, "ledger",     "Other Charity"),
    ("O", "4318", "Annadhanam Expenses",                         2, "ledger",     "Annadhanam Expenses"),
    ("O", "4319", "Gifts and Compliments",                       2, "ledger",     "Gifts and Compliments"),
    ("O", "4320", "Scholarships",                                2, "ledger",     "Scholarships"),
    ("O", None,   "Total Charity Payments",                      1, "total",      "O. Charity Payments"),

    # =============================================================
    # P. Agricultural Expenses
    # =============================================================
    ("P", "4330", "Agricultural Expenses",                       0, "section",    "C. Agricultural Expenses"),

    # =============================================================
    # Q. Taxes and Penalty
    # =============================================================
    ("Q", "4340", "Taxes and Penalty",                           0, "section",    "D. Taxes and Penalty"),
    ("Q", "4341", "Land Tax",                                    2, "ledger",     "Land Tax"),
    ("Q", "4342", "Building Tax",                                2, "ledger",     "Building Tax"),
    ("Q", "4343", "Building Tax on Let out Properties",          2, "ledger",     "Building Tax on Let out Properties"),
    ("Q", "4344", "Penalty",                                     2, "ledger",     "Penalty"),
    ("Q", "4345", "Others",                                      2, "ledger",     "Others"),
    ("Q", None,   "Total Taxes and Penalties",                   1, "total",      "Q. Taxes and Penalty"),

    # =============================================================
    # R. Hospital Expenses
    # =============================================================
    ("R", "4350", "Hospital Expenses",                           0, "section",    "E. Hospital Expenses"),

    # =============================================================
    # S. School/College Expenses
    # =============================================================
    ("S", "4400", "School/College Expenses",                     0, "section",    "F. School/College Expenses"),

    # =============================================================
    # T. Finance Charges
    # =============================================================
    ("T", "4500", "Finance Charges",                             0, "section",    "G. Finance Charges"),
    ("T", "4501", "Interest on Bank loans",                      2, "ledger",     "Interest on Bank loans"),
    ("T", "4502", "Interest on other loans and advances",        2, "ledger",     "Interest on other loans and advances"),
    ("T", "4503", "Bank Charges",                                2, "ledger",     "Bank Charges"),
    ("T", "5400", "Interest Payable on Borrowings and Loans",    2, "ledger",     "Interest Payable on Borrowings and Loans"),
    ("T", None,   "Sub Total",                                   1, "subtotal",   "G. Finance Charges"),

    # =============================================================
    # U. Administrative Expenses
    # =============================================================
    ("U", "4550", "Administrative Expenses",                     0, "section",    "H. Administrative Expenses"),
    ("U", "4551", "Travelling Expenses",                         2, "ledger",     "Travelling Expenses"),
    ("U", "4552", "Auditors Remuneration",                       2, "ledger",     "Auditors Remuneration"),
    ("U", "4553", "Postage and Telephone",                       2, "ledger",     "Postage and Telephone"),
    ("U", "4554", "Printing and Stationery",                     2, "ledger",     "Printing and Stationery"),
    ("U", "4555", "Professional and other service charges",      2, "ledger",     "Professional and other service charges"),
    ("U", "4556", "Office Expenses",                             2, "ledger",     "Office Expenses"),
    ("U", "4557", "Subscription and Periodicals",                2, "ledger",     "Subscription and Periodicals"),
    ("U", "4558", "Insurance Charges",                           2, "ledger",     "Insurance Charges"),
    ("U", "4559", "Advertisement Expenses",                      2, "ledger",     "Advertisement Expenses"),
    ("U", "4560", "Other Expenses",                              2, "ledger",     "Other Expenses"),
    ("U", "4561", "Expenses Payable",                            2, "ledger",     "Expenses Payable"),
    ("U", None,   "Sub Total",                                   1, "subtotal",   "H. Administrative Expenses"),

    # =============================================================
    # V. Loss on Sale/redemption of investment
    # =============================================================
    ("V", "4980", "Loss on Sale/redemption of investment",       0, "section",    None),

    # =============================================================
    # W. Loss on Sale of Fixed Assets
    # =============================================================
    ("W", "4981", "Loss on Sale of Fixed Assets",                0, "section",    None),

    # =============================================================
    # X. Depreciation
    # =============================================================
    ("X", "5628", "Depreciation",                                0, "section",    None),

    # =============================================================
    # Y. Income Tax
    # =============================================================
    ("Y", "4563", "Income Tax",                                  0, "section",    None),

    # =============================================================
    # Grand total + balancing
    # =============================================================
    ("",  None,   "TOTAL EXPENSES (M+N+O+P+Q+R+S+T+U+V+W+X+Y)",  0, "grand_total", None),
    ("Z", "4999", "Surplus - Excess of income over expenditure", 0, "adjustment", None),
    ("",  None,   "TOTAL",                                       0, "grand_total_balanced", None),
]