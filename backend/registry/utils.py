# registry/utils.py

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging
import random
import string

logger = logging.getLogger(__name__)


# ============================================================
# EMAIL — CHURCH CREDENTIALS
# ============================================================

def send_church_credentials(church, password, user):
    """
    Send login credentials to the church via email
    """
    try:
        subject = f"Welcome {church.name} - Church Management Login Credentials"

        frontend_login_url = getattr(
            settings, 'FRONTEND_LOGIN_URL', 'http://localhost:3000/login'
        )

        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #ae2050, #8a1a3e);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .content {{
                    background-color: #ffffff;
                    padding: 30px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                    border-radius: 0 0 10px 10px;
                }}
                .credentials {{
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #ae2050;
                }}
                .credential-row {{
                    display: flex;
                    padding: 8px 0;
                    border-bottom: 1px solid #dee2e6;
                }}
                .credential-row:last-child {{ border-bottom: none; }}
                .label {{
                    font-weight: bold;
                    color: #ae2050;
                    width: 120px;
                    flex-shrink: 0;
                }}
                .value {{
                    color: #333;
                    font-family: monospace;
                    font-size: 14px;
                }}
                .button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #ae2050, #8a1a3e);
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 15px 0;
                    font-weight: bold;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    font-size: 12px;
                    color: #999;
                    text-align: center;
                }}
                .warning {{
                    background-color: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 12px;
                    border-radius: 6px;
                    margin: 15px 0;
                    color: #856404;
                }}
                .church-details {{
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 15px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏛️ Welcome to {church.name}</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Your Church Management Portal</p>
            </div>

            <div class="content">
                <h2>Dear Church Administrator,</h2>

                <p>Your church <strong>"{church.name}"</strong> has been successfully registered and activated in the Church Management System.</p>

                <div class="credentials">
                    <h3 style="margin-top: 0; color: #ae2050;">🔑 Login Credentials</h3>
                    <div class="credential-row">
                        <span class="label">📧 Username:</span>
                        <span class="value">{user.username}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">🔒 Password:</span>
                        <span class="value">{password}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">📧 Email:</span>
                        <span class="value">{church.email}</span>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="{frontend_login_url}" class="button">
                        🚀 Login to Dashboard
                    </a>
                </div>

                <div class="warning">
                    ⚠️ <strong>Important:</strong> For security reasons, please change your password immediately after your first login.
                </div>

                <div class="church-details">
                    <h3 style="margin-top: 0; color: #ae2050;">📋 Church Details</h3>
                    <p><strong>Name:</strong> {church.name}</p>
                    <p><strong>Email:</strong> {church.email}</p>
                    <p><strong>Phone:</strong> {church.phone_number or 'Not provided'}</p>
                    <p><strong>Address:</strong> {church.get_full_address() or 'Not provided'}</p>
                    <p><strong>Diocese:</strong> {church.diocese.name if church.diocese else 'Not assigned'}</p>
                    <p><strong>Code:</strong> {church.code or 'Not assigned'}</p>
                </div>

                <div class="footer">
                    <p>This is an automated message from the Church Management System.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p style="margin-top: 10px; color: #ae2050; font-weight: bold;">© {church.created_at.year if church.created_at else '2026'} Church Management System</p>
                </div>
            </div>
        </body>
        </html>
        """

        plain_message = f"""
        Welcome to {church.name}!

        Dear Church Administrator,

        Your church "{church.name}" has been successfully registered and activated.

        Login Credentials:
        -------------------
        Username: {user.username}
        Password: {password}
        Email: {church.email}

        Login URL: {frontend_login_url}

        Church Details:
        --------------
        Name: {church.name}
        Email: {church.email}
        Phone: {church.phone_number or 'Not provided'}
        Address: {church.get_full_address() or 'Not provided'}
        Diocese: {church.diocese.name if church.diocese else 'Not assigned'}
        Code: {church.code or 'Not assigned'}

        ⚠️ Important: For security reasons, please change your password immediately after your first login.

        This is an automated message from the Church Management System.
        """

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[church.email],
            fail_silently=False,
            html_message=html_message,
        )

        logger.info(f"✅ Credentials sent successfully to {church.email}")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to send credentials to {church.email}: {str(e)}")
        return False


def generate_random_password():
    """Generate a secure random password"""
    length = 12
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(random.choice(characters) for _ in range(length))

    if not any(c.isupper() for c in password):
        password = password[:-1] + random.choice(string.ascii_uppercase)
    if not any(c.islower() for c in password):
        password = password[:-1] + random.choice(string.ascii_lowercase)
    if not any(c.isdigit() for c in password):
        password = password[:-1] + random.choice(string.digits)
    if not any(c in "!@#$%^&*" for c in password):
        password = password[:-1] + random.choice("!@#$%^&*")

    return password


# ============================================================
# DEFAULT RELATIONSHIPS
# ============================================================

DEFAULT_RELATIONSHIPS = [
    # Immediate family
    "Father",
    "Mother",
    "Husband",
    "Wife",
    "Son",
    "Daughter",
    "Brother",
    "Sister",

    # In-laws
    "Son-in-Law",
    "Daughter-in-Law",
    "Father-in-Law",
    "Mother-in-Law",
    "Brother-in-Law",
    "Sister-in-Law",

    # Extended / relatives
    "Grandfather",
    "Grandmother",
    "Grandson",
    "Granddaughter",
    "Uncle",
    "Aunt",
    "Nephew",
    "Niece",
    "Cousin",

    # Step / adopted
    "Step Father",
    "Step Mother",
    "Step Son",
    "Step Daughter",
    "Adopted Son",
    "Adopted Daughter",

    # Guardians / spiritual
    "Guardian",
    "Ward",
    "Godfather",
    "Godmother",
    "Godson",
    "Goddaughter",

    # Other dependents
    "Servant",
    "Other",
]


def seed_default_relationships(church):
    """
    Seed the full default relationship set for a church.
    All seeded rows are marked reserved=True so they cannot be
    edited or deleted through the API.
    Idempotent: safe to run multiple times.
    """
    from .models import Relationship
    for name in DEFAULT_RELATIONSHIPS:
        Relationship.objects.get_or_create(
            church=church,
            name=name,
            defaults={"reserved": True},
        )


# ============================================================
# MOSC CHART OF ACCOUNTS — GROUPS
# (group_name, parent_name, code)
# ============================================================

# ============================================================
# MOSC CHART OF ACCOUNTS — GROUPS
# (group_name, parent_name, code)
# Aligned to the statutory R&P / I&E / Balance Sheet layout
# ============================================================

DEFAULT_GROUPS = [
    # ----- I. OPENING BALANCES -----
    ("I. Opening Balances",                       None,                                       "1000"),

    # ----- II. REVENUE RECEIPTS -----
    ("II. Revenue Receipts",                      None,                                       "2000"),

    ("A. Church Receipts",                        "II. Revenue Receipts",                     "2000-A"),
    ("Bhandaram Collection",                      "A. Church Receipts",                       "2100"),
    ("Qurbana Receipts",                          "A. Church Receipts",                       "2110"),
    ("Offerings Received",                        "A. Church Receipts",                       "2120"),
    ("Receipts for Festivals",                    "A. Church Receipts",                       "2160"),
    ("Receipts for Pilgrimage",                   "A. Church Receipts",                       "2170"),
    ("Receipts for Spiritual Organizations",      "A. Church Receipts",                       "2180"),
    ("Members Subscriptions",                     "A. Church Receipts",                       "2210"),
    ("Income from Church Buildings",              "A. Church Receipts",                       "2220"),
    ("Miscellaneous Income",                      "A. Church Receipts",                       "2230"),

    ("B. Donations",                              "II. Revenue Receipts",                     "2300"),
    ("C. Interest Income",                        "II. Revenue Receipts",                     "2400"),
    ("D. Agricultural Income",                    "II. Revenue Receipts",                     "2450"),
    ("E. Income from Commercial Buildings",       "II. Revenue Receipts",                     "2500"),
    ("F. Hospital Collections",                   "II. Revenue Receipts",                     "2600"),
    ("G. School/College Collections",             "II. Revenue Receipts",                     "2700"),

    # ----- III. INTER CHURCH / UNIT ACCOUNTS (RECEIPTS) -----
    ("III. Inter Church / Unit Accounts",         None,                                       "2800"),
    ("Special collections",                       "III. Inter Church / Unit Accounts",        "2800-SC"),

    ("Grant and Assistance From Diocese and HO",  "III. Inter Church / Unit Accounts",        "2900"),
    ("Grant from Catholicate Office",             "Grant and Assistance From Diocese and HO", "2910"),
    ("Grant From Diocese",                        "Grant and Assistance From Diocese and HO", "2920"),

    # ----- IV. CAPITAL RECEIPTS -----
    ("IV. Capital Receipts",                      None,                                       "3000"),
    ("A. Corpus Donations",                       "IV. Capital Receipts",                     "3000-CD"),
    ("B. Borrowings and Loans",                   "IV. Capital Receipts",                     "3100"),
    ("C. Advances",                               "IV. Capital Receipts",                     "3200"),
    ("D. Liabilities and Payables",               "IV. Capital Receipts",                     "3300"),
    ("E. Return of Deposits and Investments",     "IV. Capital Receipts",                     "3350"),
    ("F. Endowment Receipts",                     "IV. Capital Receipts",                     "3400"),
    ("G. Sale of Fixed Assets",                   "IV. Capital Receipts",                     "3500"),
    ("H. Taxes and Refund",                       "IV. Capital Receipts",                     "3650"),
    ("I. Other Capital Receipts",                 "IV. Capital Receipts",                     "3700"),

    # ----- V. INTER CHURCH / UNIT PAYMENTS -----
    ("V. Inter Church / Unit Payments",           None,                                       "4000"),
    ("Payment of Special Collections (Inter Accounts)", "V. Inter Church / Unit Payments",    "4000-PS"),
    ("To Malankara Metropolitan",                 "Payment of Special Collections (Inter Accounts)", "4000-MM"),
    ("To Diocession Office",                      "Payment of Special Collections (Inter Accounts)", "4000-DO"),
    ("To Other Offices",                          "Payment of Special Collections (Inter Accounts)", "4000-OO"),
    ("Inter Accounts Payments to Diocese",        "V. Inter Church / Unit Payments",          "4030"),
    ("Grant and Assistance (Inter accounts)",     "V. Inter Church / Unit Payments",          "4100"),

    # ----- VI. REVENUE PAYMENTS -----
    ("VI. Revenue Payments",                      None,                                       "4200"),
    ("A. Religious Payments",                     "VI. Revenue Payments",                     "4200-RP"),
    ("Church Expenses",                           "A. Religious Payments",                    "4201"),
    ("Salary and Allowances",                     "A. Religious Payments",                    "4230"),
    ("Miscellaneous Expenses",                    "A. Religious Payments",                    "4250"),
    ("Perunnal Expenses",                         "A. Religious Payments",                    "4260"),
    ("Repairs and Maintenance",                   "A. Religious Payments",                    "4270"),
    ("Other Payments",                            "A. Religious Payments",                    "4280"),

    ("B. Charity Payments",                       "VI. Revenue Payments",                     "4300"),
    ("B1 Spiritual Organisations Expenses",       "B. Charity Payments",                      "4301"),
    ("B2 Charity Expenses",                       "B. Charity Payments",                      "4310"),

    ("C. Agricultural Expenses",                  "VI. Revenue Payments",                     "4330"),
    ("D. Taxes and Penalty",                      "VI. Revenue Payments",                     "4340"),
    ("E. Hospital Expenses",                      "VI. Revenue Payments",                     "4350"),
    ("F. School/College Expenses",                "VI. Revenue Payments",                     "4400"),
    ("G. Finance Charges",                        "VI. Revenue Payments",                     "4500"),
    ("H. Administrative Expenses",                "VI. Revenue Payments",                     "4550"),

    # ----- VII. CAPITAL PAYMENTS -----
    ("VII. Capital Payments",                     None,                                       "4600"),
    ("A. Fixed Assets",                           "VII. Capital Payments",                    "4600-FA"),
    ("B. Investments",                            "VII. Capital Payments",                    "4700"),
    ("C. Loans and Advances",                     "VII. Capital Payments",                    "4750"),
    ("D. Security Deposits",                      "VII. Capital Payments",                    "4800"),
    ("E. Repayment of Borrowings and Loans",      "VII. Capital Payments",                    "4850"),
    ("F. Taxes and Penalty (Payments)",           "VII. Capital Payments",                    "4900"),
    ("G. Payment of Sundries Payable",            "VII. Capital Payments",                    "4940"),
    ("H. Payment from Endowment Fund",            "VII. Capital Payments",                    "4950"),
    ("I. Other Capital Payments",                 "VII. Capital Payments",                    "4955"),

    # ----- VIII. CLOSING BALANCES -----
    # Report label only — closing is DERIVED from 1000..1300.
    # Do not seed any ledgers under this group.
    ("VIII. Closing Balances",                    None,                                       "6100"),

    # ----- BALANCE SHEET — LIABILITIES -----
    ("BALANCE SHEET",                             None,                                       "5000-BS"),
    ("A. Capital Fund",                           "BALANCE SHEET",                            "5000"),
    ("B. Corpus Donations",                       "BALANCE SHEET",                            "5100"),
    ("C. Reserve Fund",                           "BALANCE SHEET",                            "5150"),
    ("D. Endowment Fund",                         "BALANCE SHEET",                            "5200"),
    ("E. Borrowings, Loans and Advances",         "BALANCE SHEET",                            "5300"),
    ("F. Interest Payable on Borrowings and Loans","BALANCE SHEET",                           "5400"),
    ("G. Creditors and Expenses Payable",         "BALANCE SHEET",                            "5420"),
    ("H. Sundries Payable",                       "BALANCE SHEET",                            "5450"),

    # ----- BALANCE SHEET — ASSETS -----
    ("I. Fixed Assets",                           "BALANCE SHEET",                            "5600"),
    ("J. Investments",                            "BALANCE SHEET",                            "5700"),
    ("K. Loans and Advances (Assets)",            "BALANCE SHEET",                            "5750"),
    ("L. Security Deposits (Assets)",             "BALANCE SHEET",                            "5800"),
    ("M. Income Accrued on Investments and Deposits","BALANCE SHEET",                          "5820"),
    ("N. Receivables",                            "BALANCE SHEET",                            "5900"),
    ("O. Stock",                                  "BALANCE SHEET",                            "5950"),
    ("P. Cash and Bank Balances",                 "BALANCE SHEET",                            "6000"),
]


# ============================================================
# MOSC CHART OF ACCOUNTS — LEDGERS
# (ledger_name, group_name, code, nature, opening_balance)
#
# Design decisions (locked):
# - Cash/Bank = 4 ledgers ONLY (1000..1300). No 6100..6400.
#   Closing balances are DERIVED in the report.
# - 2214 "Advance for next year" = LIABILITY (unearned revenue).
#   I&E report subtracts its movement from subscription income.
# - 2215 "Monthly Subscription Receivable" = ASSET.
#   I&E report adds its movement to subscription income.
# - 2221 / 2501 = single ledger each (GST split deferred).
# - 5400 exists twice: once as LIABILITY (BS), once as EXPENSE
#   (I&E finance charges). The expense row uses code 5400-E.
# - Opening balances are all 0 — user posts them via receipts.
# ============================================================

DEFAULT_LEDGERS = [
    # ----- I. OPENING BALANCES (the ONLY cash/bank ledgers) -----
    ("Balance in Savings Account",         "I. Opening Balances",                        "1000",     "ASSET",     0),
    ("Balance in Deposit Account",         "I. Opening Balances",                        "1100",     "ASSET",     0),
    ("Balance in Other Accounts",          "I. Opening Balances",                        "1200",     "ASSET",     0),
    ("Cash in Hand",                       "I. Opening Balances",                        "1300",     "ASSET",     0),

    # ----- II.A CHURCH RECEIPTS -----
    ("Church",                             "Bhandaram Collection",                       "2101",     "INCOME",    0),
    ("Kurishinthotti",                     "Bhandaram Collection",                       "2102",     "INCOME",    0),
    ("Others (specify)",                   "Bhandaram Collection",                       "2103",     "INCOME",    0),

    ("Qurbana Receipts",                   "Qurbana Receipts",                           "2110",     "INCOME",    0),

    ("Church",                             "Offerings Received",                         "2121",     "INCOME",    0),
    ("Kurishinthotti",                     "Offerings Received",                         "2122",     "INCOME",    0),
    ("Baptism",                            "Offerings Received",                         "2123",     "INCOME",    0),
    ("Funeral",                            "Offerings Received",                         "2124",     "INCOME",    0),
    ("Birthday Contributions",             "Offerings Received",                         "2125",     "INCOME",    0),
    ("Other Offerings",                    "Offerings Received",                         "2126",     "INCOME",    0),
    ("Offerings for Ritual Articles",      "Offerings Received",                         "2127",     "INCOME",    0),

    ("July 3rd Festival",                  "Receipts for Festivals",                     "2161",     "INCOME",    0),
    ("August 15 Festival",                 "Receipts for Festivals",                     "2162",     "INCOME",    0),
    ("Church Festival",                    "Receipts for Festivals",                     "2163",     "INCOME",    0),
    ("Parumala Festival",                  "Receipts for Festivals",                     "2164",     "INCOME",    0),
    ("Others",                             "Receipts for Festivals",                     "2165",     "INCOME",    0),

    ("Parumala",                           "Receipts for Pilgrimage",                    "2171",     "INCOME",    0),
    ("Others",                             "Receipts for Pilgrimage",                    "2172",     "INCOME",    0),

    ("Sunday School",                      "Receipts for Spiritual Organizations",       "2181",     "INCOME",    0),
    ("Youth Movement",                     "Receipts for Spiritual Organizations",       "2182",     "INCOME",    0),
    ("Vanitha Samajam",                    "Receipts for Spiritual Organizations",       "2183",     "INCOME",    0),
    ("Prarthanayogam",                     "Receipts for Spiritual Organizations",       "2184",     "INCOME",    0),
    ("Bala Samajam",                       "Receipts for Spiritual Organizations",       "2185",     "INCOME",    0),
    ("OVBS",                               "Receipts for Spiritual Organizations",       "2186",     "INCOME",    0),
    ("MGOCSM",                             "Receipts for Spiritual Organizations",       "2187",     "INCOME",    0),
    ("Other spiritual organisations",      "Receipts for Spiritual Organizations",       "2188",     "INCOME",    0),

    ("For the current year",               "Members Subscriptions",                      "2212",     "INCOME",    0),
    ("Outstanding from previous year",     "Members Subscriptions",                      "2213",     "INCOME",    0),
    ("Advance for next year",              "Members Subscriptions",                      "2214",     "LIABILITY", 0),
    ("Other subscriptions",                "Members Subscriptions",                      "2216",     "INCOME",    0),

    ("Rental income of Parish Hall",       "Income from Church Buildings",               "2221",     "INCOME",    0),

    ("Income from Publications",           "Miscellaneous Income",                       "2231",     "INCOME",    0),
    ("Income from own institutions",       "Miscellaneous Income",                       "2232",     "INCOME",    0),
    ("Ambulance Charges",                  "Miscellaneous Income",                       "2233",     "INCOME",    0),
    ("Receipt from Tomb/Grave",            "Miscellaneous Income",                       "2234",     "INCOME",    0),
    ("Other Receipts",                     "Miscellaneous Income",                       "2235",     "INCOME",    0),

    # ----- II.B DONATIONS -----
    ("General Donations",                  "B. Donations",                               "2301",     "INCOME",    0),
    ("House Building Assistance Fund",     "B. Donations",                               "2302",     "INCOME",    0),
    ("Marriage Assistance Fund",           "B. Donations",                               "2303",     "INCOME",    0),
    ("Assistance for Poor Fund /Charity",  "B. Donations",                               "2304",     "INCOME",    0),
    ("Medical Assistance",                 "B. Donations",                               "2305",     "INCOME",    0),
    ("Education Assistances",              "B. Donations",                               "2306",     "INCOME",    0),
    ("Dhyanam/Suvishshayogam",             "B. Donations",                               "2307",     "INCOME",    0),
    ("Church Celebrations (other than perunnal)", "B. Donations",                        "2308",     "INCOME",    0),
    ("Meeting and conventions",            "B. Donations",                               "2309",     "INCOME",    0),
    ("Christmas Karol",                    "B. Donations",                               "2310",     "INCOME",    0),
    ("Parish Day",                         "B. Donations",                               "2311",     "INCOME",    0),
    ("Lent and Passion Week",              "B. Donations",                               "2312",     "INCOME",    0),
    ("Marriage Receipts",                  "B. Donations",                               "2313",     "INCOME",    0),
    ("Harvest Festival Receipts",          "B. Donations",                               "2314",     "INCOME",    0),
    ("Annadhanam and feast",               "B. Donations",                               "2315",     "INCOME",    0),
    ("Receipt of Agricultural Produces",   "B. Donations",                               "2316",     "INCOME",    0),
    ("Other Donations",                    "B. Donations",                               "2317",     "INCOME",    0),

    # ----- II.C INTEREST -----
    ("Bank SB Interest",                   "C. Interest Income",                         "2401",     "INCOME",    0),
    ("Bank FD Interest",                   "C. Interest Income",                         "2402",     "INCOME",    0),
    ("Other investment income",            "C. Interest Income",                         "2403",     "INCOME",    0),

    # ----- II.D–G -----
    ("Agricultural Income",                "D. Agricultural Income",                     "2450",     "INCOME",    0),
    ("Rental income from Commercial Building","E. Income from Commercial Buildings",      "2501",     "INCOME",    0),
    ("Hospital Collections",               "F. Hospital Collections",                    "2600",     "INCOME",    0),
    ("School/College Collections",         "G. School/College Collections",              "2700",     "INCOME",    0),

    # ----- III. INTER CHURCH RECEIPTS -----
    ("Catholicate Day collection",         "Special collections",                        "2801",     "INCOME",    0),
    ("Recceessa",                          "Special collections",                        "2802",     "INCOME",    0),
    ("Vivaha Kaimuthu",                    "Special collections",                        "2803",     "INCOME",    0),
    ("Mission Sunday collection",          "Special collections",                        "2804",     "INCOME",    0),
    ("Sunday school day collection",       "Special collections",                        "2805",     "INCOME",    0),
    ("Seminary day collection",            "Special collections",                        "2806",     "INCOME",    0),
    ("Diocesan day collection",            "Special collections",                        "2807",     "INCOME",    0),
    ("Garbo Sunday Collection",            "Special collections",                        "2808",     "INCOME",    0),
    ("Other collections",                  "Special collections",                        "2809",     "INCOME",    0),

    ("Capital Expenses",                   "Grant from Catholicate Office",              "2911",     "INCOME",    0),
    ("Grant for Revenue Expenditure",      "Grant from Catholicate Office",              "2912",     "INCOME",    0),

    ("Capital Expenses",                   "Grant From Diocese",                         "2921",     "INCOME",    0),
    ("Grant for Revenue Expenditure",      "Grant From Diocese",                         "2922",     "INCOME",    0),
    ("Salary Fund",                        "Grant From Diocese",                         "2923",     "INCOME",    0),

    # ----- IV. CAPITAL RECEIPTS -----
    ("Building and construction",          "A. Corpus Donations",                        "3001",     "INCOME",    0),
    ("Church articles",                    "A. Corpus Donations",                        "3002",     "INCOME",    0),
    ("Other donation for capital expenditute","A. Corpus Donations",                     "3003",     "INCOME",    0),

    ("Loan from Banks",                    "B. Borrowings and Loans",                    "3101",     "LIABILITY", 0),
    ("Loan from Others (Other Than Church Members)","B. Borrowings and Loans",            "3102",     "LIABILITY", 0),
    ("Loan from Church Members",           "B. Borrowings and Loans",                    "3103",     "LIABILITY", 0),

    ("Advance from Diocese (Inter accounts)","C. Advances",                              "3201",     "LIABILITY", 0),
    ("Rent advance (Own property)",        "C. Advances",                                "3202",     "LIABILITY", 0),
    ("Advances from Trustees",             "C. Advances",                                "3203",     "LIABILITY", 0),
    ("Advance from others",                "C. Advances",                                "3204",     "LIABILITY", 0),
    ("Deposits/Bonds",                     "C. Advances",                                "3205",     "LIABILITY", 0),

    ("Expenses Payables",                  "D. Liabilities and Payables",                "3301",     "LIABILITY", 0),
    ("Advances Returned",                  "D. Liabilities and Payables",                "3302",     "LIABILITY", 0),
    ("Other Liabilities",                  "D. Liabilities and Payables",                "3303",     "LIABILITY", 0),
    ("Rent Deposits",                      "D. Liabilities and Payables",                "3304",     "LIABILITY", 0),

    ("Deposits",                           "E. Return of Deposits and Investments",      "3351",     "LIABILITY", 0),
    ("Investments",                        "E. Return of Deposits and Investments",      "3352",     "LIABILITY", 0),

    ("Endowment Receipts",                 "F. Endowment Receipts",                      "3400",     "INCOME",    0),
    ("Sale of Fixed Assets",               "G. Sale of Fixed Assets",                    "3500",     "INCOME",    0),

    ("Refund of Taxes",                    "H. Taxes and Refund",                        "3651",     "INCOME",    0),
    ("GST Collected",                      "H. Taxes and Refund",                        "3652",     "LIABILITY", 0),
    ("Collection of TDS Payable (Cr)",     "H. Taxes and Refund",                        "3653",     "LIABILITY", 0),

    ("Other Capital Receipts",             "I. Other Capital Receipts",                  "3700",     "INCOME",    0),

    # ----- V. INTER CHURCH PAYMENTS -----
    ("Catholicate Day Collection",         "To Malankara Metropolitan",                  "4001",     "EXPENSE",   0),
    ("Recceessa",                          "To Malankara Metropolitan",                  "4002",     "EXPENSE",   0),

    ("Diocesan day collection",            "To Diocession Office",                       "4003",     "EXPENSE",   0),
    ("Vivaha Kaimuthu",                    "To Diocession Office",                       "4004",     "EXPENSE",   0),
    ("Hossana Kanikka",                    "To Diocession Office",                       "4005",     "EXPENSE",   0),
    ("Kohene Kanikka",                     "To Diocession Office",                       "4006",     "EXPENSE",   0),
    ("Other Collections",                  "To Diocession Office",                       "4008",     "EXPENSE",   0),

    ("Mission Sunday collection",          "To Other Offices",                           "4009",     "EXPENSE",   0),
    ("Sunday school day collection",       "To Other Offices",                           "4010",     "EXPENSE",   0),
    ("Seminary day collection",            "To Other Offices",                           "4011",     "EXPENSE",   0),
    ("Gerbo Sunday Collection",            "To Other Offices",                           "4012",     "EXPENSE",   0),
    ("Other collections",                  "To Other Offices",                           "4013",     "EXPENSE",   0),

    ("Priest salary Paid to Diocese",      "Inter Accounts Payments to Diocese",         "4031",     "EXPENSE",   0),
    ("Methrasana Vihitham",                "Inter Accounts Payments to Diocese",         "4032",     "EXPENSE",   0),

    ("Grant to Spiritual Organisations",   "Grant and Assistance (Inter accounts)",      "4102",     "EXPENSE",   0),
    ("Other grants",                       "Grant and Assistance (Inter accounts)",      "4103",     "EXPENSE",   0),

    # ----- VI.A RELIGIOUS PAYMENTS -----
    ("Holy Qurbana Allowances",            "Church Expenses",                            "4202",     "EXPENSE",   0),
    ("Church Consumables/ Daily Expenses", "Church Expenses",                            "4203",     "EXPENSE",   0),
    ("Suvisheshayogam Expenses",           "Church Expenses",                            "4204",     "EXPENSE",   0),
    ("Holy week and Dhyanam expenses",     "Church Expenses",                            "4205",     "EXPENSE",   0),
    ("Feast Expenses",                     "Church Expenses",                            "4206",     "EXPENSE",   0),
    ("Food and Refreshment Expenses",      "Church Expenses",                            "4207",     "EXPENSE",   0),
    ("Owned institution expenses",         "Church Expenses",                            "4208",     "EXPENSE",   0),
    ("Legal Expenses",                     "Church Expenses",                            "4209",     "EXPENSE",   0),
    ("Rent Paid",                          "Church Expenses",                            "4210",     "EXPENSE",   0),
    ("Electricity Charges",                "Church Expenses",                            "4211",     "EXPENSE",   0),
    ("Fuel and Water Charges",             "Church Expenses",                            "4212",     "EXPENSE",   0),
    ("Others",                             "Church Expenses",                            "4213",     "EXPENSE",   0),

    ("Allowances to Priest",               "Salary and Allowances",                      "4231",     "EXPENSE",   0),
    ("Salary and allowances to others",    "Salary and Allowances",                      "4232",     "EXPENSE",   0),
    ("Priest welfare fund contribution / Gratuity","Salary and Allowances",               "4233",     "EXPENSE",   0),
    ("Staff welfare fund contribution",    "Salary and Allowances",                      "4234",     "EXPENSE",   0),
    ("Allowances to Kapyar",               "Salary and Allowances",                      "4235",     "EXPENSE",   0),
    ("Honorarium",                         "Salary and Allowances",                      "4236",     "EXPENSE",   0),

    ("Wages and Cooly",                    "Miscellaneous Expenses",                     "4251",     "EXPENSE",   0),
    ("Meeting and Conference expenses",    "Miscellaneous Expenses",                     "4252",     "EXPENSE",   0),
    ("Cleaning Expenses",                  "Miscellaneous Expenses",                     "4253",     "EXPENSE",   0),
    ("Ambulance Expenses",                 "Miscellaneous Expenses",                     "4254",     "EXPENSE",   0),
    ("Canteen Payments",                   "Miscellaneous Expenses",                     "4255",     "EXPENSE",   0),
    ("Tomb Construction",                  "Miscellaneous Expenses",                     "4256",     "EXPENSE",   0),
    ("Vehicle Running and Maintenance Expenses","Miscellaneous Expenses",                 "4257",     "EXPENSE",   0),
    ("Others",                             "Miscellaneous Expenses",                     "4258",     "EXPENSE",   0),

    ("July 3rd Festival",                  "Perunnal Expenses",                          "4261",     "EXPENSE",   0),
    ("August 15 Festival",                 "Perunnal Expenses",                          "4262",     "EXPENSE",   0),
    ("Church Festival",                    "Perunnal Expenses",                          "4263",     "EXPENSE",   0),
    ("Parumala Festival",                  "Perunnal Expenses",                          "4264",     "EXPENSE",   0),
    ("Others",                             "Perunnal Expenses",                          "4265",     "EXPENSE",   0),
    ("Pilgrimage Expenses",                "Perunnal Expenses",                          "4266",     "EXPENSE",   0),

    ("Buildings",                          "Repairs and Maintenance",                    "4271",     "EXPENSE",   0),
    ("Equipments",                         "Repairs and Maintenance",                    "4272",     "EXPENSE",   0),
    ("Computers",                          "Repairs and Maintenance",                    "4273",     "EXPENSE",   0),
    ("Vehicles",                           "Repairs and Maintenance",                    "4274",     "EXPENSE",   0),
    ("Others",                             "Repairs and Maintenance",                    "4275",     "EXPENSE",   0),

    ("Publication",                        "Other Payments",                             "4281",     "EXPENSE",   0),
    ("Send off Expenses",                  "Other Payments",                             "4282",     "EXPENSE",   0),
    ("Celebration expenses: Christmas",    "Other Payments",                             "4284",     "EXPENSE",   0),
    ("Celebration expenses: Others",       "Other Payments",                             "4285",     "EXPENSE",   0),

    # ----- VI.B CHARITY PAYMENTS -----
    ("Sunday School",                      "B1 Spiritual Organisations Expenses",        "4302",     "EXPENSE",   0),
    ("Youth Movement",                     "B1 Spiritual Organisations Expenses",        "4303",     "EXPENSE",   0),
    ("Vanitha Samajam",                    "B1 Spiritual Organisations Expenses",        "4304",     "EXPENSE",   0),
    ("Prarthanayogam",                     "B1 Spiritual Organisations Expenses",        "4305",     "EXPENSE",   0),
    ("Bala Samajam",                       "B1 Spiritual Organisations Expenses",        "4306",     "EXPENSE",   0),
    ("OVBS",                               "B1 Spiritual Organisations Expenses",        "4307",     "EXPENSE",   0),
    ("MGOCSM",                             "B1 Spiritual Organisations Expenses",        "4308",     "EXPENSE",   0),
    ("Other Spiritual organisations",      "B1 Spiritual Organisations Expenses",        "4309",     "EXPENSE",   0),

    ("Medical Aid",                        "B2 Charity Expenses",                        "4311",     "EXPENSE",   0),
    ("Marriage Aid",                       "B2 Charity Expenses",                        "4312",     "EXPENSE",   0),
    ("Housing Aid",                        "B2 Charity Expenses",                        "4313",     "EXPENSE",   0),
    ("Education and Scholership",          "B2 Charity Expenses",                        "4314",     "EXPENSE",   0),
    ("Rice Distribution",                  "B2 Charity Expenses",                        "4315",     "EXPENSE",   0),
    ("Deaddiction Movement",               "B2 Charity Expenses",                        "4316",     "EXPENSE",   0),
    ("Other Charity",                      "B2 Charity Expenses",                        "4317",     "EXPENSE",   0),
    ("Annadhanam Expenses",                "B2 Charity Expenses",                        "4318",     "EXPENSE",   0),
    ("Gifts and Compliments",              "B2 Charity Expenses",                        "4319",     "EXPENSE",   0),
    ("Scholarships",                       "B2 Charity Expenses",                        "4320",     "EXPENSE",   0),

    # ----- VI.C–H -----
    ("Agricultural Expenses",              "C. Agricultural Expenses",                   "4330",     "EXPENSE",   0),

    ("Land Tax",                           "D. Taxes and Penalty",                       "4341",     "EXPENSE",   0),
    ("Building Tax",                       "D. Taxes and Penalty",                       "4342",     "EXPENSE",   0),
    ("Building Tax on Let out Properties", "D. Taxes and Penalty",                       "4343",     "EXPENSE",   0),
    ("Penalty",                            "D. Taxes and Penalty",                       "4344",     "EXPENSE",   0),
    ("Others",                             "D. Taxes and Penalty",                       "4345",     "EXPENSE",   0),

    ("Hospital Expenses",                  "E. Hospital Expenses",                       "4350",     "EXPENSE",   0),
    ("School/College Expenses",            "F. School/College Expenses",                 "4400",     "EXPENSE",   0),

    ("Interest on Bank loans",             "G. Finance Charges",                         "4501",     "EXPENSE",   0),
    ("Interest on other loans and advances","G. Finance Charges",                        "4502",     "EXPENSE",   0),
    ("Bank Charges",                       "G. Finance Charges",                         "4503",     "EXPENSE",   0),
    ("Interest Payable on Borrowings and Loans (Expense)","G. Finance Charges",         "5400-E",   "EXPENSE",   0),

    ("Travelling Expenses",                "H. Administrative Expenses",                 "4551",     "EXPENSE",   0),
    ("Auditors Remuneration",              "H. Administrative Expenses",                 "4552",     "EXPENSE",   0),
    ("Postage and Telephone",              "H. Administrative Expenses",                 "4553",     "EXPENSE",   0),
    ("Printing and Stationery",            "H. Administrative Expenses",                 "4554",     "EXPENSE",   0),
    ("Professional and other service charges","H. Administrative Expenses",               "4555",     "EXPENSE",   0),
    ("Office Expenses",                    "H. Administrative Expenses",                 "4556",     "EXPENSE",   0),
    ("Subscription and Periodicals",       "H. Administrative Expenses",                 "4557",     "EXPENSE",   0),
    ("Insurance Charges",                  "H. Administrative Expenses",                 "4558",     "EXPENSE",   0),
    ("Advertisement Expenses",             "H. Administrative Expenses",                 "4559",     "EXPENSE",   0),
    ("Other Expenses",                     "H. Administrative Expenses",                 "4560",     "EXPENSE",   0),
    ("Expenses Payable",                   "H. Administrative Expenses",                 "4561",     "EXPENSE",   0),
    ("Income Tax",                         "H. Administrative Expenses",                 "4563",     "EXPENSE",   0),
    ("Rent Deposits (Liability)",          "H. Administrative Expenses",                 "4564",     "LIABILITY", 0),

    # ----- VII. CAPITAL PAYMENTS -----
    ("Land",                               "A. Fixed Assets",                            "4601",     "ASSET",     0),
    ("Land Development",                   "A. Fixed Assets",                            "4602",     "ASSET",     0),
    ("Well and Tubewell",                  "A. Fixed Assets",                            "4603",     "ASSET",     0),
    ("Church Building",                    "A. Fixed Assets",                            "4604",     "ASSET",     0),
    ("Office Complex",                     "A. Fixed Assets",                            "4605",     "ASSET",     0),
    ("Dhyana Mandiram",                    "A. Fixed Assets",                            "4606",     "ASSET",     0),
    ("Kurushupalli building",              "A. Fixed Assets",                            "4607",     "ASSET",     0),
    ("Parish Hall building",               "A. Fixed Assets",                            "4608",     "ASSET",     0),
    ("Building of owned institutions",     "A. Fixed Assets",                            "4609",     "ASSET",     0),
    ("Compound wall",                      "A. Fixed Assets",                            "4610",     "ASSET",     0),
    ("Parsonage",                          "A. Fixed Assets",                            "4611",     "ASSET",     0),
    ("Kodimaram",                          "A. Fixed Assets",                            "4612",     "ASSET",     0),
    ("Commercial Building",                "A. Fixed Assets",                            "4613",     "ASSET",     0),
    ("Other Buildings",                    "A. Fixed Assets",                            "4614",     "ASSET",     0),
    ("Furniture and Fixtures",             "A. Fixed Assets",                            "4615",     "ASSET",     0),
    ("Church Equipments",                  "A. Fixed Assets",                            "4616",     "ASSET",     0),
    ("Other Equipments",                   "A. Fixed Assets",                            "4617",     "ASSET",     0),
    ("Motor Vehicles",                     "A. Fixed Assets",                            "4618",     "ASSET",     0),
    ("Ambulance",                          "A. Fixed Assets",                            "4619",     "ASSET",     0),
    ("Computer, Software and Peripherals", "A. Fixed Assets",                            "4620",     "ASSET",     0),
    ("Website",                            "A. Fixed Assets",                            "4621",     "ASSET",     0),
    ("Electrical Equipments",              "A. Fixed Assets",                            "4622",     "ASSET",     0),
    ("Machinery and equipments",           "A. Fixed Assets",                            "4623",     "ASSET",     0),
    ("Generator",                          "A. Fixed Assets",                            "4624",     "ASSET",     0),
    ("Sound System",                       "A. Fixed Assets",                            "4625",     "ASSET",     0),
    ("Books",                              "A. Fixed Assets",                            "4626",     "ASSET",     0),
    ("Building under Construction",        "A. Fixed Assets",                            "4627",     "ASSET",     0),

    ("Deposits/ Bonds",                    "B. Investments",                             "4701",     "ASSET",     0),
    ("Mutual Funds",                       "B. Investments",                             "4702",     "ASSET",     0),
    ("Investment of Endowment fund",       "B. Investments",                             "4703",     "ASSET",     0),
    ("Other investments",                  "B. Investments",                             "4704",     "ASSET",     0),

    ("Advance to spiritual organisations", "C. Loans and Advances",                      "4751",     "ASSET",     0),
    ("Advance for Land",                   "C. Loans and Advances",                      "4752",     "ASSET",     0),
    ("Advances to MOSC Institutions",      "C. Loans and Advances",                      "4753",     "ASSET",     0),
    ("Advance to Contractors",             "C. Loans and Advances",                      "4754",     "ASSET",     0),
    ("Other Advances",                     "C. Loans and Advances",                      "4755",     "ASSET",     0),

    ("Rent Deposits",                      "D. Security Deposits",                       "4801",     "ASSET",     0),
    ("Electricity Deposit",                "D. Security Deposits",                       "4802",     "ASSET",     0),
    ("Telephone Deposit",                  "D. Security Deposits",                       "4803",     "ASSET",     0),
    ("LPG Cylinder Deposit",               "D. Security Deposits",                       "4804",     "ASSET",     0),
    ("Other Security Deposits",            "D. Security Deposits",                       "4805",     "ASSET",     0),

    ("Loan from Banks",                    "E. Repayment of Borrowings and Loans",       "4851",     "LIABILITY", 0),
    ("Loan from Others (Other than Church Members)","E. Repayment of Borrowings and Loans","4852",    "LIABILITY", 0),
    ("Advance from Diocese (Inter accounts)","E. Repayment of Borrowings and Loans",     "4853",     "LIABILITY", 0),
    ("Outstanding Expenses",               "E. Repayment of Borrowings and Loans",       "4854",     "LIABILITY", 0),
    ("Advances from others",               "E. Repayment of Borrowings and Loans",       "4855",     "LIABILITY", 0),
    ("Deposits/Bonds",                     "E. Repayment of Borrowings and Loans",       "4856",     "LIABILITY", 0),
    ("Loan from Church Members",           "E. Repayment of Borrowings and Loans",       "4857",     "LIABILITY", 0),

    ("Payment of TDS collected",           "F. Taxes and Penalty (Payments)",            "4901",     "LIABILITY", 0),
    ("Tax Deducted at Source (TDS)",       "F. Taxes and Penalty (Payments)",            "4902",     "LIABILITY", 0),
    ("GST Paid",                           "F. Taxes and Penalty (Payments)",            "4903",     "LIABILITY", 0),

    ("Payment of Sundries Payable",        "G. Payment of Sundries Payable",             "4940",     "LIABILITY", 0),
    ("Payment from Endowment Fund",        "H. Payment from Endowment Fund",             "4950",     "LIABILITY", 0),
    ("Other Capital Payments",             "I. Other Capital Payments",                  "4955",     "LIABILITY", 0),

    # NOTE: no ledgers under "VIII. Closing Balances".
    # Closing is DERIVED from 1000..1300 in the report layer.

    # ----- BALANCE SHEET — LIABILITIES -----
    ("Balance as per last Balance Sheet",  "A. Capital Fund",                            "5001",     "EQUITY",    0),
    ("General Capital Fund Additions",     "A. Capital Fund",                            "3550",     "EQUITY",    0),

    ("Balance as per last Balance sheet",  "B. Corpus Donations",                        "5101",     "EQUITY",    0),

    ("General Reserve",                    "C. Reserve Fund",                            "5151",     "EQUITY",    0),
    ("Other Reserves",                     "C. Reserve Fund",                            "5152",     "EQUITY",    0),
    ("Income & Expenditure Account",       "C. Reserve Fund",                            "5153",     "EQUITY",    0),

    ("Endowment Fund",                     "D. Endowment Fund",                          "5200",     "LIABILITY", 0),

    ("Loan from Banks (BS)",               "E. Borrowings, Loans and Advances",          "5301",     "LIABILITY", 0),
    ("Loan from Others (Other than Church Members) (BS)","E. Borrowings, Loans and Advances","5302",  "LIABILITY", 0),
    ("Loans From Church Members (BS)",     "E. Borrowings, Loans and Advances",          "5303",     "LIABILITY", 0),
    ("Advances from MOSC Institutions",    "E. Borrowings, Loans and Advances",          "5305",     "LIABILITY", 0),
    ("Advances from Others (BS)",          "E. Borrowings, Loans and Advances",          "5306",     "LIABILITY", 0),
    ("Catholicate Day Collection Advances","E. Borrowings, Loans and Advances",          "5307",     "LIABILITY", 0),
    ("Subscription Received in Advance",   "E. Borrowings, Loans and Advances",          "2214-BS",  "LIABILITY", 0),
    ("Rent Deposits (BS)",                 "E. Borrowings, Loans and Advances",          "4564-BS",  "LIABILITY", 0),

    ("Interest Payable on Borrowings and Loans","F. Interest Payable on Borrowings and Loans","5400", "LIABILITY", 0),

    ("Auditors Remuneration Payable",      "G. Creditors and Expenses Payable",          "4552-P",   "LIABILITY", 0),
    ("Sundry Creditors",                   "G. Creditors and Expenses Payable",          "4553-P",   "LIABILITY", 0),
    ("Other Expenses Payable",             "G. Creditors and Expenses Payable",          "4562",     "LIABILITY", 0),

    ("GST Payable",                        "H. Sundries Payable",                        "5451",     "LIABILITY", 0),
    ("TDS Payable",                        "H. Sundries Payable",                        "5452",     "LIABILITY", 0),
    ("Against Malankara Metropolitan Payments","H. Sundries Payable",                     "5461",     "LIABILITY", 0),
    ("Against Diocession Office Payments", "H. Sundries Payable",                        "5462",     "LIABILITY", 0),
    ("Against Other MOSC Office Payments", "H. Sundries Payable",                        "5463",     "LIABILITY", 0),

    # ----- BALANCE SHEET — ASSETS -----
    ("Fixed Assets (Schedule A)",          "I. Fixed Assets",                            "5600",     "ASSET",     0),

    ("Bonds/ Mutual Funds",                "J. Investments",                             "5701",     "ASSET",     0),
    ("Other investments",                  "J. Investments",                             "5702",     "ASSET",     0),

    ("Advance to Spiritual Organisations", "K. Loans and Advances (Assets)",             "5751",     "ASSET",     0),
    ("Advance for Land",                   "K. Loans and Advances (Assets)",             "5752",     "ASSET",     0),
    ("Advances to MOSC Institutions",      "K. Loans and Advances (Assets)",             "5753",     "ASSET",     0),
    ("Advance to Contractors",             "K. Loans and Advances (Assets)",             "5754",     "ASSET",     0),
    ("Other Advances",                     "K. Loans and Advances (Assets)",             "5755",     "ASSET",     0),

    ("Rent Deposits",                      "L. Security Deposits (Assets)",              "5801",     "ASSET",     0),
    ("Electricity Deposit",                "L. Security Deposits (Assets)",              "5802",     "ASSET",     0),
    ("Telephone Deposit",                  "L. Security Deposits (Assets)",              "5803",     "ASSET",     0),
    ("LPG cylinder Deposit",               "L. Security Deposits (Assets)",              "5804",     "ASSET",     0),
    ("Other Security Deposits",            "L. Security Deposits (Assets)",              "5805",     "ASSET",     0),

    ("Income receivable on investments",   "M. Income Accrued on Investments and Deposits","5821",    "ASSET",     0),
    ("Interest receivable on advances",    "M. Income Accrued on Investments and Deposits","5822",    "ASSET",     0),
    ("Interest receivable on deposits",    "M. Income Accrued on Investments and Deposits","5823",    "ASSET",     0),

    ("Refund of Taxes",                    "N. Receivables",                             "5901",     "ASSET",     0),
    ("TDS/TCS for Current Year",           "N. Receivables",                             "5902",     "ASSET",     0),
    ("TDS/TCS of Previous Years",          "N. Receivables",                             "5903",     "ASSET",     0),
    ("Monthly Subscription Receivable",    "N. Receivables",                             "2215",     "ASSET",     0),
    ("Sundry Receivables",                 "N. Receivables",                             "5904",     "ASSET",     0),
    ("Cover Collections Receivable",       "N. Receivables",                             "5905",     "ASSET",     0),

    ("Stock",                              "O. Stock",                                   "5950",     "ASSET",     0),

    # Cash/Bank under BS "P." — same four ledgers, same codes,
    # same instances as the opening ones. No duplicates.
    # The Balance Sheet view looks them up by group P.
]


# ============================================================
# SEEDER
# ============================================================

def _code_to_int(code):
    """Convert '2101' or '2000-A' style codes to an integer (or None)."""
    if not code:
        return None
    digits = "".join(c for c in str(code) if c.isdigit())
    try:
        return int(digits) if digits else None
    except ValueError:
        return None


def seed_default_accounts(church, verbose=False):
    """
    Idempotently seed the full MOSC chart of accounts for a church.

    - Groups matched by (church, group_name)
    - Ledgers matched by (church, ledger_name)
    - reserved = True on all seeded rows
    - ledger_nature is set on every ledger
    - transaction.atomic — partial failures roll back
    """
    from django.db import transaction
    from .models import AccountGroupMaster, AccountLedgerMaster

    stats = {
        "groups_created": 0,
        "groups_existing": 0,
        "ledgers_created": 0,
        "ledgers_existing": 0,
    }

    with transaction.atomic():

        # ---------- GROUPS ----------
        groups = {}

        for name, parent_name, code in DEFAULT_GROUPS:
            parent = groups.get(parent_name) if parent_name else None

            group, created = AccountGroupMaster.objects.get_or_create(
                church=church,
                group_name=name,
                defaults={
                    "under_group": parent,
                    "account_code": _code_to_int(code),
                    "reserved": True,
                    "status": True,
                },
            )

            if not created:
                expected_parent_id = parent.id if parent else None
                if group.under_group_id != expected_parent_id:
                    group.under_group = parent
                    group.reserved = True
                    group.save(update_fields=["under_group", "reserved"])

            groups[name] = group
            stats["groups_created" if created else "groups_existing"] += 1

            if created and verbose:
                print(f"  + Group: {name}")

        # ---------- LEDGERS ----------
        for ledger_name, group_name, code, nature, opening in DEFAULT_LEDGERS:
            group = groups.get(group_name)

            if not group:
                if verbose:
                    print(f"  ! Skipped '{ledger_name}' — group '{group_name}' missing")
                continue

            ledger, created = AccountLedgerMaster.objects.get_or_create(
                church=church,
                ledger_name=ledger_name,
                defaults={
                    "account_group": group,
                    "ledger_code": _code_to_int(code),
                    "ledger_nature": nature,
                    "op_balance": opening,
                    "reserved": True,
                    "status": True,
                },
            )

            if not created:
                changed = False
                if not ledger.reserved:
                    ledger.reserved = True
                    changed = True
                if ledger.ledger_nature != nature:
                    ledger.ledger_nature = nature
                    changed = True
                if changed:
                    ledger.save(update_fields=["reserved", "ledger_nature"])

            stats["ledgers_created" if created else "ledgers_existing"] += 1

            if created and verbose:
                print(f"  + Ledger: {ledger_name} → {group_name} ({nature})")

    return stats


def seed_all_churches(verbose=False):
    """Seed every church in the system."""
    from .models import Church

    total = {
        "churches": 0,
        "groups_created": 0,
        "groups_existing": 0,
        "ledgers_created": 0,
        "ledgers_existing": 0,
    }

    for church in Church.objects.all():
        if verbose:
            print(f"\nSeeding church: {church.name} (#{church.id})")

        stats = seed_default_accounts(church, verbose=verbose)

        total["churches"] += 1
        for k in (
            "groups_created",
            "groups_existing",
            "ledgers_created",
            "ledgers_existing",
        ):
            total[k] += stats[k]

    return total


# ============================================================
# DEFAULT DESIGNATIONS
# ============================================================

DEFAULT_DESIGNATIONS = [
    "President",          # ✅ Changed from Vicar
    "Vice President",     # ✅ Changed from Assistant Vicar
    "Secretary",
    "Joint Secretary",
    "Treasurer",
    "Trustee",
    "Lay Leader",
    "Accountant",
    "Committee Member",
]

def seed_default_designations(church):
    """
    Seed the default designations for a church.
    Marked reserved=True so they cannot be edited or deleted.
    """
    from .models import Designation
    for name in DEFAULT_DESIGNATIONS:
        Designation.objects.get_or_create(
            church=church,
            designation_name=name,
            defaults={"reserved": True},
        )