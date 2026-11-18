from pathlib import Path

path = Path("registry/views.py")
source = path.read_text(encoding="utf-8")

old = '''        return rows

    def _ledger_amount('''

new = '''            # Close the completed group after calculating its subtotal.
            # Keep its parent groups active for subsequent sibling rows.
            if is_subtotal_row:
                active_groups = [
                    group for group in active_groups
                    if group["depth"] < depth
                ]

        return rows

    def _ledger_amount('''

count = source.count(old)

if count != 1:
    raise RuntimeError(
        f"Expected one _build_side ending, found {count}. No file changed."
    )

path.write_text(source.replace(old, new, 1), encoding="utf-8")
print("Subtotal group-stack correction applied.")
