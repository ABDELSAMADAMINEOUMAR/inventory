import os
import json
import gzip
from datetime import datetime, timedelta
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.serializers import serialize
from django.conf import settings
from api.models import (
    Company, User, Category, Supplier, Product,
    ProductExpense, Sale, BusinessExpense, InventoryEntry
)

class Command(BaseCommand):
    help = 'Export full database snapshot to timestamped JSON archive with automated pruning/retention'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep',
            type=int,
            default=14,
            help='Number of days of backup archives to keep before pruning (default: 14)'
        )
        parser.add_argument(
            '--compress',
            action='store_true',
            help='Compress backup file using gzip'
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default=None,
            help='Custom output directory for backups (default: backend/backups)'
        )

    def handle(self, *args, **options):
        keep_days = options['keep']
        compress = options['compress']
        output_dir_arg = options['output_dir']

        if output_dir_arg:
            backup_dir = Path(output_dir_arg)
        else:
            backup_dir = Path(settings.BASE_DIR) / 'backups'

        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        ext = 'json.gz' if compress else 'json'
        backup_filename = f"sims_backup_{timestamp}.{ext}"
        backup_filepath = backup_dir / backup_filename

        self.stdout.write(f"Starting database export to {backup_filepath}...")

        models_to_backup = [
            Company, User, Category, Supplier, Product,
            ProductExpense, Sale, BusinessExpense, InventoryEntry
        ]

        backup_data = {}
        total_records = 0

        for model in models_to_backup:
            model_name = model._meta.object_name
            queryset = model.objects.all()
            count = queryset.count()
            total_records += count
            
            # Use Django serializer to convert model instances to dict/json format
            raw_json = serialize('json', queryset, use_natural_foreign_keys=True)
            backup_data[model_name] = json.loads(raw_json)
            self.stdout.write(f"  - Exported {count} records from {model_name}")

        meta_info = {
            'timestamp': timestamp,
            'total_records': total_records,
            'models': list(backup_data.keys()),
            'version': '1.0'
        }
        full_payload = {
            'meta': meta_info,
            'data': backup_data
        }

        json_str = json.dumps(full_payload, indent=2, ensure_ascii=False)

        if compress:
            with gzip.open(backup_filepath, 'wt', encoding='utf-8') as f:
                f.write(json_str)
        else:
            with open(backup_filepath, 'w', encoding='utf-8') as f:
                f.write(json_str)

        self.stdout.write(self.style.SUCCESS(f"Successfully created backup: {backup_filename} ({total_records} total records)"))

        # Automated Pruning / Retention Management
        if keep_days > 0:
            self.stdout.write(f"Checking for expired backups older than {keep_days} days...")
            cutoff_date = datetime.now() - timedelta(days=keep_days)
            pruned_count = 0

            for f_path in backup_dir.glob('sims_backup_*.json*'):
                try:
                    file_mtime = datetime.fromtimestamp(f_path.stat().st_mtime)
                    if file_mtime < cutoff_date:
                        f_path.unlink()
                        pruned_count += 1
                        self.stdout.write(f"  - Pruned expired backup: {f_path.name}")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Could not prune {f_path.name}: {e}"))

            if pruned_count > 0:
                self.stdout.write(self.style.SUCCESS(f"Pruned {pruned_count} old backup files."))
            else:
                self.stdout.write("No expired backups needed pruning.")
