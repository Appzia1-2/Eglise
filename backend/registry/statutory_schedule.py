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
    ("J", "2980", "Profit on Sale/redemption of investment",     0, "ledger",     "Profit on Sale/redemption of investment"),

    # =============================================================
    # K. Profit on Sale of Fixed Assets
    # =============================================================
    ("K", "2981", "Profit on Sale of Fixed Assets",              0, "ledger",     "Profit on Sale of Fixed Assets"),

        # =============================================================
    # Grand total + balancing
    # =============================================================
    ("",  None,   "TOTAL INCOME (A+B+C+D+E+F+G+H+I+J+K)",        0, "grand_total", None),
    ("L", "2999", "Deficit - Excess of expenditure over income", 0, "adjustment", None),

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
    ("X", "5628", "Depreciation",                                0, "ledger",     "Depreciation"),

    # =============================================================
    # Y. Income Tax
    # =============================================================
    ("Y", "4563", "Income Tax",                                  0, "ledger",     "Income Tax"),

    # =============================================================
    # Grand total + balancing
    # =============================================================
    ("",  None,   "TOTAL EXPENSES (M+N+O+P+Q+R+S+T+U+V+W+X+Y)",  0, "grand_total", None),
    ("Z", "4999", "Surplus - Excess of income over expenditure", 0, "adjustment", None),
    ("",  None,   "TOTAL",                                       0, "grand_total_balanced", None),
]

# registry/statutory_schedule.py

