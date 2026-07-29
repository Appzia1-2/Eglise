from .models import Relationship

DEFAULT_RELATIONSHIPS = [
    "Father", "Mother", "Husband", "Wife", "Son", "Daughter",
    "Brother", "Sister", "Son In Law", "Daughter In Law",
]

def seed_default_relationships(church):
    for name in DEFAULT_RELATIONSHIPS:
        Relationship.objects.get_or_create(church=church, name=name)