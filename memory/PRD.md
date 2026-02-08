# GEM BOT - MLM Network Platform

## Original Problem Statement
Build an MLM project named GEM BOT with:
- Milk white background theme
- Dashboard, team, wallet, income, profile, transaction pages
- Terms and conditions, privacy policy pages
- Registration and login via email OTP
- MLM based on level income and monthly subscription
- Admin panel to control everything
- 10 levels of income distribution with configurable percentages
- Direct sponsor is level 1, with minimum direct referrals required for each level
- Mobile footer menu: dashboard, income, wallet, transaction, profile

## User Personas
1. **MLM Users** - Network marketers who join, refer others, and earn level income
2. **Admin** - Platform administrator who manages users, settings, and content

## Core Requirements
- Email OTP authentication (single page for login/register)
- 10-level MLM income structure
- $100 USDT activation, $70 USDT monthly renewal
- CoinConnect API integration for USDT wallet operations
- Admin panel with full control

## What's Been Implemented

### Date: Jan 2026
**Backend (FastAPI)**:
- ✅ Email OTP authentication flow
- ✅ User profile management with CoinConnect wallet creation
- ✅ 10-level income distribution system
- ✅ Automatic level income calculation on subscription payments
- ✅ Wallet balance check and withdrawal via CoinConnect API
- ✅ Admin authentication (email/password)
- ✅ Admin dashboard with stats
- ✅ User management (view, edit, activate/deactivate)
- ✅ Configurable level settings (percentage, min direct referrals)
- ✅ Configurable subscription amounts
- ✅ SMTP settings for email
- ✅ CoinConnect API settings
- ✅ Email template management
- ✅ Terms & Privacy content management
- ✅ Transaction history

**Frontend (React)**:
- ✅ Auth page with email OTP flow
- ✅ Profile setup for new users
- ✅ User dashboard with stats and referral link
- ✅ Team page with 10-level hierarchy view
- ✅ Wallet page (deposit address, withdrawal, balance)
- ✅ Income page (level-wise breakdown)
- ✅ Transactions page with filters
- ✅ Profile page (view/edit)
- ✅ Mobile bottom navigation
- ✅ Admin login page
- ✅ Admin dashboard
- ✅ Admin user management
- ✅ Admin level settings
- ✅ Admin settings (subscription, SMTP, CoinConnect)
- ✅ Admin transactions view
- ✅ Admin content management (terms, privacy, email templates)

## Prioritized Backlog

### P0 (Critical - Done)
- [x] Authentication system
- [x] User dashboard
- [x] Admin panel
- [x] Level income configuration
- [x] Mobile responsive design

### P1 (Important)
- [ ] Email notifications (requires SMTP setup)
- [ ] CoinConnect integration testing (requires real credentials)
- [ ] Referral tracking analytics

### P2 (Nice to Have)
- [ ] Push notifications
- [ ] Advanced reporting/analytics dashboard
- [ ] Multi-language support

## Next Tasks
1. Configure SMTP settings in admin panel for OTP emails
2. Configure CoinConnect API credentials for wallet operations
3. Set up production Terms & Privacy content
4. Add more detailed income analytics
5. Implement referral tree visualization

## Tech Stack
- **Backend**: FastAPI, MongoDB, Python
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Fonts**: Outfit (headings), Manrope (body)
- **Theme**: Milk white (#FDFCF8) with Emerald green (#047857) accents

## Admin Credentials
- Email: admin@gembot.com
- Password: admin123

## Update: Jan 2026 (Additional Features)

### Changes Made:
1. **Default OTP System**
   - When SMTP is not configured, OTP defaults to "000000"
   - Clear message shown to users: "Use default OTP: 000000 (SMTP not configured)"
   - Once SMTP is configured in admin panel, random OTPs will be generated and emailed

2. **Separate Activation/Renewal Percentages**
   - Level income now tracks separately for activation ($100) and renewal ($70) payments
   - Each level has `activation_percentage` and `renewal_percentage` configurable in admin

3. **Additional User Commissions**
   - Admin can add extra commission for specific users
   - Located above Level Settings in admin panel
   - Separate activation and renewal percentage for each user
   - These users get commission from ALL activations/renewals in the system

## Update: Dashboard & MT5 Flow

### Changes Made:
1. **Activate Button** - Replaced "Check Status" with "Activate Now" button
2. **Activation Popup** - Shows:
   - Activation fee ($100 USDT)
   - Deposit wallet address with copy button
   - Important notices (BEP20 network, confirmation time)
   - "I've Made the Payment - Verify" button

3. **MT5 Credentials Flow** - After account activation:
   - Popup appears automatically for MT5 submission
   - Fields: MT5 Server, Username, Password
   - Terms & Conditions checkbox required
   - Dashboard shows "MT5 Connected" status after submission

## Update: Dec 2025 - Team Page Enhancements

### Changes Made:
1. **Direct Team Tab** - Added dedicated "Direct Team" tab as the first/default tab
   - Shows only Level 1 (direct) referrals in a prominent card layout
   - Displays member details: name, email, join date, active/inactive status
   - Active/inactive member count summary cards when there are members
   - Empty state with call-to-action buttons when no direct referrals

2. **Share on WhatsApp Button** - Added in two locations:
   - Header area (alongside Refresh and Copy Link buttons)
   - Empty state area (alongside Copy Referral Link button)
   - Pre-filled WhatsApp message includes:
     - GEM BOT platform introduction
     - User's unique referral link
     - Key benefits ($100 activation, 10-level income)

3. **Three-Tab Layout** for Team page:
   - **Direct Team** (default) - Shows Level 1 referrals only
   - **All Levels** - Shows full 10-level hierarchy view
   - **All Members** - Shows flat list of all team members

### Files Modified:
- `/app/frontend/src/pages/Team.jsx` - Complete Team page with new tabs and WhatsApp share