RECEIPTS_SCHEDULE_RP = [
    ("I", "Opening Balances", 0, None, False),
    ("1000", "Balance in savings account as per Schedule 1", 1, "BANK_1", False),
    ("1100", "Balance in deposit account as per Schedule 2", 1, "BANK_2", False),
    ("1200", "Balance in other accounts as per schedule 3", 1, "BANK_3", False),
    ("1300", "Cash in hand as per Schedule 4", 1, "Cash in Hand", False),
    ("", "Total of Opening Balances", 1, "TOTAL_SECTION_I", False),
    
    ("II", "Revenue Receipts", 0, None, False),
    ("2000", "A  Church Receipts", 1, None, True), 
    
    ("2100", "Bhandaram Collection", 2, None, True),
    ("2101", "Church", 3, "Church", False),
    ("2102", "Kurishinthotti", 3, "Kurishinthotti", False),
    ("2103", "Others (specify)", 3, "Others (specify)", False),
    ("", "Sub Total", 2, None, False),
    
    ("2110", "Qurbana Receipts", 2, None, True),
    
    
    ("2120", "Offerings Received", 2, None, True),
    ("2121", "Church", 3, "Church", False),
    ("2122", "Kurishinthotti", 3, "Kurishinthotti", False),
    ("2123", "Baptism", 3, "Baptism", False),
    ("2124", "Funeral", 3, "Funeral", False),
    ("2125", "Birthday Contributions", 3, "Birthday Contributions", False),
    ("2126", "Other offerings", 3, "Other offerings", False),
    ("2127", "Offerings for Ritual Articles", 3, "Offerings for Ritual Articles", False),
    ("", "Sub Total", 2, None, False),
    
    ("2160", "Receipts for Festivals", 2, None, True),
    ("2161", "July 3rd Festival", 3, "July 3rd Festival", False),
    ("2162", "August 15 Festival", 3, "August 15 Festival", False),
    ("2163", "Church Festival", 3, "Church Festival", False),
    ("2164", "Parumala Festival", 3, "Parumala Festival", False),
    ("2165", "Others", 3, "Others", False),
    ("", "Sub Total", 2, None, False),
    
    ("2170", "Receipts for Piligrimage", 2, None, True),
    ("2171", "Parumala", 3, "Parumala", False),
    ("2172", "Others:", 3, "Others:", False),
    ("", "Sub Total", 2, None, False),
    
    ("2180", "Receipts for Spiritual Organizations", 2, None, True),
    ("2181", "Sunday School", 3, "Sunday school", False),
    ("2182", "Youth Movement", 3, "Youth Movement", False),
    ("2183", "Vanitha Samajam", 3, "Vanitha Samajam", False),
    ("2184", "Prarthanayogam", 3, "Prarthanayogam", False),
    ("2185", "Bala Samajam", 3, "Bala Samajam", False),
    ("2186", "OVBS", 3, "OVBS", False),
    ("2187", "MGOCSM", 3, "MGOCSM", False),
    ("2188", "Other spiritual organisations", 3, "Other spiritual organisations", False),
    ("", "Sub Total", 2, None, False),
    
    ("2210", "Members Subscriptions", 2, None, True),
    ("2211", "Monthly subscription", 3, "Monthly subscription", False),
    ("2212", "For the current year", 3, "Current year receipts", False),
    ("2213", "Outstanding from previous year", 3, "Outstanding from previous year", False),
    ("2214", "Advance for next year", 3, "Advance for next year", False),
    ("2216", "Other subscriptions", 3, "Other subscriptions", False),
    ("", "Sub Total", 2, None, False),
    
    ("2220", "Income from Church Buildings", 2, None, True),
    ("2221", "Rental income of Parish Hall", 3, None, True),
    ("", "a) GST Applicable Income", 4, "a) GST Applicable Income", False),
    ("", "b) GST not Applicable Income", 4, "b) GST not Applicable Income", False),
    ("", "Sub Total", 2, None, False),
    
    ("2230", "Miscellaneous income", 2, None, True),
    ("2231", "Income from Publications", 3, "Income from publications", False),
    ("2232", "Income from own institutions", 3, "Income from own institutions", False),
    ("2233", "Ambulance Charges", 3, "Ambulance Charges", False),
    ("2234", "Receipt from Tomb/Grave", 3, "Tomb charges", False),
    ("2235", "Other Receipts", 3, "Other Receipts", False),
    ("", "Sub Total", 2, None, False),
    
    ("", "Total of Church Receipts", 1, "TOTAL_GROUP_2000", False),
    
    ("2300", "B  Donations", 1, None, True), 
    ("2301", "General Donations", 2, "General Donations", False),
    ("2302", "House Building Assistance Fund", 2, "House Building Assistance Fund", False),
    ("2303", "Marriage Assistance Fund", 2, "Marriage Assistance Fund", False),
    ("2304", "Assistance for Poor Fund /Charity", 2, "Assistance for Poor Fund /Charity", False),
    ("2305", "Medical Assistance", 2, "Medical Assistance", False),
    ("2306", "Education Assistances", 2, "Education Assistances", False),
    ("2307", "Dhyanam/Suvishshayogam", 2, "Dhyanam/Suvishshayogam", False),
    ("2308", "Church Celebrations (other than perunnal)", 2, "Church celebrations (other than perunnal)", False),
    ("2309", "Meeting and conventions", 2, "Meeting and conventions", False),
    ("2310", "Christmas Karol", 2, "Christmas Karol", False),
    ("2311", "Parish Day", 2, "Parish Day", False),
    ("2312", "Lent and Passion Week", 2, "Lent and Passion Week", False),
    ("2313", "Marriage Receipts", 2, "Marriage Receipts", False),
    ("2314", "Harvest Festival Receipts", 2, "Harvest Festival Receipts", False),
    ("2315", "Annadhanam and feast", 2, "Annadhanam and feast", False),
    ("2316", "Receipt of Agricultural Produces", 2, "Receipt of Agricultural Produces", False),
    ("2317", "Other Donations", 2, "Other Donations", False),
    
    ("", "Total Donation Receipts", 1, "TOTAL_GROUP_2300", False),
    ("", "Total Religious Receipts (A+B)", 1, "TOTAL_SECTION_II_AB", False),
    
    
    ("2401", "Bank SB Interest", 2, "Bank SB Interest", False),
    ("2402", "Bank FD Interest", 2, "Bank FD Interest", False),
    ("2403", "Other investment income", 2, "Other investment income", False),
    ("", "Total of Interest and Income from Investments", 1, "TOTAL_GROUP_2400", False),
    
    ("2450", "D  Agricultural Income", 1, "Agricultural Income", False),
    
    ("2500", "E  Income from Commercial Buildings", 1, None, True),
    ("2501", "Rental income from Commercial Building", 2, None, True),
    ("", "a) GST Applicable Income", 3, "a) GST Applicable Income", False),
    ("", "b) GST not Applicable Income", 3, "b) GST not Applicable Income", False),
    ("", "Total of Income from Church Commercial Buildings", 1, "TOTAL_GROUP_2500", False),
    
    ("2600", "F  Hospital Collections", 1, "Hospital Collections", False),
    ("2700", "G  School/College Collections", 1, "School/College Collections", False),
    
    ("", "Total of Revenue Receipts (A+B+C+D+E+F+G)", 1, "TOTAL_SECTION_II", False),
    
    ("III", "Inter Church / Unit Accounts", 0, None, False),
    ("2800", "Special collections", 1, None, True),
    ("2801", "Catholicate Day collection", 2, "Catholicate Day collection", False),
    ("2802", "Recceessa", 2, "Recceessa", False),
    ("2803", "Vivaha Kaimuthu", 2, "Vivaha Kaimuthu", False),
    ("2804", "Mission Sunday collection", 2, "Mission Sunday collection", False),
    ("2805", "Sunday school day collection", 2, "Sunday school day collection", False),
    ("2806", "Seminary day collection", 2, "Seminary day collection", False),
    ("2807", "Diocesan day collection", 2, "Diocesan day collection", False),
    ("2808", "Garbo Sunday Collection", 2, "Garbo Sunday Collection", False),
    ("2809", "Other collections", 2, "Other collections", False),
    ("", "Sub Total", 2, None, False),
    
    ("2900", "Grant and Assistance From Diocese and HO", 1, None, True),
    ("2910", "Grant from Catholicate Office", 2, None, True),
    ("2911", "Capital Expenses", 3, "Capital Expenses", False),
    ("2912", "Grant for Revenue Expenditure", 3, "Grant for Revenue Expenditure", False),
    ("", "Sub Total", 2, None, False),
    
    ("2920", "Grant From Diocese", 2, None, True),
    ("2921", "Capital Expenses", 3, "Capital Expenses", False),
    ("2922", "Grant for Revenue Expenditure", 3, "Grant for Revenue Expenditure", False),
    ("2923", "Salary Fund", 3, "Salary Fund", False),
    ("", "Sub Total", 2, None, False),
    
    ("", "Total of Inter Church Receipts", 1, "TOTAL_SECTION_III", False),
    
    ("IV", "Capital Receipts", 0, None, False),
    ("3000", "A  Corpus Donations", 1, None, True),
    ("3001", "Building and construction", 2, "Building and construction", False),
    ("3002", "Church articles", 2, "Church articles", False),
    ("3003", "Other donation for capital expenditute", 2, "Other donation for capital expenditute", False),
    ("", "Total of Corpus Donations", 1, "TOTAL_GROUP_3000", False),
    
    ("3100", "B  Borrowings and Loans", 1, None, True),
    ("3101", "Loan from Banks", 2, "Loan from Banks", False),
    ("3102", "Loan from Others (Other Than Church Members)", 2, "Loan from Others (Other Than Church Members)", False),
    ("3103", "Loan from Church Members", 2, "Loan from Church Members", False),
    ("", "Total of Borrowings", 1, "TOTAL_GROUP_3100", False),
    
    ("3200", "C  Advances", 1, None, True),
    ("3201", "Advance from Diocese (Inter accounts)", 2, "Advance from Diocese (Inter accounts)", False),
    ("3202", "Rent advance (Own property)", 2, "Rent advance (Own property)", False),
    ("3203", "Advances from Trustees", 2, "Advances from Trustees", False),
    ("3204", "Advance from others", 2, "Advance from others", False),
    ("3205", "Deposits/Bonds", 2, "Deposits/Bonds", False),
    ("", "Total of Advances", 1, "TOTAL_GROUP_3200", False),
    
    ("3300", "D  Liabilities and Payables", 1, None, True),
    ("3301", "Expenses Payables", 2, "Expenses Payables", False),
    ("3302", "Advances Returned", 2, "Advances Returned", False),
    ("3303", "Other Liabilities", 2, "Other Liabilities", False),
    ("3304", "Rent Deposits", 2, "Rent Deposits", False),
    ("", "Total of Liabilities and Advances", 1, "TOTAL_GROUP_3300", False),
    
    ("3350", "E  Return of Deposits and Investments", 1, None, True),
    ("3351", "Deposits", 2, "Deposits", False),
    ("3352", "Investments", 2, "Investments", False),
    ("", "Total of Security Deposits Returned", 1, "TOTAL_GROUP_3350", False),
    
    ("3400", "F  Endowment Receipts", 1, "Endowment Receipts", False),
    ("3500", "G  Sale of Fixed Assets", 1, "Sale of Fixed Assets", False),
    
    ("3650", "H  Taxes and Refund", 1, None, True),
    ("3651", "Refund of Taxes", 2, "Refund of Taxes", False),
    ("3652", "G S T Collected", 2, "GST Collected", False),
    ("3653", "Collection of TDS Payable (Cr)", 2, "Collection of TDS Payable (Cr)", False),
    ("", "Total of Taxes and Refund", 1, "TOTAL_GROUP_3650", False),
    
    ("3700", "I  Other Capital Receipts", 1, "Other Capital Receipts", False),
    
    ("", "Total of Capital Receipts (A+B+C+D+E+F+G+H+I)", 1, "TOTAL_SECTION_IV", False),
]


