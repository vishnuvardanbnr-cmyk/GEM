"""
Test Wallet Features - GEM BOT MLM Platform
Tests for:
- Wallet page API returns wallet_settings with all fee configurations
- Internal Transfer: Earnings <-> Deposit
- User-to-User Transfer
- Admin Wallet Settings CRUD
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://gem-bot-mlm.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@gembot.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = f"wallettest_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER2_EMAIL = f"wallettest2_{uuid.uuid4().hex[:8]}@example.com"
DEFAULT_OTP = "000000"

class TestAdminWalletSettings:
    """Admin Wallet Settings API Tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    def test_get_wallet_settings(self, admin_token):
        """Test GET /api/admin/settings/wallet returns all fee configurations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings/wallet",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields are present
        required_fields = [
            "earnings_to_deposit_fee",
            "deposit_to_earnings_fee", 
            "user_transfer_fee",
            "withdrawal_fee",
            "min_transfer_amount",
            "min_withdrawal_amount"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
            assert isinstance(data[field], (int, float)), f"Field {field} should be numeric"
        
        print(f"✅ Wallet settings retrieved: {data}")
    
    def test_update_wallet_settings(self, admin_token):
        """Test PUT /api/admin/settings/wallet updates all fee configurations"""
        new_settings = {
            "earnings_to_deposit_fee": 2.5,
            "deposit_to_earnings_fee": 3.0,
            "user_transfer_fee": 2.0,
            "withdrawal_fee": 5.0,
            "min_transfer_amount": 10.0,
            "min_withdrawal_amount": 25.0
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/wallet",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json=new_settings
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Wallet settings updated"
        
        # Verify settings were updated
        get_response = requests.get(
            f"{BASE_URL}/api/admin/settings/wallet",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        saved = get_response.json()
        
        for key, value in new_settings.items():
            assert saved[key] == value, f"Setting {key} not saved correctly. Expected {value}, got {saved[key]}"
        
        print(f"✅ Wallet settings updated and verified: {saved}")
    
    def test_reset_wallet_settings_to_defaults(self, admin_token):
        """Reset wallet settings to reasonable defaults for further testing"""
        default_settings = {
            "earnings_to_deposit_fee": 1.0,
            "deposit_to_earnings_fee": 1.0,
            "user_transfer_fee": 1.0,
            "withdrawal_fee": 2.0,
            "min_transfer_amount": 1.0,
            "min_withdrawal_amount": 10.0
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/settings/wallet",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json=default_settings
        )
        assert response.status_code == 200
        print(f"✅ Wallet settings reset to defaults")


class TestUserWalletAPI:
    """User Wallet API Tests"""
    
    @pytest.fixture(scope="class")
    def user_token_and_id(self):
        """Create/login a test user and get token"""
        # Send OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"email": TEST_USER_EMAIL}
        )
        assert response.status_code == 200
        
        # Verify OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": TEST_USER_EMAIL, "otp": DEFAULT_OTP}
        )
        assert response.status_code == 200
        data = response.json()
        token = data["token"]
        user_id = data["user"]["id"]
        is_profile_complete = data.get("is_profile_complete", False)
        
        # Complete profile if new user
        if not is_profile_complete:
            response = requests.post(
                f"{BASE_URL}/api/auth/complete-profile",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"first_name": "Test", "last_name": "Wallet", "mobile": "+1234567890"}
            )
            assert response.status_code == 200
        
        return {"token": token, "user_id": user_id, "email": TEST_USER_EMAIL}
    
    def test_get_user_wallet_returns_wallet_settings(self, user_token_and_id):
        """Test GET /api/user/wallet returns wallet_settings with all fee configurations"""
        response = requests.get(
            f"{BASE_URL}/api/user/wallet",
            headers={"Authorization": f"Bearer {user_token_and_id['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify wallet response structure
        assert "wallet_settings" in data, "wallet_settings not in response"
        assert "earnings_balance" in data, "earnings_balance not in response"
        assert "deposit_balance" in data, "deposit_balance not in response"
        assert "withdrawals" in data, "withdrawals not in response"
        assert "transfers" in data, "transfers not in response"
        
        # Verify wallet_settings has all required fields
        settings = data["wallet_settings"]
        required_fields = [
            "earnings_to_deposit_fee",
            "deposit_to_earnings_fee",
            "user_transfer_fee",
            "withdrawal_fee",
            "min_transfer_amount",
            "min_withdrawal_amount"
        ]
        for field in required_fields:
            assert field in settings, f"Missing field in wallet_settings: {field}"
        
        print(f"✅ User wallet returns wallet_settings: {settings}")


class TestInternalTransfer:
    """Internal Transfer Tests - Earnings <-> Deposit"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def user_with_balance(self, admin_token):
        """Create user with earnings and deposit balance for testing"""
        email = f"transfer_test_{uuid.uuid4().hex[:8]}@example.com"
        
        # Create user
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"email": email})
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": email, "otp": DEFAULT_OTP}
        )
        data = response.json()
        token = data["token"]
        user_id = data["user"]["id"]
        
        # Complete profile if needed
        if not data.get("is_profile_complete"):
            requests.post(
                f"{BASE_URL}/api/auth/complete-profile",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"first_name": "Transfer", "last_name": "Test", "mobile": "+1234567890"}
            )
        
        # Admin adds balance to user for testing
        requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json={"wallet_balance": 100.0}  # Earnings balance
        )
        
        return {"token": token, "user_id": user_id, "email": email}
    
    def test_internal_transfer_earnings_to_deposit(self, user_with_balance):
        """Test internal transfer from Earnings to Deposit"""
        response = requests.post(
            f"{BASE_URL}/api/user/internal-transfer",
            headers={"Authorization": f"Bearer {user_with_balance['token']}", "Content-Type": "application/json"},
            json={
                "amount": 50.0,
                "transfer_type": "earnings_to_deposit"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert data["message"] == "Transfer successful"
        assert "amount" in data
        assert "fee" in data
        assert "net_amount" in data
        assert data["amount"] == 50.0
        
        print(f"✅ Earnings to Deposit transfer: amount={data['amount']}, fee={data['fee']}, net={data['net_amount']}")
        
        # Verify balances updated
        wallet_response = requests.get(
            f"{BASE_URL}/api/user/wallet",
            headers={"Authorization": f"Bearer {user_with_balance['token']}"}
        )
        wallet = wallet_response.json()
        
        # Deposit should have increased (minus fee)
        assert wallet["deposit_balance"] >= data["net_amount"], "Deposit balance not increased correctly"
        print(f"✅ Verified: deposit_balance={wallet['deposit_balance']}")
    
    def test_internal_transfer_deposit_to_earnings(self, user_with_balance):
        """Test internal transfer from Deposit to Earnings"""
        # First check current deposit balance
        wallet_response = requests.get(
            f"{BASE_URL}/api/user/wallet",
            headers={"Authorization": f"Bearer {user_with_balance['token']}"}
        )
        current_deposit = wallet_response.json()["deposit_balance"]
        
        if current_deposit < 10:
            pytest.skip(f"Insufficient deposit balance for test: {current_deposit}")
        
        transfer_amount = min(20.0, current_deposit)
        
        response = requests.post(
            f"{BASE_URL}/api/user/internal-transfer",
            headers={"Authorization": f"Bearer {user_with_balance['token']}", "Content-Type": "application/json"},
            json={
                "amount": transfer_amount,
                "transfer_type": "deposit_to_earnings"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Transfer successful"
        print(f"✅ Deposit to Earnings transfer: amount={data['amount']}, fee={data['fee']}, net={data['net_amount']}")
    
    def test_internal_transfer_insufficient_balance(self, user_with_balance):
        """Test internal transfer fails with insufficient balance"""
        response = requests.post(
            f"{BASE_URL}/api/user/internal-transfer",
            headers={"Authorization": f"Bearer {user_with_balance['token']}", "Content-Type": "application/json"},
            json={
                "amount": 999999.0,
                "transfer_type": "earnings_to_deposit"
            }
        )
        assert response.status_code == 400
        assert "Insufficient" in response.json().get("detail", "")
        print(f"✅ Insufficient balance correctly rejected")
    
    def test_internal_transfer_below_minimum(self, user_with_balance):
        """Test internal transfer fails below minimum amount"""
        response = requests.post(
            f"{BASE_URL}/api/user/internal-transfer",
            headers={"Authorization": f"Bearer {user_with_balance['token']}", "Content-Type": "application/json"},
            json={
                "amount": 0.01,  # Below minimum
                "transfer_type": "earnings_to_deposit"
            }
        )
        assert response.status_code == 400
        assert "Minimum" in response.json().get("detail", "")
        print(f"✅ Below minimum correctly rejected")


class TestUserToUserTransfer:
    """User-to-User Transfer Tests - My Deposit → Another User's Deposit"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def sender_user(self, admin_token):
        """Create sender with deposit balance"""
        email = f"sender_{uuid.uuid4().hex[:8]}@example.com"
        
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"email": email})
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": email, "otp": DEFAULT_OTP}
        )
        data = response.json()
        token = data["token"]
        user_id = data["user"]["id"]
        
        if not data.get("is_profile_complete"):
            requests.post(
                f"{BASE_URL}/api/auth/complete-profile",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"first_name": "Sender", "last_name": "User", "mobile": "+1234567890"}
            )
        
        # Get user to access deposit_balance field which may need to be added
        # Since deposit_balance isn't in admin allowed_fields, we'll use a workaround
        # First add to wallet_balance, then do internal transfer
        requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json={"wallet_balance": 200.0}
        )
        
        # Transfer some to deposit balance
        requests.post(
            f"{BASE_URL}/api/user/internal-transfer",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"amount": 100.0, "transfer_type": "earnings_to_deposit"}
        )
        
        return {"token": token, "user_id": user_id, "email": email}
    
    @pytest.fixture(scope="class")
    def recipient_user(self, admin_token):
        """Create recipient user"""
        email = f"recipient_{uuid.uuid4().hex[:8]}@example.com"
        
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"email": email})
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": email, "otp": DEFAULT_OTP}
        )
        data = response.json()
        token = data["token"]
        user_id = data["user"]["id"]
        referral_code = data["user"]["referral_code"]
        
        if not data.get("is_profile_complete"):
            requests.post(
                f"{BASE_URL}/api/auth/complete-profile",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"first_name": "Recipient", "last_name": "User", "mobile": "+1234567890"}
            )
            # Re-fetch user to get referral code
            response = requests.get(
                f"{BASE_URL}/api/user/profile",
                headers={"Authorization": f"Bearer {token}"}
            )
            referral_code = response.json()["referral_code"]
        
        return {"token": token, "user_id": user_id, "email": email, "referral_code": referral_code}
    
    def test_user_transfer_by_email(self, sender_user, recipient_user):
        """Test user-to-user transfer finding recipient by email"""
        # Get sender's current deposit balance
        wallet_response = requests.get(
            f"{BASE_URL}/api/user/wallet",
            headers={"Authorization": f"Bearer {sender_user['token']}"}
        )
        sender_deposit = wallet_response.json()["deposit_balance"]
        
        if sender_deposit < 20:
            pytest.skip(f"Insufficient sender deposit balance: {sender_deposit}")
        
        response = requests.post(
            f"{BASE_URL}/api/user/user-transfer",
            headers={"Authorization": f"Bearer {sender_user['token']}", "Content-Type": "application/json"},
            json={
                "amount": 20.0,
                "recipient_identifier": recipient_user["email"],
                "identifier_type": "email"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert data["message"] == "Transfer successful"
        assert "recipient_email" in data
        assert data["recipient_email"] == recipient_user["email"]
        assert "fee" in data
        assert "net_amount" in data
        
        print(f"✅ User transfer by email: sent ${data['amount']}, fee=${data['fee']}, recipient gets ${data['net_amount']}")
        
        # Verify recipient received funds
        recipient_wallet = requests.get(
            f"{BASE_URL}/api/user/wallet",
            headers={"Authorization": f"Bearer {recipient_user['token']}"}
        )
        recipient_deposit = recipient_wallet.json()["deposit_balance"]
        assert recipient_deposit > 0, "Recipient deposit balance should be > 0"
        print(f"✅ Recipient deposit_balance verified: ${recipient_deposit}")
    
    def test_user_transfer_by_referral_code(self, sender_user, recipient_user):
        """Test user-to-user transfer finding recipient by referral code"""
        # Get sender's current deposit balance
        wallet_response = requests.get(
            f"{BASE_URL}/api/user/wallet",
            headers={"Authorization": f"Bearer {sender_user['token']}"}
        )
        sender_deposit = wallet_response.json()["deposit_balance"]
        
        if sender_deposit < 10:
            pytest.skip(f"Insufficient sender deposit balance: {sender_deposit}")
        
        response = requests.post(
            f"{BASE_URL}/api/user/user-transfer",
            headers={"Authorization": f"Bearer {sender_user['token']}", "Content-Type": "application/json"},
            json={
                "amount": 10.0,
                "recipient_identifier": recipient_user["referral_code"],
                "identifier_type": "referral_code"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Transfer successful"
        print(f"✅ User transfer by referral code: sent ${data['amount']} to {recipient_user['referral_code']}")
    
    def test_user_transfer_to_self_fails(self, sender_user):
        """Test that user cannot transfer to themselves"""
        response = requests.post(
            f"{BASE_URL}/api/user/user-transfer",
            headers={"Authorization": f"Bearer {sender_user['token']}", "Content-Type": "application/json"},
            json={
                "amount": 10.0,
                "recipient_identifier": sender_user["email"],
                "identifier_type": "email"
            }
        )
        assert response.status_code == 400
        assert "yourself" in response.json().get("detail", "").lower()
        print(f"✅ Transfer to self correctly rejected")
    
    def test_user_transfer_invalid_recipient(self, sender_user):
        """Test transfer to non-existent recipient fails"""
        response = requests.post(
            f"{BASE_URL}/api/user/user-transfer",
            headers={"Authorization": f"Bearer {sender_user['token']}", "Content-Type": "application/json"},
            json={
                "amount": 10.0,
                "recipient_identifier": "nonexistent@example.com",
                "identifier_type": "email"
            }
        )
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()
        print(f"✅ Invalid recipient correctly rejected")


class TestWithdrawal:
    """Withdrawal Tests - Earnings to External Wallet"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def user_with_earnings(self, admin_token):
        """Create user with earnings balance"""
        email = f"withdraw_{uuid.uuid4().hex[:8]}@example.com"
        
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"email": email})
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": email, "otp": DEFAULT_OTP}
        )
        data = response.json()
        token = data["token"]
        user_id = data["user"]["id"]
        
        if not data.get("is_profile_complete"):
            requests.post(
                f"{BASE_URL}/api/auth/complete-profile",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"first_name": "Withdraw", "last_name": "Test", "mobile": "+1234567890"}
            )
        
        # Admin adds earnings balance
        requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json={"wallet_balance": 100.0}
        )
        
        return {"token": token, "user_id": user_id, "email": email}
    
    def test_withdrawal_insufficient_balance(self, user_with_earnings):
        """Test withdrawal fails with insufficient balance"""
        response = requests.post(
            f"{BASE_URL}/api/user/withdraw",
            headers={"Authorization": f"Bearer {user_with_earnings['token']}", "Content-Type": "application/json"},
            json={
                "amount": 999999.0,
                "to_address": "0x1234567890abcdef1234567890abcdef12345678"
            }
        )
        assert response.status_code == 400
        assert "Insufficient" in response.json().get("detail", "")
        print(f"✅ Insufficient balance withdrawal correctly rejected")
    
    def test_withdrawal_below_minimum(self, user_with_earnings):
        """Test withdrawal below minimum fails"""
        response = requests.post(
            f"{BASE_URL}/api/user/withdraw",
            headers={"Authorization": f"Bearer {user_with_earnings['token']}", "Content-Type": "application/json"},
            json={
                "amount": 1.0,  # Below minimum of 10
                "to_address": "0x1234567890abcdef1234567890abcdef12345678"
            }
        )
        assert response.status_code == 400
        assert "Minimum" in response.json().get("detail", "")
        print(f"✅ Below minimum withdrawal correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
