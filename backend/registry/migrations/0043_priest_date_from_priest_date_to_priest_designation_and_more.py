import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('registry', '0042_alter_member_marital_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='priest',
            name='date_from',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='priest',
            name='date_to',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='priest',
            name='designation',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='registry.designation'),
        ),
        migrations.AddField(
            model_name='priest',
            name='priest_type',
            field=models.CharField(choices=[('MAIN', 'Main Priest'), ('ASSISTANT', 'Assistant Priest')], default='ASSISTANT', max_length=20),
        ),
        migrations.DeleteModel(
            name='PriestChange',
        ),
    ]