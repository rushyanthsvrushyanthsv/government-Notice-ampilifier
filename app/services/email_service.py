from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import settings

class EmailService:
    def __init__(self):
        self.sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = settings.FROM_EMAIL

    def _get_base_template(self, content: str, title: str) -> str:
        return f"""
        <html>
            <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #1e293b; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px;">GOV NOTICE SIMPLIFIER</h1>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #1e40af;">{title}</h2>
                        {content}
                    </div>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
                        &copy; 2026 Gov Notice Simplifier. All rights reserved.
                    </div>
                </div>
            </body>
        </html>
        """

    async def send_welcome_email(self, user_email: str, user_name: str):
        content = f"""
        <p>Hi {user_name},</p>
        <p>Welcome to Government Notice Simplifier! We're glad to have you on board.</p>
        <p>Start by uploading your first notice to get a simplified summary and action items.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://govnotice.in/upload" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Upload Now</a>
        </div>
        """
        message = Mail(
            from_email=self.from_email,
            to_emails=user_email,
            subject="Welcome to Government Notice Simplifier",
            html_content=self._get_base_template(content, "Welcome!")
        )
        try:
            self.sg.send(message)
        except Exception as e:
            print(f"SendGrid Error: {e}")

    async def send_deadline_reminder(self, user_email: str, deadline_title: str, days_left: int):
        urgent = "🚨 URGENT" if days_left <= 1 else "⚠️ REMINDER"
        content = f"""
        <p>This is a reminder for your upcoming deadline:</p>
        <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; font-size: 18px;">{deadline_title}</p>
            <p style="margin: 5px 0 0 0; color: #9a3412;">Due in {days_left} day(s)</p>
        </div>
        <p>Please log in to check your action items and complete any required steps.</p>
        """
        message = Mail(
            from_email=self.from_email,
            to_emails=user_email,
            subject=f"{urgent}: Deadline in {days_left} days",
            html_content=self._get_base_template(content, "Deadline Reminder")
        )
        self.sg.send(message)

email_service = EmailService()
