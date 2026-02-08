"""
Test Grace Period and Compression Features for GEM BOT MLM
- Grace period settings (48 hrs default, admin configurable)
- User subscription status calculation (active, grace_period, inactive)
- Temporary wallet for grace period income
- Admin settings API for grace period hours
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@gembot.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = f"test_grace_{datetime.now().strftime('%H%M%S')}@example.com"
DEFAULT_OTP = "000000"


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login(self):
        """Test admin login returns token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "admin" in data, "No admin info in response"
        return data["token"]


class TestSubscriptionSettings:
    """Test subscription settings including grace period"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_get_subscription_settings(self, admin_token):
        """Test GET subscription settings returns grace_period_hours"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings/subscription",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to get subscription settings: {response.text}"
        data = response.json()
        
        # Verify required fields exist
        assert "activation_amount" in data, "Missing activation_amount"
        assert "renewal_amount" in data, "Missing renewal_amount"
        assert "grace_period_hours" in data, "Missing grace_period_hours field"
        
        # Verify grace_period_hours has expected default value
        assert data["grace_period_hours"] == 48, f"Expected grace_period_hours=48, got {data['grace_period_hours']}"
        
        print(f"Subscription settings: {data}")
        return data
    
    def test_update_grace_period_hours(self, admin_token):
        """Test updating grace period hours"""
        # First get current settings
        get_response = requests.get(
            f"{BASE_URL}/api/admin/settings/subscription",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        original_settings = get_response.json()
        
        # Update grace period to a new value
        new_grace_hours = 72
        update_response = requests.put(
            f"{BASE_URL}/api/admin/settings/subscription",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "activation_amount": original_settings.get("activation_amount", 100),
                "renewal_amount": original_settings.get("renewal_amount", 70),
                "grace_period_hours": new_grace_hours
            }
        )
        assert update_response.status_code == 200, f"Failed to update settings: {update_response.text}"
        
        # Verify the update
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/settings/subscription",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        updated_data = verify_response.json()
        assert updated_data["grace_period_hours"] == new_grace_hours, f"Grace period not updated correctly"
        
        # Restore original value
        requests.put(
            f"{BASE_URL}/api/admin/settings/subscription",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "activation_amount": original_settings.get("activation_amount", 100),
                "renewal_amount": original_settings.get("renewal_amount", 70),
                "grace_period_hours": original_settings.get("grace_period_hours", 48)
            }
        )
        print(f"Successfully updated grace_period_hours to {new_grace_hours} and restored to original")


class TestUserDashboardSubscriptionStatus:
    """Test user dashboard returns subscription status and grace period fields"""
    
    @pytest.fixture
    def user_auth(self):
        """Authenticate a test user and return token"""
        # Send OTP
        otp_response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "email": TEST_USER_EMAIL
        })
        assert otp_response.status_code == 200, f"Failed to send OTP: {otp_response.text}"
        
        # Verify OTP (default OTP when SMTP not configured)
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "email": TEST_USER_EMAIL,
            "otp": DEFAULT_OTP
        })
        assert verify_response.status_code == 200, f"Failed to verify OTP: {verify_response.text}"
        data = verify_response.json()
        
        # Complete profile if new user
        if data.get("is_new_user") or not data.get("is_profile_complete"):
            profile_response = requests.post(
                f"{BASE_URL}/api/auth/complete-profile",
                headers={"Authorization": f"Bearer {data['token']}"},
                json={
                    "first_name": "Test",
                    "last_name": "Grace",
                    "mobile": "+1234567890"
                }
            )
            assert profile_response.status_code == 200, f"Failed to complete profile: {profile_response.text}"
        
        return data["token"]
    
    def test_dashboard_returns_subscription_status(self, user_auth):
        """Test dashboard API returns subscription_status field"""
        response = requests.get(
            f"{BASE_URL}/api/user/dashboard",
            headers={"Authorization": f"Bearer {user_auth}"}
        )
        assert response.status_code == 200, f"Failed to get dashboard: {response.text}"
        data = response.json()
        
        # Verify required fields for grace period feature
        assert "subscription_status" in data, "Missing subscription_status field"
        assert "temporary_wallet" in data, "Missing temporary_wallet field"
        
        # Subscription status should be one of: active, grace_period, inactive
        assert data["subscription_status"] in ["active", "grace_period", "inactive"], \
            f"Invalid subscription_status: {data['subscription_status']}"
        
        # Verify temporary_wallet is numeric
        assert isinstance(data["temporary_wallet"], (int, float)), \
            f"temporary_wallet should be numeric, got {type(data['temporary_wallet'])}"
        
        print(f"Dashboard subscription_status: {data['subscription_status']}")
        print(f"Dashboard temporary_wallet: {data['temporary_wallet']}")
        
        # grace_period_ends should be present if in grace_period
        if data["subscription_status"] == "grace_period":
            assert "grace_period_ends" in data, "Missing grace_period_ends when in grace_period"
        
        return data
    
    def test_dashboard_returns_subscription_settings(self, user_auth):
        """Test dashboard returns subscription_settings with grace_period_hours"""
        response = requests.get(
            f"{BASE_URL}/api/user/dashboard",
            headers={"Authorization": f"Bearer {user_auth}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "subscription_settings" in data, "Missing subscription_settings"
        settings = data["subscription_settings"]
        
        assert "grace_period_hours" in settings, "Missing grace_period_hours in subscription_settings"
        assert settings["grace_period_hours"] == 48, f"Expected grace_period_hours=48"
        
        print(f"Dashboard subscription_settings: {settings}")


class TestGracePeriodAdminEndpoints:
    """Test admin endpoints for grace period management"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_get_grace_period_users(self, admin_token):
        """Test GET grace period users endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/grace-period-users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to get grace period users: {response.text}"
        data = response.json()
        
        assert "users" in data, "Missing users field"
        assert "count" in data, "Missing count field"
        assert isinstance(data["users"], list), "users should be a list"
        assert isinstance(data["count"], int), "count should be an integer"
        
        print(f"Grace period users count: {data['count']}")
        if data["users"]:
            print(f"Sample user: {data['users'][0]}")
    
    def test_process_expired_grace_periods(self, admin_token):
        """Test process expired grace periods endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/process-expired-grace-periods",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to process expired grace periods: {response.text}"
        data = response.json()
        
        assert "message" in data, "Missing message field"
        assert "forfeited_count" in data, "Missing forfeited_count field"
        assert "forfeited_total" in data, "Missing forfeited_total field"
        
        print(f"Process expired grace periods result: {data}")


class TestNewUserWithTemporaryWallet:
    """Test that new users have temporary_wallet field initialized"""
    
    def test_new_user_has_temporary_wallet(self):
        """Test new user creation includes temporary_wallet field"""
        unique_email = f"test_temp_wallet_{datetime.now().strftime('%H%M%S%f')}@example.com"
        
        # Send OTP
        otp_response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "email": unique_email
        })
        assert otp_response.status_code == 200
        
        # Verify OTP (creates new user)
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "email": unique_email,
            "otp": DEFAULT_OTP
        })
        assert verify_response.status_code == 200
        data = verify_response.json()
        
        # New user should have temporary_wallet initialized to 0
        user = data.get("user", {})
        assert "temporary_wallet" in user, "New user missing temporary_wallet field"
        assert user["temporary_wallet"] == 0, f"New user temporary_wallet should be 0, got {user['temporary_wallet']}"
        
        print(f"New user temporary_wallet: {user['temporary_wallet']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
