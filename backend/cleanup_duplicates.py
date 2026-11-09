# cleanup_duplicates.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "parish_management.settings")
django.setup()

from django.db.models import Count
from registry.models import AccountLedgerMaster

# 1. Find all duplicates
duplicates = (
    AccountLedgerMaster.objects
    .values('church_id', 'ledger_name')
    .annotate(count=Count('id'))
    .filter(count__gt=1)
)

print(f"Found {len(duplicates)} duplicate sets to process...\n")
total_deleted = 0
total_skipped = 0

for d in duplicates:
    # 2. Get all ledgers with this name in this church
    ledgers = list(AccountLedgerMaster.objects.filter(
        church_id=d['church_id'],
        ledger_name=d['ledger_name']
    ).order_by('id'))
    
    # 3. Figure out which one to KEEP
    # We keep the one with the most transactions. 
    # If they all have 0, we just keep the oldest one.
    keep_ledger = None
    highest_entries = -1
    
    for led in ledgers:
        # Count active transactions
        entry_count = led.entries.filter(is_cancelled=False, is_reversal=False).count()
        if entry_count > highest_entries:
            highest_entries = entry_count
            keep_ledger = led

    # 4. Delete the rest
    for led in ledgers:
        if led.id == keep_ledger.id:
            continue
            
        # Check if this duplicate has entries
        entries = led.entries.filter(is_cancelled=False, is_reversal=False).count()
        
        if entries > 0:
            print(f"⚠️ SKIPPED: {led.church.name} | '{led.ledger_name}' (ID {led.id}) has {entries} entries. Cannot delete.")
            total_skipped += 1
        else:
            # No entries, safe to delete
            led.delete()
            total_deleted += 1

print("\n------------------------------------------------")
print(f"Cleanup complete.")
print(f"Deleted: {total_deleted} empty duplicate ledgers.")
print(f"Skipped: {total_skipped} duplicates because they contained financial transactions.")
print("------------------------------------------------")