# registry/utils.py - Fixed version

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging
import random
import string

logger = logging.getLogger(__name__)

def send_church_credentials(church, password, user):
    """
    Send login credentials to the church via email
    """
    try:
        subject = f"Welcome {church.name} - Church Management Login Credentials"
        
        # 🔥 FIX: Use FRONTEND_LOGIN_URL from settings
        frontend_login_url = getattr(settings, 'FRONTEND_LOGIN_URL', 'http://localhost:3000/login')
        
        # HTML email content
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #ae2050, #8a1a3e);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .content {{
                    background-color: #ffffff;
                    padding: 30px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                    border-radius: 0 0 10px 10px;
                }}
                .credentials {{
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #ae2050;
                }}
                .credential-row {{
                    display: flex;
                    padding: 8px 0;
                    border-bottom: 1px solid #dee2e6;
                }}
                .credential-row:last-child {{
                    border-bottom: none;
                }}
                .label {{
                    font-weight: bold;
                    color: #ae2050;
                    width: 120px;
                    flex-shrink: 0;
                }}
                .value {{
                    color: #333;
                    font-family: monospace;
                    font-size: 14px;
                }}
                .button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #ae2050, #8a1a3e);
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 15px 0;
                    font-weight: bold;
                }}
                .button:hover {{
                    background: #8a1a3e;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    font-size: 12px;
                    color: #999;
                    text-align: center;
                }}
                .warning {{
                    background-color: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 12px;
                    border-radius: 6px;
                    margin: 15px 0;
                    color: #856404;
                }}
                .church-details {{
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 15px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏛️ Welcome to {church.name}</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Your Church Management Portal</p>
            </div>
            
            <div class="content">
                <h2>Dear Church Administrator,</h2>
                
                <p>Your church <strong>"{church.name}"</strong> has been successfully registered and activated in the Church Management System.</p>
                
                <div class="credentials">
                    <h3 style="margin-top: 0; color: #ae2050;">🔑 Login Credentials</h3>
                    <div class="credential-row">
                        <span class="label">📧 Username:</span>
                        <span class="value">{user.username}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">🔒 Password:</span>
                        <span class="value">{password}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">📧 Email:</span>
                        <span class="value">{church.email}</span>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <a href="{frontend_login_url}" class="button">
                        🚀 Login to Dashboard
                    </a>
                </div>
                
                <div class="warning">
                    ⚠️ <strong>Important:</strong> For security reasons, please change your password immediately after your first login.
                </div>
                
                <div class="church-details">
                    <h3 style="margin-top: 0; color: #ae2050;">📋 Church Details</h3>
                    <p><strong>Name:</strong> {church.name}</p>
                    <p><strong>Email:</strong> {church.email}</p>
                    <p><strong>Phone:</strong> {church.phone_number or 'Not provided'}</p>
                    <p><strong>Address:</strong> {church.get_full_address() or 'Not provided'}</p>
                    <p><strong>Diocese:</strong> {church.diocese.name if church.diocese else 'Not assigned'}</p>
                    <p><strong>Code:</strong> {church.code or 'Not assigned'}</p>
                </div>
                
                <div class="footer">
                    <p>This is an automated message from the Church Management System.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p style="margin-top: 10px; color: #ae2050; font-weight: bold;">© {church.created_at.year if church.created_at else '2026'} Church Management System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version (fallback)
        plain_message = f"""
        Welcome to {church.name}!
        
        Dear Church Administrator,
        
        Your church "{church.name}" has been successfully registered and activated.
        
        Login Credentials:
        -------------------
        Username: {user.username}
        Password: {password}
        Email: {church.email}
        
        Login URL: {frontend_login_url}
        
        Church Details:
        --------------
        Name: {church.name}
        Email: {church.email}
        Phone: {church.phone_number or 'Not provided'}
        Address: {church.get_full_address() or 'Not provided'}
        Diocese: {church.diocese.name if church.diocese else 'Not assigned'}
        Code: {church.code or 'Not assigned'}
        
        ⚠️ Important: For security reasons, please change your password immediately after your first login.
        
        This is an automated message from the Church Management System.
        """
        
        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[church.email],
            fail_silently=False,
            html_message=html_message,
        )
        
        logger.info(f"✅ Credentials sent successfully to {church.email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send credentials to {church.email}: {str(e)}")
        return False


def generate_random_password():
    """
    Generate a secure random password
    """
    # Use a mix of letters, digits, and special characters
    length = 12
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(random.choice(characters) for _ in range(length))
    
    # Ensure password has at least one of each type
    if not any(c.isupper() for c in password):
        password = password[:-1] + random.choice(string.ascii_uppercase)
    if not any(c.islower() for c in password):
        password = password[:-1] + random.choice(string.ascii_lowercase)
    if not any(c.isdigit() for c in password):
        password = password[:-1] + random.choice(string.digits)
    if not any(c in "!@#$%^&*" for c in password):
        password = password[:-1] + random.choice("!@#$%^&*")
    
    return password


# ============ DEFAULT RELATIONSHIPS ============
DEFAULT_RELATIONSHIPS = [
    "Father", "Mother", "Husband", "Wife", "Son", "Daughter",
    "Brother", "Sister", "Son In Law", "Daughter In Law",
]

def seed_default_relationships(church):
    """Seed default relationships for a church"""
    from .models import Relationship
    for name in DEFAULT_RELATIONSHIPS:
        Relationship.objects.get_or_create(church=church, name=name)