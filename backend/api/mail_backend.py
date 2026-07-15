import sys
from django.core.mail.backends.base import BaseEmailBackend

class CleanConsoleEmailBackend(BaseEmailBackend):
    """
    A custom console email backend for local/dev testing that prints the clean, raw,
    unwrapped message body to stdout without MIME Quoted-Printable encoding (=3D)
    or 78-character line wrapping (&=).
    """
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        for message in email_messages:
            sys.stdout.write("\n" + "="*72 + "\n")
            sys.stdout.write(f"EMAIL SUBJECT: {message.subject}\n")
            sys.stdout.write(f"EMAIL TO:      {', '.join(message.to)}\n")
            sys.stdout.write("-" * 72 + "\n")
            # Print clean raw body without MIME Quoted-Printable or line breaks
            sys.stdout.write(f"{message.body}\n")
            sys.stdout.write("="*72 + "\n\n")
            sys.stdout.flush()
        return len(email_messages)
