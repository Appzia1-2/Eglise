"""
One-time cleanup: remove duplicate "Balance in *" and "Cash in Hand"
ledgers from the "P. Cash and Bank Balances" group.

Handles:
  * Active churches
  * Soft-deleted churches (is_deleted=True) — these can still have
    ledgers and entries that pollute global queries
  * MULTIPLE duplicates per name per church (the old version only
    deleted the first one via .first())

Safely skips any ledger that has entries — deleting those would
lose data and requires manual review.

Run:
    python manage.py cleanup_duplicate_ledgers --dry-run
    python manage.py cleanup_duplicate_ledgers
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from registry.models import (
    AccountGroupMaster, AccountLedgerMaster, LedgerEntry, Church,
)


DUPLICATE_NAMES = [
    "Balance in Savings Account",
    "Balance in Deposit Account",
    "Balance in Other Accounts",
    "Cash in Hand",
]


class Command(BaseCommand):
    help = "Remove unused duplicate ledgers from P. Cash and Bank Balances group"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )

    def handle(self, *args, **opts):
        dry_run = opts["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — nothing will be deleted"))
            self.stdout.write("")

        removed = 0
        skipped = 0
        churches_touched = set()

        # Include soft-deleted churches — their ledgers still exist
        # and can pollute global queries.
        for church in Church.objects.all().order_by("name"):
            p_group = AccountGroupMaster.objects.filter(
                church=church,
                group_name="P. Cash and Bank Balances",
            ).first()

            if not p_group:
                continue

            for name in DUPLICATE_NAMES:
                # Get ALL duplicates for this name (not just the first)
                duplicates = AccountLedgerMaster.objects.filter(
                    church=church,
                    ledger_name=name,
                    account_group=p_group,
                ).order_by("id")

                for duplicate in duplicates:
                    entry_count = LedgerEntry.objects.filter(ledger=duplicate).count()

                    if entry_count > 0:
                        self.stdout.write(self.style.WARNING(
                            f"  [SKIP] {church.name} / {name} "
                            f"(pk={duplicate.id}) — {entry_count} entries exist"
                        ))
                        skipped += 1
                        continue

                    if dry_run:
                        self.stdout.write(
                            f"  [WOULD DELETE] {church.name} / {name} "
                            f"(pk={duplicate.id})"
                        )
                    else:
                        saved_pk = duplicate.id  # capture before delete
                        with transaction.atomic():
                            duplicate.delete()
                        self.stdout.write(self.style.SUCCESS(
                            f"  [DELETED] {church.name} / {name} "
                            f"(pk was {saved_pk})"
                        ))

                    removed += 1
                    churches_touched.add(church.name)

        self.stdout.write("")
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"DRY RUN DONE. Would remove {removed} duplicate(s) across "
                f"{len(churches_touched)} church(es). {skipped} skipped."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"DONE. Removed {removed} duplicate(s) across "
                f"{len(churches_touched)} church(es). {skipped} skipped."
            ))