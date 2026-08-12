"""
Innovix Backend — Mock Email Service

Because no SMTP server is configured yet, this service intercepts outgoing emails
and prints them to the terminal.
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import resend
from app.core.config import settings

logger = logging.getLogger(__name__)

if settings.resend_api_key:
    resend.api_key = settings.resend_api_key

# ANSI Colors
GREEN = '\033[92m'
CYAN = '\033[96m'
MAGENTA = '\033[95m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
BOLD = '\033[1m'
RESET = '\033[0m'

async def send_project_invitation(to_email: str, inviter_name: str, project_title: str, role: str, invite_url: str):
    """
    Mocks sending a project invitation email.
    """
    
    email_ui = f"""
{GREEN}========================================================================={RESET}
{BOLD}📧 OUTGOING MOCK EMAIL{RESET}
{CYAN}To:{RESET} {to_email}
{CYAN}Subject:{RESET} You have been invited to collaborate!

{BOLD}{CYAN}{inviter_name}{RESET} has invited you to join the project:
{BOLD}{MAGENTA}{project_title}{RESET}

You will be joining as a(n) {BOLD}{YELLOW}{role.upper()}{RESET}.

Click the magic link below to accept the invitation and access the project workspace:
{BOLD}{BLUE}{invite_url}{RESET}

If you don't have an account yet, you will be prompted to create one.
{GREEN}========================================================================={RESET}
    """
    
    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-bottom: 24px;">You have been invited to collaborate!</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            <strong>{inviter_name}</strong> has invited you to join the project:<br/>
            <span style="color: #6366f1; font-size: 18px; font-weight: bold;">{project_title}</span>
        </p>
        
        <p style="color: #475569; font-size: 16px;">
            You will be joining as an <strong>{role.upper()}</strong>.
        </p>
        
        <div style="margin: 32px 0;">
            <a href="{invite_url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accept Invitation
            </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px;">
            If you don't have an account yet, you will be prompted to create one.<br/>
            If you're having trouble clicking the button, copy and paste this link into your browser:<br/>
            <a href="{invite_url}" style="color: #4f46e5;">{invite_url}</a>
        </p>
    </div>
    """

    if settings.smtp_email and settings.smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"You're invited to join {project_title} on Innovix"
            msg["From"] = f"Innovix <{settings.smtp_email}>"
            msg["To"] = to_email
            
            # Attach HTML content
            part = MIMEText(html_body, "html")
            msg.attach(part)
            
            # Connect to Gmail SMTP server
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(settings.smtp_email, settings.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"SMTP email sent successfully to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
            print(email_ui)
    elif settings.resend_api_key:
        try:
            r = resend.Emails.send({
                "from": settings.resend_from_email,
                "to": to_email,
                "subject": f"You're invited to join {project_title} on Innovix",
                "html": html_body
            })
            logger.info(f"Resend email sent successfully to {to_email}: {r}")
        except Exception as e:
            logger.error(f"Failed to send email via Resend: {e}")
            # Fallback to printing in terminal if Resend fails
            print(email_ui)
    else:
        # Mock Email Service
        print(email_ui)
        logger.info(f"Mock email sent to {to_email} with invite URL: {invite_url}")
