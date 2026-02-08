import requests
import sys
import json
from datetime import datetime

class GemBotAPITester:
    def __init__(self, base_url="https://gembot-network.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.user_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, is_admin=False, require_auth=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if require_auth:
            token = self.admin_token if is_admin else self.user_token
            if token:
                headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response": None,
                "error": None
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result["response"] = response.json()
                except:
                    result["response"] = response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    result["error"] = response.json()
                except:
                    result["error"] = response.text
                print(f"   Error: {result['error']}")

            self.test_results.append(result)
            return success, result.get("response", {})

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "response": None,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_root_endpoint(self):
        """Test root endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200,
            require_auth=False
        )
        return success

    def test_send_otp(self, email):
        """Test OTP sending"""
        success, response = self.run_test(
            "Send OTP",
            "POST",
            "auth/send-otp",
            200,
            data={"email": email},
            require_auth=False
        )
        return success, response

    def test_verify_otp(self, email, otp):
        """Test OTP verification"""
        success, response = self.run_test(
            "Verify OTP",
            "POST",
            "auth/verify-otp",
            200,
            data={"email": email, "otp": otp},
            require_auth=False
        )
        if success and 'token' in response:
            self.user_token = response['token']
        return success, response

    def test_admin_login(self, email, password):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data={"email": email, "password": password},
            require_auth=False
        )
        if success and 'token' in response:
            self.admin_token = response['token']
        return success, response

    def test_user_profile(self):
        """Test user profile endpoint"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "user/profile",
            200
        )
        return success, response

    def test_complete_profile(self, profile_data, referral_code=None):
        """Test profile completion"""
        endpoint = "auth/complete-profile"
        if referral_code:
            endpoint += f"?referral_code={referral_code}"
        
        success, response = self.run_test(
            "Complete Profile",
            "POST",
            endpoint,
            200,
            data=profile_data
        )
        return success, response

    def test_user_dashboard(self):
        """Test user dashboard"""
        success, response = self.run_test(
            "User Dashboard",
            "GET",
            "user/dashboard",
            200
        )
        return success, response

    def test_user_team(self):
        """Test user team endpoint"""
        success, response = self.run_test(
            "User Team",
            "GET",
            "user/team",
            200
        )
        return success, response

    def test_user_income(self):
        """Test user income endpoint"""
        success, response = self.run_test(
            "User Income",
            "GET",
            "user/income",
            200
        )
        return success, response

    def test_user_wallet(self):
        """Test user wallet endpoint"""
        success, response = self.run_test(
            "User Wallet",
            "GET",
            "user/wallet",
            200
        )
        return success, response

    def test_user_transactions(self):
        """Test user transactions endpoint"""
        success, response = self.run_test(
            "User Transactions",
            "GET",
            "user/transactions",
            200
        )
        return success, response

    def test_admin_dashboard(self):
        """Test admin dashboard"""
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200,
            is_admin=True
        )
        return success, response

    def test_admin_users(self):
        """Test admin users list"""
        success, response = self.run_test(
            "Admin Users List",
            "GET",
            "admin/users",
            200,
            is_admin=True
        )
        return success, response

    def test_admin_levels(self):
        """Test admin level settings"""
        success, response = self.run_test(
            "Admin Level Settings",
            "GET",
            "admin/settings/levels",
            200,
            is_admin=True
        )
        return success, response

    def test_admin_subscription(self):
        """Test admin subscription settings"""
        success, response = self.run_test(
            "Admin Subscription Settings",
            "GET",
            "admin/settings/subscription",
            200,
            is_admin=True
        )
        return success, response

    def test_admin_smtp(self):
        """Test admin SMTP settings"""
        success, response = self.run_test(
            "Admin SMTP Settings",
            "GET",
            "admin/settings/smtp",
            200,
            is_admin=True
        )
        return success, response

    def test_admin_coinconnect(self):
        """Test admin CoinConnect settings"""
        success, response = self.run_test(
            "Admin CoinConnect Settings",
            "GET",
            "admin/settings/coinconnect",
            200,
            is_admin=True
        )
        return success, response

    def test_admin_transactions(self):
        """Test admin transactions"""
        success, response = self.run_test(
            "Admin Transactions",
            "GET",
            "admin/transactions",
            200,
            is_admin=True
        )
        return success, response

    def test_public_terms(self):
        """Test public terms endpoint"""
        success, response = self.run_test(
            "Public Terms",
            "GET",
            "public/terms",
            200,
            require_auth=False
        )
        return success, response

    def test_public_privacy(self):
        """Test public privacy endpoint"""
        success, response = self.run_test(
            "Public Privacy",
            "GET",
            "public/privacy",
            200,
            require_auth=False
        )
        return success, response

def main():
    print("🚀 Starting GEM BOT MLM Platform API Testing...")
    tester = GemBotAPITester()
    
    # Test user email for OTP
    test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@example.com"
    admin_email = "admin@gembot.com"
    admin_password = "admin123"
    
    print(f"📧 Test Email: {test_email}")
    print(f"👑 Admin: {admin_email}")
    
    # Test basic endpoints
    print("\n=== BASIC ENDPOINTS ===")
    tester.test_root_endpoint()
    tester.test_public_terms()
    tester.test_public_privacy()
    
    # Test auth flow
    print("\n=== USER AUTHENTICATION ===")
    otp_success, otp_response = tester.test_send_otp(test_email)
    
    if otp_success:
        # Since we can't get real OTP, let's use a mock OTP to test the flow
        # In real scenario, this would fail but we can still test the endpoint structure
        tester.test_verify_otp(test_email, "123456")
    
    # Test admin login
    print("\n=== ADMIN AUTHENTICATION ===")
    admin_success, admin_response = tester.test_admin_login(admin_email, admin_password)
    
    # Test user endpoints (will likely fail without valid token)
    print("\n=== USER ENDPOINTS ===")
    tester.test_user_profile()
    tester.test_user_dashboard()
    tester.test_user_team()
    tester.test_user_income()
    tester.test_user_wallet()
    tester.test_user_transactions()
    
    # Test admin endpoints (only if admin login successful)
    print("\n=== ADMIN ENDPOINTS ===")
    if admin_success:
        tester.test_admin_dashboard()
        tester.test_admin_users()
        tester.test_admin_levels()
        tester.test_admin_subscription()
        tester.test_admin_smtp()
        tester.test_admin_coinconnect()
        tester.test_admin_transactions()
    else:
        print("⚠️ Skipping admin tests - login failed")
    
    # Print results summary
    print(f"\n📊 TEST RESULTS SUMMARY")
    print(f"Total tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    # Save detailed results
    with open('/tmp/api_test_results.json', 'w') as f:
        json.dump(tester.test_results, f, indent=2)
    print(f"📄 Detailed results saved to /tmp/api_test_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())