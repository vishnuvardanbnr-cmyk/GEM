import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Copy, 
  Check,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  Zap,
  Server,
  User,
  Lock,
  FileText,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState(null);
  
  // Activation state
  const [activating, setActivating] = useState(false);
  
  // MT5 submission state
  const [mt5Open, setMt5Open] = useState(false);
  const [submittingMt5, setSubmittingMt5] = useState(false);
  const [mt5Form, setMt5Form] = useState({
    mt5_server: "",
    mt5_username: "",
    mt5_password: "",
    terms_accepted: false
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await userAPI.getDashboard();
      setData(response.data);
      
      // Check if user is active but hasn't submitted MT5
      const user = response.data.user;
      if (user?.is_active && !user?.mt5_submitted) {
        setMt5Open(true);
      }
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const response = await userAPI.checkActivation();
      if (response.data.activated) {
        toast.success("Account activated successfully!");
        // Show MT5 modal after activation
        setMt5Open(true);
        fetchDashboard();
      } else {
        toast.error("Insufficient deposit balance. Please top up from Wallet page.");
      }
    } catch (error) {
      toast.error("Failed to check activation");
    } finally {
      setActivating(false);
    }
  };

  const handleSubmitMT5 = async () => {
    if (!mt5Form.mt5_server || !mt5Form.mt5_username || !mt5Form.mt5_password) {
      toast.error("Please fill all MT5 fields");
      return;
    }
    if (!mt5Form.terms_accepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setSubmittingMt5(true);
    try {
      await userAPI.submitMT5(mt5Form);
      toast.success("MT5 credentials submitted successfully!");
      setMt5Open(false);
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit MT5 credentials");
    } finally {
      setSubmittingMt5(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${data?.user?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyWalletAddress = () => {
    if (data?.user?.wallet_address) {
      navigator.clipboard.writeText(data.user.wallet_address);
      setAddressCopied(true);
      toast.success("Wallet address copied!");
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const user = data?.user;
  const isActive = user?.is_active;
  const subscriptionExpires = user?.subscription_expires ? new Date(user.subscription_expires) : null;
  const daysLeft = subscriptionExpires ? Math.ceil((subscriptionExpires - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  const activationAmount = data?.subscription_settings?.activation_amount || 100;

  return (
    <div className="space-y-6 fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
            Welcome, {user?.first_name || "User"}!
          </h1>
          <p className="text-neutral-500">Here's your network overview</p>
        </div>
        <Badge 
          className={`self-start ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
          data-testid="account-status-badge"
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Activation Alert - Show Activate Button */}
      {!isActive && (
        <Card className="border-amber-200 bg-amber-50" data-testid="activation-alert">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800">Activate Your Account</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Deposit ${activationAmount} USDT to activate your account and start earning.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setActivateOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white btn-glow"
                data-testid="activate-btn"
              >
                <Zap className="w-4 h-4 mr-2" />
                Activate Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activation Popup */}
      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Activate Your Account
            </DialogTitle>
            <DialogDescription>
              Complete the payment to activate your account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Activation Fee */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-medium">Activation Fee</span>
                <span className="font-heading text-2xl font-bold text-emerald-700">
                  ${activationAmount} USDT
                </span>
              </div>
              <p className="text-emerald-600 text-sm mt-2">
                One-time activation payment (BEP20 Network)
              </p>
            </div>

            {/* Wallet Address */}
            <div className="space-y-2">
              <Label>Deposit to this address (USDT BEP20)</Label>
              <div className="flex gap-2">
                <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 font-mono text-sm text-neutral-600 break-all border">
                  {user?.wallet_address || "Wallet not generated"}
                </div>
                <Button 
                  onClick={copyWalletAddress}
                  variant="outline"
                  className="shrink-0"
                  disabled={!user?.wallet_address}
                  data-testid="copy-wallet-btn"
                >
                  {addressCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-semibold">Important:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Only send USDT on BEP20 (BSC) network</li>
                    <li>Send exactly ${activationAmount} USDT or more</li>
                    <li>Wait for blockchain confirmation (5-30 mins)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Check Button */}
            <Button 
              onClick={handleCheckActivation}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              disabled={refreshing}
              data-testid="check-payment-btn"
            >
              {refreshing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  I've Made the Payment - Verify
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MT5 Credentials Popup */}
      <Dialog open={mt5Open} onOpenChange={(open) => {
        // Only allow closing if MT5 is already submitted
        if (!open && user?.mt5_submitted) {
          setMt5Open(false);
        } else if (!open && !user?.mt5_submitted && user?.is_active) {
          toast.info("Please submit your MT5 credentials to continue");
        } else {
          setMt5Open(open);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              Connect Your MT5 Account
            </DialogTitle>
            <DialogDescription>
              Submit your MetaTrader 5 credentials to complete setup
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="mt5_server">MT5 Server</Label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="mt5_server"
                  placeholder="e.g., MetaQuotes-Demo"
                  value={mt5Form.mt5_server}
                  onChange={(e) => setMt5Form({ ...mt5Form, mt5_server: e.target.value })}
                  className="pl-10 h-12 rounded-xl"
                  data-testid="mt5-server-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mt5_username">MT5 Username/Login</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="mt5_username"
                  placeholder="Your MT5 login ID"
                  value={mt5Form.mt5_username}
                  onChange={(e) => setMt5Form({ ...mt5Form, mt5_username: e.target.value })}
                  className="pl-10 h-12 rounded-xl"
                  data-testid="mt5-username-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mt5_password">MT5 Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="mt5_password"
                  type="password"
                  placeholder="Your MT5 password"
                  value={mt5Form.mt5_password}
                  onChange={(e) => setMt5Form({ ...mt5Form, mt5_password: e.target.value })}
                  className="pl-10 h-12 rounded-xl"
                  data-testid="mt5-password-input"
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-3 p-4 bg-neutral-50 rounded-xl">
              <Checkbox
                id="terms"
                checked={mt5Form.terms_accepted}
                onCheckedChange={(checked) => setMt5Form({ ...mt5Form, terms_accepted: checked })}
                data-testid="mt5-terms-checkbox"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Accept Terms & Conditions
                </label>
                <p className="text-sm text-neutral-500">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-emerald-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" className="text-emerald-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSubmitMT5}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              disabled={submittingMt5 || !mt5Form.terms_accepted}
              data-testid="submit-mt5-btn"
            >
              {submittingMt5 ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Submit MT5 Credentials
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MT5 Submitted Status */}
      {isActive && user?.mt5_submitted && (
        <Card className="border-emerald-200 bg-emerald-50" data-testid="mt5-status-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Server className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-800">MT5 Connected</h3>
                  <p className="text-emerald-700 text-sm">
                    Server: {user.mt5_server} | Login: {user.mt5_username}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Status */}
      {isActive && subscriptionExpires && (
        <Card className="border-blue-200 bg-blue-50" data-testid="subscription-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-blue-800">Subscription Active</h3>
                <p className="text-blue-700 text-sm mt-1">
                  {daysLeft > 0 ? `${daysLeft} days remaining` : "Expires today"}
                </p>
              </div>
              <Progress value={Math.max((daysLeft / 30) * 100, 0)} className="w-full md:w-48 h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover" data-testid="stat-wallet-balance">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs md:text-sm">Wallet Balance</p>
                <p className="font-heading text-lg md:text-2xl font-bold text-neutral-900 num-display">
                  ${(data?.internal_balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-total-income">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs md:text-sm">Total Income</p>
                <p className="font-heading text-lg md:text-2xl font-bold text-neutral-900 num-display">
                  ${(data?.total_income || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-direct-referrals">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs md:text-sm">Direct Referrals</p>
                <p className="font-heading text-lg md:text-2xl font-bold text-neutral-900 num-display">
                  {data?.direct_referrals || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-total-team">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs md:text-sm">Total Team</p>
                <p className="font-heading text-lg md:text-2xl font-bold text-neutral-900 num-display">
                  {data?.total_team || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Card */}
      <Card className="border-emerald-100" data-testid="referral-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 text-sm font-mono text-neutral-600 break-all">
              {window.location.origin}/auth?ref={user?.referral_code}
            </div>
            <Button 
              onClick={copyReferralLink}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="copy-referral-btn"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-neutral-500 text-sm mt-3">
            Share this link to invite people to your network
          </p>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card data-testid="recent-transactions-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Recent Transactions</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/transactions")}
            className="text-emerald-600"
          >
            View All
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {data?.recent_transactions?.length > 0 ? (
            <div className="space-y-3">
              {data.recent_transactions.map((txn) => (
                <div 
                  key={txn.id} 
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-neutral-900 capitalize">
                      {txn.type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`font-heading font-bold num-display ${
                    txn.type === "withdrawal" ? "text-red-600" : "text-emerald-600"
                  }`}>
                    {txn.type === "withdrawal" ? "-" : "+"}${txn.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-4">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
