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

class ResendEmailBackend(BaseEmailBackend):
    """
    A custom email backend that sends emails via the Resend HTTP API.
    Bypasses standard SMTP to avoid Render's port restrictions.
    """
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
            
        import os
        import resend
        
        resend_api_key = os.getenv('RESEND_API_KEY')
        if not resend_api_key:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("RESEND_API_KEY is not set. Emails will not be sent.")
            return 0
            
        resend.api_key = resend_api_key
        sent_count = 0
        
        for message in email_messages:
            # Force onboarding@resend.dev for test mode since domain is not verified
            from_email = 'onboarding@resend.dev'
                
            try:
                # Handle text vs html
                html_body = None
                text_body = message.body
                
                if hasattr(message, 'alternatives') and message.alternatives:
                    for alt in message.alternatives:
                        if alt[1] == 'text/html':
                            html_body = alt[0]
                            break
                            
                # If no html provided but there is text, wrap text in simple tags for better formatting or leave as text.
                # Resend accepts 'text' and/or 'html'
                params = {
                    "from": from_email,
                    "to": message.to,
                    "subject": message.subject,
                }
                
                if html_body:
                    params["html"] = html_body
                if text_body:
                    params["text"] = text_body
                    
                resend.Emails.send(params)
                sent_count += 1
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send email via Resend API: {e}")
                if not self.fail_silently:
                    raise
                    
        return sent_count
