from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'gembot-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 7  # 7 days

# CoinConnect API Config
COINCONNECT_CREATE_USER = "https://cca.neuralaitraders.com/create_user_account/"
COINCONNECT_BALANCE = "https://api.coinconnect.tech/get_account_balance/"
COINCONNECT_WITHDRAW = "https://api.coinconnect.tech/withdraw/"

app = FastAPI(title="GEM BOT MLM API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class UserProfile(BaseModel):
    first_name: str
    last_name: str
    mobile: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class LevelSettings(BaseModel):
    level: int
    percentage: float
    min_direct_referrals: int

class SMTPSettings(BaseModel):
    host: str
    port: int
    username: str
    password: str
    from_email: str
    from_name: str

class EmailTemplate(BaseModel):
    template_type: str  # otp, welcome, withdrawal, etc.
    subject: str
    body: str

class SubscriptionSettings(BaseModel):
    activation_amount: float
    renewal_amount: float
    grace_period_hours: int = 48

class WalletSettings(BaseModel):
    earnings_to_deposit_fee: float = 0  # Percentage fee
    deposit_to_earnings_fee: float = 0  # Percentage fee
    user_transfer_fee: float = 0  # Percentage fee for user-to-user transfer
    withdrawal_fee: float = 0  # Fixed USDT fee for external withdrawal
    min_transfer_amount: float = 1  # Minimum amount for any transfer
    min_withdrawal_amount: float = 10  # Minimum amount for external withdrawal

class WithdrawRequest(BaseModel):
    amount: float
    to_address: str

class InternalTransferRequest(BaseModel):
    amount: float
    transfer_type: str  # "earnings_to_deposit" or "deposit_to_earnings"

class UserTransferRequest(BaseModel):
    amount: float
    recipient_identifier: str  # Email or referral code
    identifier_type: str  # "email" or "referral_code"

class AdditionalCommission(BaseModel):
    user_id: str
    activation_percentage: float
    renewal_percentage: float

class LevelSettingsV2(BaseModel):
    level: int
    activation_percentage: float
    renewal_percentage: float
    min_direct_referrals: int

class MT5Credentials(BaseModel):
    mt5_server: str
    mt5_username: str
    mt5_password: str
    terms_accepted: bool

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None
    wallet_address: Optional[str] = None
    referral_code: str
    sponsor_id: Optional[str] = None
    is_active: bool
    subscription_expires: Optional[str] = None
    total_income: float
    wallet_balance: float
    direct_referrals: int
    created_at: str

# ==================== HELPER FUNCTIONS ====================

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def generate_referral_code():
    return 'GEM' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(data: dict, is_admin: bool = False) -> str:
    payload = {
        **data,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin token not allowed")
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    admin = await db.admins.find_one({"id": payload["admin_id"]}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

async def get_smtp_settings():
    settings = await db.settings.find_one({"type": "smtp"}, {"_id": 0})
    return settings.get("data") if settings else None

async def get_email_template(template_type: str):
    template = await db.email_templates.find_one({"template_type": template_type}, {"_id": 0})
    if template:
        return template
    # Default templates
    defaults = {
        "otp": {
            "subject": "Your GEM BOT Verification Code",
            "body": "Your verification code is: {{otp}}. Valid for 10 minutes."
        },
        "welcome": {
            "subject": "Welcome to GEM BOT",
            "body": "Welcome {{name}}! Your account has been activated. Referral code: {{referral_code}}"
        },
        "withdrawal": {
            "subject": "Withdrawal Processed",
            "body": "Your withdrawal of ${{amount}} USDT has been processed. TXN: {{txn_hash}}"
        }
    }
    return {"subject": defaults.get(template_type, {}).get("subject", "GEM BOT Notification"),
            "body": defaults.get(template_type, {}).get("body", "Notification from GEM BOT")}

async def send_email(to_email: str, subject: str, body: str):
    smtp_settings = await get_smtp_settings()
    if not smtp_settings:
        logger.warning(f"SMTP not configured. Email to {to_email}: {subject} - {body}")
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{smtp_settings['from_name']} <{smtp_settings['from_email']}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP(smtp_settings['host'], smtp_settings['port']) as server:
            server.starttls()
            server.login(smtp_settings['username'], smtp_settings['password'])
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return False

async def get_coinconnect_credentials():
    settings = await db.settings.find_one({"type": "coinconnect"}, {"_id": 0})
    if settings and settings.get("data"):
        return settings["data"]
    return {
        "cca_key": os.environ.get("CCA_KEY", ""),
        "cca_secret": os.environ.get("CCA_SECRET", "")
    }

async def create_coinconnect_wallet(email: str, first_name: str, last_name: str, mobile: str):
    creds = await get_coinconnect_credentials()
    if not creds.get("cca_key"):
        logger.warning("CoinConnect credentials not configured")
        return None
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(COINCONNECT_CREATE_USER, json={
                "data": {
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "mobile": mobile
                },
                "header": {
                    "cca_key": creds["cca_key"],
                    "cca_secret": creds["cca_secret"]
                }
            })
            result = response.json()
            if result.get("status") == "OK":
                return result["message"]["address"]
    except Exception as e:
        logger.error(f"CoinConnect wallet creation error: {e}")
    return None

async def get_wallet_balance(address: str):
    creds = await get_coinconnect_credentials()
    if not creds.get("cca_key") or not address:
        return 0
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(COINCONNECT_BALANCE, json={
                "data": {
                    "address": address,
                    "currency": "USDT"
                },
                "header": {
                    "cca_key": creds["cca_key"],
                    "cca_secret": creds["cca_secret"]
                }
            })
            result = response.json()
            if result.get("status") == "OK":
                return float(result["response"]["data"].get("balance_in_usd", 0))
    except Exception as e:
        logger.error(f"CoinConnect balance check error: {e}")
    return 0

async def process_withdrawal(user_email: str, user_address: str, to_address: str, amount: float, txn_id: str):
    creds = await get_coinconnect_credentials()
    if not creds.get("cca_key"):
        return {"status": "NOTOK", "message": "CoinConnect not configured"}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(COINCONNECT_WITHDRAW, json={
                "data": {
                    "currency": "USDT",
                    "to_address": to_address,
                    "txn_id": txn_id,
                    "user_address": user_address,
                    "user_email": user_email,
                    "value_in_usd": amount
                },
                "header": {
                    "cca_key": creds["cca_key"],
                    "cca_secret": creds["cca_secret"]
                }
            })
            return response.json()
    except Exception as e:
        logger.error(f"CoinConnect withdrawal error: {e}")
        return {"status": "NOTOK", "message": str(e)}

async def get_level_settings():
    settings = await db.settings.find_one({"type": "levels"}, {"_id": 0})
    if settings and settings.get("data"):
        return settings["data"]
    # Default 10 levels with separate activation/renewal percentages
    return [
        {"level": 1, "activation_percentage": 10.0, "renewal_percentage": 10.0, "min_direct_referrals": 0},
        {"level": 2, "activation_percentage": 5.0, "renewal_percentage": 5.0, "min_direct_referrals": 2},
        {"level": 3, "activation_percentage": 3.0, "renewal_percentage": 3.0, "min_direct_referrals": 3},
        {"level": 4, "activation_percentage": 2.0, "renewal_percentage": 2.0, "min_direct_referrals": 4},
        {"level": 5, "activation_percentage": 1.5, "renewal_percentage": 1.5, "min_direct_referrals": 5},
        {"level": 6, "activation_percentage": 1.0, "renewal_percentage": 1.0, "min_direct_referrals": 6},
        {"level": 7, "activation_percentage": 0.8, "renewal_percentage": 0.8, "min_direct_referrals": 7},
        {"level": 8, "activation_percentage": 0.6, "renewal_percentage": 0.6, "min_direct_referrals": 8},
        {"level": 9, "activation_percentage": 0.4, "renewal_percentage": 0.4, "min_direct_referrals": 9},
        {"level": 10, "activation_percentage": 0.2, "renewal_percentage": 0.2, "min_direct_referrals": 10}
    ]

async def get_subscription_settings():
    settings = await db.settings.find_one({"type": "subscription"}, {"_id": 0})
    if settings and settings.get("data"):
        return settings["data"]
    return {"activation_amount": 100.0, "renewal_amount": 70.0, "grace_period_hours": 48}

def get_user_subscription_status(user: dict, grace_period_hours: int = 48) -> str:
    """
    Returns user subscription status:
    - 'active': Subscription is valid
    - 'grace_period': Subscription expired but within grace period
    - 'inactive': Subscription expired and grace period ended (compressed)
    """
    if not user.get("subscription_expires"):
        return "inactive"
    
    expires = datetime.fromisoformat(user["subscription_expires"])
    now = datetime.now(timezone.utc)
    grace_end = expires + timedelta(hours=grace_period_hours)
    
    if now <= expires:
        return "active"
    elif now <= grace_end:
        return "grace_period"
    else:
        return "inactive"

async def distribute_level_income(user_id: str, amount: float, income_type: str):
    """Distribute income to upline sponsors based on level settings
    income_type: 'activation' or 'renewal'
    
    Features:
    - Compression: Skip inactive users, pass income to next active upline
    - Grace Period: Users in grace period get income stored in temporary_wallet
    """
    level_settings = await get_level_settings()
    sub_settings = await get_subscription_settings()
    grace_period_hours = sub_settings.get("grace_period_hours", 48)
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or not user.get("sponsor_id"):
        return
    
    current_sponsor_id = user["sponsor_id"]
    level = 1
    
    while current_sponsor_id and level <= 10:
        sponsor = await db.users.find_one({"id": current_sponsor_id}, {"_id": 0})
        if not sponsor:
            break
        
        # Get sponsor's subscription status
        sponsor_status = get_user_subscription_status(sponsor, grace_period_hours)
        
        # COMPRESSION: If sponsor is inactive, skip to next upline (don't increment level)
        if sponsor_status == "inactive":
            current_sponsor_id = sponsor.get("sponsor_id")
            continue  # Skip this sponsor, don't increment level
        
        # Check if sponsor qualifies for this level income
        level_config = next((lvl for lvl in level_settings if lvl["level"] == level), None)
        if not level_config:
            break
        
        sponsor_direct_referrals = await db.users.count_documents({"sponsor_id": current_sponsor_id})
        
        if sponsor_direct_referrals >= level_config["min_direct_referrals"]:
            # Use appropriate percentage based on income type
            if income_type == "activation":
                percentage = level_config.get("activation_percentage", level_config.get("percentage", 0))
            else:  # renewal
                percentage = level_config.get("renewal_percentage", level_config.get("percentage", 0))
            
            income = amount * (percentage / 100)
            
            if sponsor_status == "active":
                # Active user: Add to main wallet
                await db.users.update_one(
                    {"id": current_sponsor_id},
                    {
                        "$inc": {"wallet_balance": income, "total_income": income},
                        "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                    }
                )
                
                # Record income transaction
                await db.transactions.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": current_sponsor_id,
                    "type": "level_income",
                    "amount": income,
                    "level": level,
                    "from_user_id": user_id,
                    "income_type": income_type,
                    "status": "completed",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
            elif sponsor_status == "grace_period":
                # Grace period: Store in temporary wallet
                await db.users.update_one(
                    {"id": current_sponsor_id},
                    {
                        "$inc": {"temporary_wallet": income},
                        "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                    }
                )
                
                # Record as pending transaction
                await db.transactions.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": current_sponsor_id,
                    "type": "level_income",
                    "amount": income,
                    "level": level,
                    "from_user_id": user_id,
                    "income_type": income_type,
                    "status": "pending_grace",  # Pending until renewal or forfeit
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        
        current_sponsor_id = sponsor.get("sponsor_id")
        level += 1
    
    # Also distribute additional commissions
    await distribute_additional_commissions(user_id, amount, income_type)

async def distribute_additional_commissions(user_id: str, amount: float, income_type: str):
    """Distribute additional commissions to specially configured users"""
    additional_commissions = await db.additional_commissions.find({}, {"_id": 0}).to_list(1000)
    
    for commission in additional_commissions:
        target_user = await db.users.find_one({"id": commission["user_id"]}, {"_id": 0})
        if not target_user:
            continue
        
        # Get percentage based on income type
        if income_type == "activation":
            percentage = commission.get("activation_percentage", 0)
        else:  # renewal
            percentage = commission.get("renewal_percentage", 0)
        
        if percentage <= 0:
            continue
        
        income = amount * (percentage / 100)
        
        # Update user's wallet balance and total income
        await db.users.update_one(
            {"id": commission["user_id"]},
            {
                "$inc": {"wallet_balance": income, "total_income": income},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        # Record additional commission transaction
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": commission["user_id"],
            "type": "additional_commission",
            "amount": income,
            "from_user_id": user_id,
            "income_type": income_type,
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

async def flush_temporary_wallet(user_id: str):
    """
    Flush temporary wallet to main wallet when user renews during grace period.
    Also update pending_grace transactions to completed.
    """
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return
    
    temp_balance = user.get("temporary_wallet", 0)
    if temp_balance > 0:
        # Move temporary wallet to main wallet
        await db.users.update_one(
            {"id": user_id},
            {
                "$inc": {"wallet_balance": temp_balance, "total_income": temp_balance},
                "$set": {"temporary_wallet": 0, "updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        # Update pending_grace transactions to completed
        await db.transactions.update_many(
            {"user_id": user_id, "status": "pending_grace"},
            {"$set": {"status": "completed", "flushed_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Record flush transaction
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "grace_period_flush",
            "amount": temp_balance,
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

async def forfeit_temporary_wallet(user_id: str):
    """
    Forfeit temporary wallet when grace period expires without renewal.
    Income is lost forever.
    """
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return
    
    temp_balance = user.get("temporary_wallet", 0)
    if temp_balance > 0:
        # Clear temporary wallet (income is forfeited)
        await db.users.update_one(
            {"id": user_id},
            {
                "$set": {"temporary_wallet": 0, "updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        # Update pending_grace transactions to forfeited
        await db.transactions.update_many(
            {"user_id": user_id, "status": "pending_grace"},
            {"$set": {"status": "forfeited", "forfeited_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Record forfeit transaction
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "grace_period_forfeit",
            "amount": temp_balance,
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

async def check_and_activate_user(user_id: str):
    """Check user's deposit and activate subscription if sufficient"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or not user.get("wallet_address"):
        return False
    
    balance = await get_wallet_balance(user["wallet_address"])
    sub_settings = await get_subscription_settings()
    grace_period_hours = sub_settings.get("grace_period_hours", 48)
    
    # Determine if this is activation or renewal
    current_status = get_user_subscription_status(user, grace_period_hours)
    is_renewal = current_status in ["active", "grace_period"]
    required_amount = sub_settings["renewal_amount"] if is_renewal else sub_settings["activation_amount"]
    income_type = "renewal" if is_renewal else "activation"
    
    if balance >= required_amount:
        expires = datetime.now(timezone.utc) + timedelta(days=30)
        await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "is_active": True,
                    "subscription_expires": expires.isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # If renewing during grace period, flush temporary wallet
        if current_status == "grace_period":
            await flush_temporary_wallet(user_id)
        
        # Record activation/renewal transaction
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": income_type,
            "amount": required_amount,
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Distribute level income with correct type
        await distribute_level_income(user_id, required_amount, income_type)
        return True
    return False

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/send-otp")
async def send_otp(data: OTPRequest, background_tasks: BackgroundTasks):
    # Check if SMTP is configured
    smtp_settings = await get_smtp_settings()
    
    if smtp_settings and smtp_settings.get("host"):
        # SMTP configured - generate random OTP
        otp = generate_otp()
    else:
        # SMTP not configured - use default OTP "000000"
        otp = "000000"
    
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.otps.update_one(
        {"email": data.email},
        {"$set": {"otp": otp, "expires": expires.isoformat(), "email": data.email}},
        upsert=True
    )
    
    template = await get_email_template("otp")
    subject = template["subject"]
    body = template["body"].replace("{{otp}}", otp)
    
    # Only send email if SMTP is configured
    if smtp_settings and smtp_settings.get("host"):
        background_tasks.add_task(send_email, data.email, subject, body)
    else:
        logger.info(f"SMTP not configured. Default OTP '000000' set for {data.email}")
    
    # Check if user exists
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    smtp_configured = smtp_settings is not None and smtp_settings.get("host") is not None
    
    return {
        "message": "OTP sent successfully" if smtp_configured else "Use default OTP: 000000 (SMTP not configured)",
        "user_exists": user is not None,
        "is_profile_complete": user.get("first_name") is not None if user else False,
        "smtp_configured": smtp_configured
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(data: OTPVerify):
    otp_record = await db.otps.find_one({"email": data.email}, {"_id": 0})
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new one.")
    
    if otp_record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    expires = datetime.fromisoformat(otp_record["expires"])
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    # Delete used OTP
    await db.otps.delete_one({"email": data.email})
    
    # Check if user exists
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    if user:
        token = create_token({"user_id": user["id"], "email": user["email"]})
        return {
            "token": token,
            "user": user,
            "is_new_user": False,
            "is_profile_complete": user.get("first_name") is not None
        }
    
    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "first_name": None,
        "last_name": None,
        "mobile": None,
        "wallet_address": None,
        "referral_code": generate_referral_code(),
        "sponsor_id": None,
        "is_active": False,
        "subscription_expires": None,
        "total_income": 0.0,
        "wallet_balance": 0.0,
        "temporary_wallet": 0.0,  # Grace period income storage
        "direct_referrals": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(new_user)
    new_user.pop("_id", None)
    
    token = create_token({"user_id": new_user["id"], "email": new_user["email"]})
    
    return {
        "token": token,
        "user": new_user,
        "is_new_user": True,
        "is_profile_complete": False
    }

@api_router.post("/auth/complete-profile")
async def complete_profile(data: UserProfile, referral_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    sponsor_id = None
    if referral_code:
        sponsor = await db.users.find_one({"referral_code": referral_code}, {"_id": 0})
        if sponsor and sponsor["id"] != user["id"]:
            sponsor_id = sponsor["id"]
            # Increment sponsor's direct referrals
            await db.users.update_one(
                {"id": sponsor_id},
                {"$inc": {"direct_referrals": 1}}
            )
    
    # Create CoinConnect wallet
    wallet_address = await create_coinconnect_wallet(
        user["email"], data.first_name, data.last_name, data.mobile
    )
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "first_name": data.first_name,
                "last_name": data.last_name,
                "mobile": data.mobile,
                "sponsor_id": sponsor_id,
                "wallet_address": wallet_address,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"message": "Profile completed", "user": updated_user}

# ==================== USER ENDPOINTS ====================

@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return user

@api_router.put("/user/profile")
async def update_profile(data: UserProfile, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "first_name": data.first_name,
                "last_name": data.last_name,
                "mobile": data.mobile,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return updated_user

@api_router.get("/user/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    # Get team stats
    direct_count = await db.users.count_documents({"sponsor_id": user["id"]})
    total_team = await get_total_team_count(user["id"])
    
    # Get recent transactions
    recent_txns = await db.transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get level-wise income
    level_income = await db.transactions.aggregate([
        {"$match": {"user_id": user["id"], "type": "level_income"}},
        {"$group": {"_id": "$level", "total": {"$sum": "$amount"}}}
    ]).to_list(10)
    
    # Check wallet balance from CoinConnect
    wallet_balance = 0
    if user.get("wallet_address"):
        wallet_balance = await get_wallet_balance(user["wallet_address"])
    
    sub_settings = await get_subscription_settings()
    grace_period_hours = sub_settings.get("grace_period_hours", 48)
    
    # Calculate subscription status
    subscription_status = get_user_subscription_status(user, grace_period_hours)
    
    # Calculate grace period end time if in grace period
    grace_period_ends = None
    if subscription_status == "grace_period" and user.get("subscription_expires"):
        expires = datetime.fromisoformat(user["subscription_expires"])
        grace_period_ends = (expires + timedelta(hours=grace_period_hours)).isoformat()
    
    return {
        "user": user,
        "wallet_balance": wallet_balance,
        "internal_balance": user.get("wallet_balance", 0),
        "temporary_wallet": user.get("temporary_wallet", 0),
        "total_income": user.get("total_income", 0),
        "direct_referrals": direct_count,
        "total_team": total_team,
        "recent_transactions": recent_txns,
        "level_income": {str(li["_id"]): li["total"] for li in level_income},
        "subscription_settings": sub_settings,
        "subscription_status": subscription_status,
        "grace_period_ends": grace_period_ends
    }

async def get_total_team_count(user_id: str, visited: set = None) -> int:
    if visited is None:
        visited = set()
    if user_id in visited:
        return 0
    visited.add(user_id)
    
    direct = await db.users.find({"sponsor_id": user_id}, {"_id": 0, "id": 1}).to_list(1000)
    count = len(direct)
    for d in direct:
        count += await get_total_team_count(d["id"], visited)
    return count

@api_router.get("/user/team")
async def get_team(user: dict = Depends(get_current_user)):
    """Get team hierarchy up to 10 levels"""
    levels = []
    current_level_ids = [user["id"]]
    
    for level in range(1, 11):
        level_members = await db.users.find(
            {"sponsor_id": {"$in": current_level_ids}},
            {"_id": 0}
        ).to_list(1000)
        
        if not level_members:
            break
        
        levels.append({
            "level": level,
            "count": len(level_members),
            "members": level_members
        })
        
        current_level_ids = [m["id"] for m in level_members]
    
    return {
        "levels": levels,
        "total_team": sum(lvl["count"] for lvl in levels)
    }

@api_router.get("/user/income")
async def get_income(user: dict = Depends(get_current_user)):
    # Level-wise income breakdown
    level_income = await db.transactions.aggregate([
        {"$match": {"user_id": user["id"], "type": "level_income"}},
        {"$group": {"_id": "$level", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]).to_list(10)
    
    # Total income by type
    income_by_type = await db.transactions.aggregate([
        {"$match": {"user_id": user["id"], "type": "level_income"}},
        {"$group": {"_id": "$income_type", "total": {"$sum": "$amount"}}}
    ]).to_list(10)
    
    # Recent income transactions
    recent_income = await db.transactions.find(
        {"user_id": user["id"], "type": "level_income"},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    level_settings = await get_level_settings()
    
    return {
        "level_income": sorted([{"level": li["_id"], "total": li["total"], "count": li["count"]} for li in level_income], key=lambda x: x["level"]),
        "income_by_type": {ibt["_id"]: ibt["total"] for ibt in income_by_type},
        "recent_income": recent_income,
        "total_income": user.get("total_income", 0),
        "level_settings": level_settings
    }

@api_router.get("/user/wallet")
async def get_wallet(user: dict = Depends(get_current_user)):
    wallet_balance = 0
    if user.get("wallet_address"):
        wallet_balance = await get_wallet_balance(user["wallet_address"])
    
    # Get withdrawal history
    withdrawals = await db.transactions.find(
        {"user_id": user["id"], "type": "withdrawal"},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    # Get deposit history (activations/renewals)
    deposits = await db.transactions.find(
        {"user_id": user["id"], "type": {"$in": ["activation", "renewal"]}},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        "wallet_address": user.get("wallet_address"),
        "external_balance": wallet_balance,
        "internal_balance": user.get("wallet_balance", 0),
        "withdrawals": withdrawals,
        "deposits": deposits
    }

@api_router.post("/user/withdraw")
async def withdraw(data: WithdrawRequest, user: dict = Depends(get_current_user)):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    if data.amount > user.get("wallet_balance", 0):
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    txn_id = f"GEM-{str(uuid.uuid4())[:8].upper()}"
    
    # Process withdrawal via CoinConnect
    result = await process_withdrawal(
        user["email"],
        user.get("wallet_address", ""),
        data.to_address,
        data.amount,
        txn_id
    )
    
    if result.get("status") == "OK":
        # Deduct from internal balance
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"wallet_balance": -data.amount}}
        )
        
        # Record transaction
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "type": "withdrawal",
            "amount": data.amount,
            "to_address": data.to_address,
            "txn_id": txn_id,
            "txn_hash": result.get("response", {}).get("data", {}).get("txn_hash"),
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"message": "Withdrawal successful", "txn_id": txn_id, "txn_hash": result.get("response", {}).get("data", {}).get("txn_hash")}
    else:
        raise HTTPException(status_code=400, detail=result.get("message", "Withdrawal failed"))

@api_router.post("/user/check-activation")
async def check_activation(user: dict = Depends(get_current_user)):
    activated = await check_and_activate_user(user["id"])
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"activated": activated, "user": updated_user}

@api_router.post("/user/submit-mt5")
async def submit_mt5_credentials(data: MT5Credentials, user: dict = Depends(get_current_user)):
    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Account must be activated first")
    
    if not data.terms_accepted:
        raise HTTPException(status_code=400, detail="You must accept the terms and conditions")
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "mt5_server": data.mt5_server,
                "mt5_username": data.mt5_username,
                "mt5_password": data.mt5_password,
                "mt5_submitted": True,
                "mt5_submitted_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"message": "MT5 credentials submitted successfully", "user": updated_user}

@api_router.get("/user/transactions")
async def get_transactions(user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return {"transactions": transactions}

# ==================== ADMIN ENDPOINTS ====================

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin or not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"admin_id": admin["id"], "email": admin["email"]}, is_admin=True)
    return {"token": token, "admin": {"id": admin["id"], "email": admin["email"], "name": admin["name"]}}

@api_router.get("/admin/dashboard")
async def admin_dashboard(admin: dict = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    total_income = await db.transactions.aggregate([
        {"$match": {"type": {"$in": ["activation", "renewal"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    total_withdrawals = await db.transactions.aggregate([
        {"$match": {"type": "withdrawal", "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    recent_users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    recent_txns = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_income": total_income[0]["total"] if total_income else 0,
        "total_withdrawals": total_withdrawals[0]["total"] if total_withdrawals else 0,
        "recent_users": recent_users,
        "recent_transactions": recent_txns
    }

@api_router.get("/admin/users")
async def admin_get_users(skip: int = 0, limit: int = 50, admin: dict = Depends(get_current_admin)):
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin: dict = Depends(get_current_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    direct_referrals = await db.users.find({"sponsor_id": user_id}, {"_id": 0}).to_list(100)
    
    return {"user": user, "transactions": transactions, "direct_referrals": direct_referrals}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, data: dict, admin: dict = Depends(get_current_admin)):
    allowed_fields = ["is_active", "wallet_balance", "total_income", "subscription_expires"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return user

@api_router.get("/admin/settings/levels")
async def admin_get_levels(admin: dict = Depends(get_current_admin)):
    return {"levels": await get_level_settings()}

@api_router.put("/admin/settings/levels")
async def admin_update_levels(levels: List[LevelSettingsV2], admin: dict = Depends(get_current_admin)):
    await db.settings.update_one(
        {"type": "levels"},
        {"$set": {"type": "levels", "data": [lvl.model_dump() for lvl in levels]}},
        upsert=True
    )
    return {"message": "Level settings updated", "levels": [lvl.model_dump() for lvl in levels]}

# ==================== ADDITIONAL COMMISSIONS ====================

@api_router.get("/admin/additional-commissions")
async def admin_get_additional_commissions(admin: dict = Depends(get_current_admin)):
    commissions = await db.additional_commissions.find({}, {"_id": 0}).to_list(1000)
    # Enrich with user details
    for comm in commissions:
        user = await db.users.find_one({"id": comm["user_id"]}, {"_id": 0, "email": 1, "first_name": 1, "last_name": 1})
        comm["user"] = user
    return {"commissions": commissions}

@api_router.post("/admin/additional-commissions")
async def admin_add_additional_commission(data: AdditionalCommission, admin: dict = Depends(get_current_admin)):
    # Verify user exists
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if commission already exists for this user
    existing = await db.additional_commissions.find_one({"user_id": data.user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Commission already exists for this user. Use update instead.")
    
    commission = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "activation_percentage": data.activation_percentage,
        "renewal_percentage": data.renewal_percentage,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.additional_commissions.insert_one(commission)
    commission.pop("_id", None)
    return {"message": "Additional commission added", "commission": commission}

@api_router.put("/admin/additional-commissions/{user_id}")
async def admin_update_additional_commission(user_id: str, data: AdditionalCommission, admin: dict = Depends(get_current_admin)):
    result = await db.additional_commissions.update_one(
        {"user_id": user_id},
        {"$set": {
            "activation_percentage": data.activation_percentage,
            "renewal_percentage": data.renewal_percentage,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Commission not found")
    return {"message": "Additional commission updated"}

@api_router.delete("/admin/additional-commissions/{user_id}")
async def admin_delete_additional_commission(user_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.additional_commissions.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Commission not found")
    return {"message": "Additional commission deleted"}

@api_router.get("/admin/settings/subscription")
async def admin_get_subscription(admin: dict = Depends(get_current_admin)):
    return await get_subscription_settings()

@api_router.put("/admin/settings/subscription")
async def admin_update_subscription(data: SubscriptionSettings, admin: dict = Depends(get_current_admin)):
    await db.settings.update_one(
        {"type": "subscription"},
        {"$set": {"type": "subscription", "data": data.model_dump()}},
        upsert=True
    )
    return {"message": "Subscription settings updated", "settings": data.model_dump()}

@api_router.get("/admin/settings/smtp")
async def admin_get_smtp(admin: dict = Depends(get_current_admin)):
    settings = await get_smtp_settings()
    return settings if settings else {}

@api_router.put("/admin/settings/smtp")
async def admin_update_smtp(data: SMTPSettings, admin: dict = Depends(get_current_admin)):
    await db.settings.update_one(
        {"type": "smtp"},
        {"$set": {"type": "smtp", "data": data.model_dump()}},
        upsert=True
    )
    return {"message": "SMTP settings updated"}

@api_router.get("/admin/settings/coinconnect")
async def admin_get_coinconnect(admin: dict = Depends(get_current_admin)):
    creds = await get_coinconnect_credentials()
    return {"cca_key": creds.get("cca_key", ""), "cca_secret": "***" if creds.get("cca_secret") else ""}

@api_router.put("/admin/settings/coinconnect")
async def admin_update_coinconnect(data: dict, admin: dict = Depends(get_current_admin)):
    await db.settings.update_one(
        {"type": "coinconnect"},
        {"$set": {"type": "coinconnect", "data": {"cca_key": data.get("cca_key"), "cca_secret": data.get("cca_secret")}}},
        upsert=True
    )
    return {"message": "CoinConnect settings updated"}

@api_router.get("/admin/email-templates")
async def admin_get_email_templates(admin: dict = Depends(get_current_admin)):
    templates = await db.email_templates.find({}, {"_id": 0}).to_list(100)
    default_types = ["otp", "welcome", "withdrawal"]
    for t in default_types:
        if not any(tpl["template_type"] == t for tpl in templates):
            default = await get_email_template(t)
            templates.append({"template_type": t, **default})
    return {"templates": templates}

@api_router.put("/admin/email-templates/{template_type}")
async def admin_update_email_template(template_type: str, data: EmailTemplate, admin: dict = Depends(get_current_admin)):
    await db.email_templates.update_one(
        {"template_type": template_type},
        {"$set": data.model_dump()},
        upsert=True
    )
    return {"message": "Email template updated"}

@api_router.get("/admin/transactions")
async def admin_get_transactions(skip: int = 0, limit: int = 50, type: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {}
    if type:
        query["type"] = type
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.transactions.count_documents(query)
    return {"transactions": transactions, "total": total}

# ==================== PUBLIC ENDPOINTS ====================

@api_router.get("/public/terms")
async def get_terms():
    content = await db.content.find_one({"type": "terms"}, {"_id": 0})
    return content if content else {"type": "terms", "content": "Terms and Conditions content will be added by admin."}

@api_router.get("/public/privacy")
async def get_privacy():
    content = await db.content.find_one({"type": "privacy"}, {"_id": 0})
    return content if content else {"type": "privacy", "content": "Privacy Policy content will be added by admin."}

@api_router.get("/public/activation-terms")
async def get_activation_terms():
    content = await db.content.find_one({"type": "activation_terms"}, {"_id": 0})
    return content if content else {"type": "activation_terms", "content": "<h3>Activation Terms & Conditions</h3><p>By activating your account, you agree to:</p><ul><li>Pay the activation fee of $100 USDT</li><li>Maintain an active subscription for network benefits</li><li>Follow all platform rules and guidelines</li><li>Not engage in any fraudulent activities</li></ul><p>Your account will be activated for 30 days upon successful payment.</p>"}

@api_router.put("/admin/content/{content_type}")
async def admin_update_content(content_type: str, data: dict, admin: dict = Depends(get_current_admin)):
    await db.content.update_one(
        {"type": content_type},
        {"$set": {"type": content_type, "content": data.get("content", "")}},
        upsert=True
    )
    return {"message": f"{content_type} updated"}

@api_router.get("/")
async def root():
    return {"message": "GEM BOT MLM API", "version": "1.0.0"}

# ==================== GRACE PERIOD MANAGEMENT ====================

@api_router.post("/admin/process-expired-grace-periods")
async def process_expired_grace_periods(admin: dict = Depends(get_current_admin)):
    """
    Admin endpoint to manually process expired grace periods.
    Forfeits temporary wallet for users whose grace period has expired.
    """
    sub_settings = await get_subscription_settings()
    grace_period_hours = sub_settings.get("grace_period_hours", 48)
    
    # Find users with temporary wallet balance
    users_with_temp = await db.users.find(
        {"temporary_wallet": {"$gt": 0}},
        {"_id": 0}
    ).to_list(1000)
    
    forfeited_count = 0
    forfeited_total = 0
    
    for user in users_with_temp:
        status = get_user_subscription_status(user, grace_period_hours)
        if status == "inactive":  # Grace period expired
            temp_amount = user.get("temporary_wallet", 0)
            await forfeit_temporary_wallet(user["id"])
            forfeited_count += 1
            forfeited_total += temp_amount
    
    return {
        "message": f"Processed {forfeited_count} users",
        "forfeited_count": forfeited_count,
        "forfeited_total": forfeited_total
    }

@api_router.get("/admin/grace-period-users")
async def get_grace_period_users(admin: dict = Depends(get_current_admin)):
    """
    Get list of users currently in grace period or with pending temporary wallet.
    """
    sub_settings = await get_subscription_settings()
    grace_period_hours = sub_settings.get("grace_period_hours", 48)
    
    # Find all users with subscription
    all_users = await db.users.find(
        {"subscription_expires": {"$ne": None}},
        {"_id": 0}
    ).to_list(1000)
    
    grace_period_users = []
    for user in all_users:
        status = get_user_subscription_status(user, grace_period_hours)
        if status == "grace_period" or user.get("temporary_wallet", 0) > 0:
            expires = datetime.fromisoformat(user["subscription_expires"])
            grace_end = expires + timedelta(hours=grace_period_hours)
            
            grace_period_users.append({
                "id": user["id"],
                "email": user["email"],
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "subscription_status": status,
                "subscription_expires": user["subscription_expires"],
                "grace_period_ends": grace_end.isoformat(),
                "temporary_wallet": user.get("temporary_wallet", 0)
            })
    
    return {"users": grace_period_users, "count": len(grace_period_users)}

# ==================== SETUP ====================

@api_router.post("/setup/admin")
async def setup_admin(data: AdminCreate):
    existing = await db.admins.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin)
    return {"message": "Admin created successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
