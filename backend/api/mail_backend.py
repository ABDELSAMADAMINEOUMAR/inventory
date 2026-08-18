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

class BrevoEmailBackend(BaseEmailBackend):
    """
    A custom email backend that sends emails via the Brevo (Sendinblue) HTTP API.
    Bypasses standard SMTP to avoid Render's port restrictions.
    """
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
            
        import os
        import requests
        
        brevo_api_key = os.getenv('BREVO_API_KEY')
        if not brevo_api_key:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("BREVO_API_KEY is not set. Emails will not be sent.")
            return 0
            
        sent_count = 0
        
        for message in email_messages:
            from_email = message.from_email
            if 'webmaster@localhost' in from_email or not from_email:
                # Provide a sensible default if none is set, or rely on the user's verified sender
                from_email = 'noreply@smartims.local'
                
            try:
                html_body = None
                text_body = message.body
                
                if hasattr(message, 'alternatives') and message.alternatives:
                    for alt in message.alternatives:
                        if alt[1] == 'text/html':
                            html_body = alt[0]
                            break
                
                payload = {
                    "sender": {"email": from_email, "name": "SmartIMS"},
                    "to": [{"email": to_addr} for to_addr in message.to],
                    "subject": message.subject,
                }
                
                if html_body:
                    payload["htmlContent"] = html_body
                if text_body:
                    payload["textContent"] = text_body
                    
                headers = {
                    "accept": "application/json",
                    "api-key": brevo_api_key,
                    "content-type": "application/json"
                }
                
                response = requests.post(
                    "https://api.brevo.com/v3/smtp/email",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code in [200, 201, 202]:
                    sent_count += 1
                else:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to send email via Brevo API: {response.status_code} {response.text}")
                    if not self.fail_silently:
                        raise Exception(f"Brevo API Error: {response.text}")
                        
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Exception sending email via Brevo API: {e}")
                if not self.fail_silently:
                    raise
                    
        return sent_count
