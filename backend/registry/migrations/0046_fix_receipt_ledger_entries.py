# registry/migrations/0046_fix_receipt_ledger_entries.py

from django.db import migrations


def fix_receipt_entries(apps, schema_editor):
    """
    One-time fix for receipts posted with the old buggy logic
    (income side was DEBIT; should be CREDIT).

    Flips every receipt-linked LedgerEntry that is NOT on the
    Cash / Bank ledger. Reversal rows are included because they
    mirror the original. Cash / Bank entries are skipped — their
    side was already correct (DEBIT for receipts).
    """
    LedgerEntry = apps.get_model("registry", "LedgerEntry")
    Church = apps.get_model("registry", "Church")
    AccountLedgerMaster = apps.get_model(
        "registry", "AccountLedgerMaster"
    )

    for church in Church.objects.all():
        skip_ids = list(
            AccountLedgerMaster.objects.filter(
                church=church,
                ledger_name__in=[
                    "Cash in Hand",
                    "Balance in Savings Account",
                ],
            ).values_list("id", flat=True)
        )

        qs = (
            LedgerEntry.objects
            .filter(
                church=church,
                receipt__isnull=False,
            )
            .exclude(ledger_id__in=skip_ids)
        )

        for entry in qs.iterator():
            entry.entry_type = (
                "CREDIT" if entry.entry_type == "DEBIT" else "DEBIT"
            )
            entry.save(update_fields=["entry_type"])


def noop(apps, schema_editor):
    """
    Not reversible — flipping back would restore the broken state.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("registry", "0045_designation_reserved"),
    ]

    operations = [
        migrations.RunPython(fix_receipt_entries, noop),
    ]