PAYMENTS_SCHEDULE_RP = [
    ("V", "Inter Church / Unit Accounts", 0, None, False),
    ("4000", "Payment of Special Collections (Inter Accounts)", 1, None, True),
    ("", "To Malankara Metropolitan", 2, None, True),
    ("4001", "Catholicate Day Collection", 3, "Catholicate Day Collection", False),
    ("4002", "Recceessa", 3, "Recceessa", False),
    ("", "Sub Total", 3, None, False),
    
    ("", "To Diocession Office", 2, None, True),
    ("4003", "Diocesan day collection", 3, "Diocesan day collection", False),
    ("4004", "Vivaha Kaimuthu", 3, "Vivaha Kaimuthu", False),
    ("4005", "Hossana Kanikka", 3, "Hossana Kanikka", False),
    ("4006", "Kohene Kanikka", 3, "Kohene Kanikka", False),
    ("4008", "Other Collections", 3, "Other Collections", False),
    ("", "Sub Total", 3, None, False),
    
    ("", "To Other Offices", 2, None, True),
    ("4009", "Mission Sunday collection", 3, "Mission Sunday collection", False),
    ("4010", "Sunday school day collection", 3, "Sunday school day collection", False),
    ("4011", "Seminary day collection", 3, "Seminary day collection", False),
    ("4012", "Gerbo Sunday Collection", 3, "Gerbo Sunday Collection", False),
    ("4013", "Other collections", 3, "Other collections", False),
    ("", "Sub Total", 3, None, False),
    
    ("4030", "Inter Accounts Payments to Diocese", 1, None, True),
    ("4031", "Priest salary Paid to Diocese", 2, "Priest salary Paid to Diocese", False),
    ("4032", "Methrasana Vihitham", 2, "Methrasana Vihitham", False),
    ("", "Total Inter Accounts Payments", 1, "TOTAL_GROUP_4030", False),
    
    ("4100", "Grant and Assistance (Inter accounts)", 1, None, True),
    ("4102", "Grant to Spiritual Organisations", 2, "Grant to Spiritual Organisations", False),
    ("4103", "Other grants", 2, "Other grants", False),
    ("", "Sub Total", 2, None, False),
    
    ("", "Total of Inter Church Payments", 1, "TOTAL_SECTION_V", False),
    
    ("VI", "Revenue Payments", 0, None, False),
    ("4200", "A  Religious Payments", 1, None, True),
    ("4201", "Church Expenses", 2, None, True),
    ("4202", "Holy Qurbana Allowances", 3, "Holy Qurbana Allowances", False),
    ("4203", "Church Consumables/ Daily Expenses", 3, "Church Consumables/ Daily Expenses", False),
    ("4204", "Suvisheshayogam Expenses", 3, "Suvisheshayogam Expenses", False),
    ("4205", "Holy week and Dhyanam expenses", 3, "Holy week and Dhyanam expenses", False),
    ("4206", "Feast Expenses", 3, "Annadhanam and feast expenses", False),
    ("4207", "Food and Refreshment Expenses", 3, "Food and Refreshment Expenses", False),
    ("4208", "Owned institution expenses", 3, "Owned institution expenses", False),
    ("4209", "Legal Expenses", 3, "Legal Expenses", False),
    ("4210", "Rent Paid", 3, "Rent Paid", False),
    ("4211", "Electricity Charges", 3, "Electricity Charges", False),
    ("4212", "Fuel and Water Charges", 3, "Fuel and Water Charges", False),
    ("4213", "Others", 3, "Others", False),
    ("", "Sub Total", 2, None, False),
    
    ("4230", "Salary and Allowances", 2, None, True),
    ("4231", "Allowances to Priest", 3, "Salary and allowances to priest", False),
    ("4232", "Salary and allowances to others", 3, "Salary and allowances to others", False),
    ("4233", "Priest welfare fund contribution / Gratuity", 3, "Priest welfare fund contribution / Gratuity", False),
    ("4234", "Staff welfare fund contribution", 3, "Staff welfare fund contribution", False),
    ("4235", "Allowances to Kapyar", 3, "Allowances to Kapyar", False),
    ("4236", "Honorarium", 3, "Honorarium", False),
    ("", "Sub Total", 2, None, False),
    
    ("4250", "Miscellaneous Expenses", 2, None, True),
    ("4251", "Wages and Cooly", 3, "Wages and Cooly", False),
    ("4252", "Meeting and Conference expenses", 3, "Meeting and Conference expenses", False),
    ("4253", "Cleaning Expenses", 3, "Cleaning Expenses", False),
    ("4254", "Ambulance Expenses", 3, "Ambulance Expenses", False),
    ("4255", "Canteen Payments", 3, "Canteen Payments", False),
    ("4256", "Tomb Construction", 3, "Tomb Construction", False),
    ("4257", "Vehicle Running and Maintenance Expenses", 3, "Vehicle Running and Maintenance Expenses", False),
    ("4258", "Others", 3, "Others", False),
    ("", "Sub Total", 2, None, False),
    
    ("4260", "Perunnal expenses", 2, None, True),
    ("4261", "July 3rd Festival", 3, "July 3rd Festival", False),
    ("4262", "August 15 Festival", 3, "August 15 Festival", False),
    ("4263", "Church Festival", 3, "Church Festival", False),
    ("4264", "Parumala Festival", 3, "Parumala Festival", False),
    ("4265", "Others", 3, "Others", False),
    ("4266", "Pilgrimage Expenses", 3, "Pilgrimage Expenses", False),
    ("", "Sub Total", 2, None, False),
    
    ("4270", "Repairs and maintenance", 2, None, True),
    ("4271", "Buildings", 3, "Buildings", False),
    ("4272", "Equipments", 3, "Equipments", False),
    ("4273", "Computers", 3, "Computers", False),
    ("4274", "Vehicles", 3, "Vehicles", False),
    ("4275", "Others", 3, "Others", False),
    ("", "Sub Total", 2, None, False),
    
    ("4280", "Other Payments", 2, None, True),
    ("4281", "Publication", 3, "Publication", False),
    ("4282", "Send off Expenses", 3, "Send off Expenses", False),
    ("4283", "Celebration expenses:", 3, "Celebration expenses:", False),
    ("4284", "Christmas", 3, "Christmas", False),
    ("4285", "Others", 3, "Others", False),
    ("", "Sub Total", 2, None, False),
    
    ("", "Total of Religious Payments", 1, "TOTAL_GROUP_4200", False),
    
    ("4300", "B  Charity Payments", 1, None, True),
    ("4301", "B1 Spiritual Organisations Expenses", 2, None, True),
    ("4302", "Sunday School", 3, "Sunday School", False),
    ("4303", "Youth Movement", 3, "Youth Movement", False),
    ("4304", "Vanitha Samajam", 3, "Vanitha Samajam", False),
    ("4305", "Prarthanayogam", 3, "Prarthanayogam", False),
    ("4306", "Bala Samajam", 3, "Bala Samajam", False),
    ("4307", "OVBS", 3, "OVBS", False),
    ("4308", "MGOCSM", 3, "MGOCSM", False),
    ("4309", "Other Spiritual organisations", 3, "Other Spiritual organisations", False),
    
    ("4310", "B2 Charity Expenses", 2, None, True),
    ("4311", "Medical Aid", 3, "Medical Aid", False),
    ("4312", "Marriage Aid", 3, "Marriage Aid", False),
    ("4313", "Housing Aid", 3, "Housing Aid", False),
    ("4314", "Education and Scholership", 3, "Education and Scholership", False),
    ("4315", "Rice Distribution", 3, "Rice Distribution", False),
    ("4316", "Deaddiction Movement", 3, "Deaddiction Movement", False),
    ("4317", "Other Charity", 3, "Other Charity", False),
    ("4318", "Annadhanam Expenses", 3, "Annadhanam Expenses", False),
    ("4319", "Gifts and Compliments", 3, "Gifts and Compliments", False),
    ("4320", "Scholarships", 3, "Scholarships", False),
    
    ("", "Total Charity Payments", 1, "TOTAL_GROUP_4300", False),
    
    ("4330", "C  Agricultural Expenses", 1, "Agricultural Expenses", False),
    
    ("4340", "D  Taxes and Penalty", 1, None, True),
    ("4341", "Land Tax", 2, "Land Tax", False),
    ("4342", "Building Tax", 2, "Building Tax", False),
    ("4343", "Building Tax on Let out Properties", 2, "Building Tax on Let out Properties", False),
    ("4344", "Penalty", 2, "Penalty", False),
    ("4345", "Others", 2, "Others", False),
    ("", "Total Taxes and Penalties", 1, "TOTAL_GROUP_4340", False),
    
    ("4350", "E  Hospital Expenses", 1, "Hospital Expenses", False),
    ("4400", "F  School/College Expenses", 1, "School/College Expenses", False),
    
    ("4500", "G  Finance charges", 1, None, True),
    ("4501", "Interest on Bank loans", 2, "Interest on Bank loans", False),
    ("4502", "Interest on other loans and advances", 2, "Interest on other loans and advances", False),
    ("4503", "Bank Charges", 2, "Bank Charges", False),
    ("", "Total of Finance Charges", 1, "TOTAL_GROUP_4500", False),
    
    ("4550", "H  Administrative expenses", 1, None, True),
    ("4551", "Travelling Expenses", 2, "Travelling Expenses", False),
    ("4552", "Auditors Remuneration", 2, "Auditors Remuneration", False),
    ("4553", "Postage and Telephone", 2, "Postage and Telephone", False),
    ("4554", "Printing and Stationery", 2, "Printing and Stationery", False),
    ("4555", "Professional and other service charges", 2, "Professional and other service charges", False),
    ("4556", "Office Expenses", 2, "Office Expenses", False),
    ("4557", "Subscription and Periodicals", 2, "Subscription and Periodicals", False),
    ("4558", "Insurance Charges", 2, "Insurance Charges", False),
    ("4559", "Advertisement Expenses", 2, "Advertisement Expenses", False),
    ("4560", "Other Expenses", 2, "Other Expenses", False),
    ("", "Total of Administrative Expenses", 1, "TOTAL_GROUP_4550", False),
    
    ("", "Total of Revenue Payments (A+B+C+D+E+F+G+H)", 1, "TOTAL_SECTION_VI", False),
    
    ("VII", "Capital Payments", 0, None, False),
    ("4600", "A  Fixed Assets", 1, None, True),
    ("4601", "Land", 2, "Land", False),
    ("4602", "Land Development", 2, "Land Development", False),
    ("4603", "Well and Tubewell", 2, "Well and Tubewell", False),
    ("4604", "Church Building", 2, "Church Building", False),
    ("4605", "Office Complex", 2, "Office Complex", False),
    ("4606", "Dhyana Mandiram", 2, "Dhyana Mandiram", False),
    ("4607", "Kurushupalli building", 2, "Kurushupalli building", False),
    ("4608", "Parish Hall building", 2, "Parish Hall building", False),
    ("4609", "Building of owned institutions", 2, "Building of owned institutions", False),
    ("4610", "Compound wall", 2, "Compound wall", False),
    ("4611", "Parsonage", 2, "Parsonage", False),
    ("4612", "Kodimaram", 2, "Kodimaram", False),
    ("4613", "Commercial Building", 2, "Commercial Building", False),
    ("4614", "Other Buildings", 2, "Other Buildings", False),
    ("4615", "Furniture and Fixtures", 2, "Furniture and Fixtures", False),
    ("4616", "Church Equipments", 2, "Church Equipments", False),
    ("4617", "Other Equipments", 2, "Other Equipments", False),
    ("4618", "Motor Vehicles", 2, "Motor Vehicles", False),
    ("4619", "Ambulance", 2, "Ambulance", False),
    ("4620", "Computer, Software and Peripherals", 2, "Computer, Software and Peripherals", False),
    ("4621", "Website", 2, "Website", False),
    ("4622", "Electrical Equipments", 2, "Electrical Equipments", False),
    ("4623", "Machinery and equipments", 2, "Machinery and equipments", False),
    ("4624", "Generator", 2, "Generator", False),
    ("4625", "Sound System", 2, "Sound System", False),
    ("4626", "Books", 2, "Books", False),
    ("4627", "Building under Construction", 2, "Building under Construction", False),
    ("", "Total of Fixed Assets Addition", 1, "TOTAL_GROUP_4600", False),
    
    ("4700", "B  Investments", 1, None, True),
    ("4701", "Deposits/ Bonds", 2, "Deposits/ Bonds", False),
    ("4702", "Mutual Funds", 2, "Mutual Funds", False),
    ("4703", "Investment of Endowment fund", 2, "Investment of Endowment fund", False),
    ("4704", "Other investments", 2, "Other investments", False),
    ("", "Total of Investments", 1, "TOTAL_GROUP_4700", False),
    
    ("4750", "C  Loans and Advances", 1, None, True),
    ("4751", "Advance to spiritual organisations", 2, "Advance to spiritual organisations", False),
    ("4752", "Advance for Land", 2, "Advance for Land", False),
    ("4753", "Advances to MOSC Institutions", 2, "Advances to MOSC Institutions", False),
    ("4754", "Advance to Contractors", 2, "Advance to Contractors", False),
    ("4755", "Other Advances", 2, "Other Advances", False),
    ("", "Total of Loans and Advances", 1, "TOTAL_GROUP_4750", False),
    
    ("4800", "D  Security Deposits", 1, None, True),
    ("4801", "Rent Deposits", 2, "Rent Deposits", False),
    ("4802", "Electricity Deposit", 2, "Electricity Deposit", False),
    ("4803", "Telephone Deposit", 2, "Telephone Deposit", False),
    ("4804", "LPG Cylinder Deposit", 2, "LPG Cylinder Deposit", False),
    ("4805", "Other Security Deposits", 2, "Other Security Deposits", False),
    ("", "Total of Security Deposits", 1, "TOTAL_GROUP_4800", False),
    
    ("4850", "E  Repayment of Borrowings and Loans", 1, None, True),
    ("4851", "Loan from Banks", 2, "Loan from Banks", False),
    ("4852", "Loan from Others(Other than Church Members)", 2, "Loan from Others(Other than Church Members)", False),
    ("4853", "Advance from Diocese (Inter accounts)", 2, "Advance from Diocese (Inter accounts)", False),
    ("4854", "Outstanding Expenses", 2, "Outstanding Expenses", False),
    ("4855", "Advances from others", 2, "Advances from others", False),
    ("4856", "Deposits/Bonds", 2, "Deposits/Bonds", False),
    ("4857", "Loan from Church Members", 2, "Loan from Church Members", False),
    ("", "Total of Repayment of Loans", 1, "TOTAL_GROUP_4850", False),
    
    ("4900", "F  Taxes and Penalty", 1, None, True),
    ("4901", "Payment of TDS collected", 2, "Payment of TDS collected", False),
    ("4902", "Tax Deducted at Source (TDS)", 2, "Tax Deducted at Source (TDS)", False),
    ("4903", "G S T Paid", 2, "GST Paid", False),
    ("", "Total of Taxes and Penalty", 1, "TOTAL_GROUP_4900", False),
    
    ("4940", "G  Payment of Sundries Payable", 1, "Payment of Sundries Payable", False),
    ("4950", "H  Payment from Endowment Fund", 1, "Payment from Endowment Fund", False),
    ("4955", "I  Other Capital Payments", 1, "Other Capital Payments", False),
    
    ("", "Total of Capital Payments (A+B+C+D+E+F+G+H+I)", 1, "TOTAL_SECTION_VII", False),
    
    ("VIII", "Closing Balances", 0, None, False),
    ("6100", "Balance in savings account as per Schedule 5", 1, "BANK_CLOSE_1", False),
    ("6200", "Balance in deposit account as per Schedule 6", 1, "BANK_CLOSE_2", False),
    ("6300", "Balance in other accounts as per Schedule 7", 1, "BANK_CLOSE_3", False),
    ("6400", "Cash in hand as per Schedule 8", 1, "Cash in Hand", False),
    ("", "Total of Closing Balances", 1, "TOTAL_SECTION_VIII", False),
]