from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Sale, Product, ProductExpense, BusinessExpense, InventoryEntry, AuditLog, User

def get_actor(instance):
    if hasattr(instance, 'user_id') and instance.user_id:
        return User.objects.filter(id=instance.user_id).first()
    return None

def log_action(instance, action):
    actor = get_actor(instance)
    target_type = instance.__class__.__name__
    
    if target_type == 'Sale':
        target_id = f"Sale #{instance.id} (Product: {instance.product.name if instance.product else 'Unknown'})"
    elif target_type == 'Product':
        target_id = f"{instance.code} - {instance.name}"
    else:
        target_id = str(getattr(instance, 'id', 'unknown'))

    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=target_id
    )

@receiver(post_save, sender=Sale)
@receiver(post_save, sender=Product)
@receiver(post_save, sender=ProductExpense)
@receiver(post_save, sender=BusinessExpense)
@receiver(post_save, sender=InventoryEntry)
def audit_post_save(sender, instance, created, **kwargs):
    action = 'CREATED' if created else 'UPDATED'
    log_action(instance, action)

@receiver(post_delete, sender=Sale)
@receiver(post_delete, sender=Product)
@receiver(post_delete, sender=ProductExpense)
@receiver(post_delete, sender=BusinessExpense)
@receiver(post_delete, sender=InventoryEntry)
def audit_post_delete(sender, instance, **kwargs):
    log_action(instance, 'DELETED')
