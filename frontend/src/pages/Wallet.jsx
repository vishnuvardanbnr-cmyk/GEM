import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Wallet as WalletIcon, 
  Copy, 
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Zap,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Wallet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [activating, setActivating] = useState(false);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    to_address: ""
  });

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const [walletRes, dashRes] = await Promise.all([
        userAPI.getWallet(),
        userAPI.getDashboard()
      ]);
      setData(walletRes.data);
      setUser(dashRes.data.user);
    } catch (error) {
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    setRefreshingBalance(true);
    try {
      const response = await userAPI.getWallet();
      setData(response.data);
      toast.success("Balance refreshed");
    } catch (error) {
      toast.error("Failed to refresh balance");
    } finally {
      setRefreshingBalance(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const response = await userAPI.checkActivation();
      if (response.data.activated) {
        toast.success("Account activated successfully!");
        setUser(response.data.user);
        // Redirect to dashboard to complete MT5 setup
        navigate("/");
      } else {
        toast.error("Insufficient balance. Please top up your deposit wallet.");
      }
    } catch (error) {
      toast.error("Failed to activate account");
    } finally {
      setActivating(false);
    }
  };

  const copyAddress = () => {
    if (data?.wallet_address) {
      navigator.clipboard.writeText(data.wallet_address);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (amount > (data?.internal_balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }
    
    if (!withdrawForm.to_address) {
      toast.error("Please enter withdrawal address");
      return;
    }

    setWithdrawing(true);
    try {
      await userAPI.withdraw({
        amount,
        to_address: withdrawForm.to_address
      });
      toast.success("Withdrawal processed successfully!");
      setWithdrawOpen(false);
      setWithdrawForm({ amount: "", to_address: "" });
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isActive = user?.is_active;
  const activationAmount = 100; // Could come from settings
  const depositBalance = data?.external_balance || 0;
  const canActivate = depositBalance >= activationAmount;

  return (
    <div className="space-y-6 fade-in" data-testid="wallet-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
          Wallet
        </h1>
        <p className="text-neutral-500">Manage your USDT wallet</p>
      </div>

      {/* Activation Card - Show if not active */}
      {!isActive && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50" data-testid="activation-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-amber-800">
                    Activate Your Account
                  </h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Top up ${activationAmount} USDT to your deposit wallet to activate
                  </p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-amber-600">Deposit Balance</span>
                      <span className="font-semibold text-amber-800">${depositBalance.toFixed(2)} / ${activationAmount}</span>
                    </div>
                    <Progress 
                      value={Math.min((depositBalance / activationAmount) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleActivate}
                className={`${canActivate ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-neutral-300 cursor-not-allowed'}`}
                disabled={!canActivate || activating}
                data-testid="activate-account-btn"
              >
                {activating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : canActivate ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Activate Now
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Top Up Required
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Earnings Balance - Withdrawable */}
        <Card className="card-hover bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" data-testid="internal-balance-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Earnings Balance</p>
                <p className="font-heading text-3xl md:text-4xl font-bold mt-1 num-display">
                  ${(data?.internal_balance || 0).toFixed(2)}
                </p>
                <p className="text-emerald-200 text-xs mt-2">USDT • Withdrawable</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <WalletIcon className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Balance - For Activation/Renewal */}
        <Card className="card-hover" data-testid="external-balance-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Deposit Balance</p>
                <p className="font-heading text-3xl md:text-4xl font-bold mt-1 num-display text-neutral-900">
                  ${(data?.external_balance || 0).toFixed(2)}
                </p>
                <p className="text-neutral-400 text-xs mt-2">USDT • For Activation/Renewal</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshBalance}
                disabled={refreshingBalance}
                className="shrink-0"
                data-testid="refresh-balance-btn"
              >
                <RefreshCw className={`w-4 h-4 ${refreshingBalance ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Address - Top Up Section */}
      <Card data-testid="deposit-address-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-emerald-600" />
            Top Up Deposit Wallet (USDT BEP20)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.wallet_address ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 font-mono text-sm text-neutral-600 break-all border">
                  {data.wallet_address}
                </div>
                <Button 
                  onClick={copyAddress}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="copy-address-btn"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              
              <div className="flex items-start gap-2 bg-blue-50 p-4 rounded-xl">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold">How to Top Up:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Send USDT (BEP20) to the address above</li>
                    <li>Minimum: $10 USDT</li>
                    <li>Wait 5-30 minutes for blockchain confirmation</li>
                    <li>Click "Refresh" to update your balance</li>
                    {!isActive && <li className="text-emerald-700 font-medium">Top up ${activationAmount} USDT to activate your account</li>}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-neutral-600">Complete your profile to get a deposit address</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Section - Only show if active */}
      {isActive && (
        <Card data-testid="withdraw-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-purple-600" />
              Withdraw Earnings
            </CardTitle>
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={(data?.internal_balance || 0) <= 0}
                  data-testid="withdraw-btn"
                >
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Withdraw USDT</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleWithdraw} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Amount (USDT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                      className="h-12 rounded-xl"
                      data-testid="withdraw-amount-input"
                    />
                    <p className="text-xs text-neutral-500">
                      Available: ${(data?.internal_balance || 0).toFixed(2)} USDT
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Withdrawal Address (BEP20)</Label>
                    <Input
                      placeholder="0x..."
                      value={withdrawForm.to_address}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, to_address: e.target.value })}
                      className="h-12 rounded-xl font-mono"
                      data-testid="withdraw-address-input"
                    />
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-xl text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Network Fee</span>
                      <span className="font-medium">$1.00 USDT</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-neutral-500">You'll Receive</span>
                      <span className="font-medium">
                        ${Math.max((parseFloat(withdrawForm.amount) || 0) - 1, 0).toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700"
                    disabled={withdrawing}
                    data-testid="confirm-withdraw-btn"
                  >
                    {withdrawing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Confirm Withdrawal"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-500 text-sm">
              Withdraw your earnings to any BEP20 compatible wallet. Minimum withdrawal: $5 USDT.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card data-testid="wallet-history-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.withdrawals?.length > 0 || data?.deposits?.length > 0 ? (
              <>
                {[...(data?.withdrawals || []), ...(data?.deposits || [])]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 10)
                  .map((txn) => (
                    <div 
                      key={txn.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          txn.type === "withdrawal" 
                            ? "bg-purple-100" 
                            : "bg-emerald-100"
                        }`}>
                          {txn.type === "withdrawal" ? (
                            <ArrowUpRight className="w-5 h-5 text-purple-600" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 capitalize">
                            {txn.type}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(txn.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-heading font-bold num-display ${
                          txn.type === "withdrawal" ? "text-purple-600" : "text-emerald-600"
                        }`}>
                          {txn.type === "withdrawal" ? "-" : "+"}${txn.amount.toFixed(2)}
                        </p>
                        <Badge 
                          className={
                            txn.status === "completed" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-amber-100 text-amber-700"
                          }
                        >
                          {txn.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </>
            ) : (
              <p className="text-neutral-500 text-center py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
