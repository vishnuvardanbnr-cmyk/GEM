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
  RefreshCw,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await userAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckActivation = async () => {
    setRefreshing(true);
    try {
      const response = await userAPI.checkActivation();
      if (response.data.activated) {
        toast.success("Account activated successfully!");
        fetchDashboard();
      } else {
        toast.info("Deposit not detected yet. Please wait for confirmation.");
      }
    } catch (error) {
      toast.error("Failed to check activation");
    } finally {
      setRefreshing(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${data?.user?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
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

      {/* Activation Alert */}
      {!isActive && (
        <Card className="border-amber-200 bg-amber-50" data-testid="activation-alert">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800">Activate Your Account</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Deposit ${data?.subscription_settings?.activation_amount || 100} USDT to your wallet to activate your account and start earning.
                  </p>
                  {user?.wallet_address && (
                    <p className="text-amber-600 text-xs mt-2 font-mono break-all">
                      Wallet: {user.wallet_address}
                    </p>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleCheckActivation}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={refreshing}
                data-testid="check-activation-btn"
              >
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Check Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Status */}
      {isActive && subscriptionExpires && (
        <Card className="border-emerald-200 bg-emerald-50" data-testid="subscription-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-emerald-800">Subscription Active</h3>
                <p className="text-emerald-700 text-sm mt-1">
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
