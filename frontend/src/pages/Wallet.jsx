import { useState, useEffect } from "react";
import { 
  Wallet as WalletIcon, 
  Copy, 
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeftRight,
  Send,
  TrendingUp,
  DollarSign,
  Users,
  Mail,
  Hash
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Wallet() {
  const [loading, setLoading] = useState(true);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Withdraw state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", to_address: "" });
  
  // Internal transfer state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferType, setTransferType] = useState("earnings_to_deposit");
  const [transferAmount, setTransferAmount] = useState("");
  
  // User transfer state
  const [userTransferOpen, setUserTransferOpen] = useState(false);
  const [userTransferring, setUserTransferring] = useState(false);
  const [userTransferForm, setUserTransferForm] = useState({
    amount: "",
    recipient_identifier: "",
    identifier_type: "email"
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

  const copyAddress = () => {
    if (data?.wallet_address) {
      navigator.clipboard.writeText(data.wallet_address);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Withdraw handler
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawForm.amount);
    const settings = data?.wallet_settings || {};
    const minWithdrawal = settings.min_withdrawal_amount || 10;
    const fee = settings.withdrawal_fee || 0;
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (amount < minWithdrawal) {
      toast.error(`Minimum withdrawal is $${minWithdrawal}`);
      return;
    }
    
    const totalDeduction = amount + fee;
    if (totalDeduction > (data?.earnings_balance || 0)) {
      toast.error(`Insufficient balance. Need $${totalDeduction} (amount + $${fee} fee)`);
      return;
    }
    
    if (!withdrawForm.to_address) {
      toast.error("Please enter withdrawal address");
      return;
    }

    setWithdrawing(true);
    try {
      const response = await userAPI.withdraw({
        amount,
        to_address: withdrawForm.to_address
      });
      toast.success(`Withdrawal successful! TxID: ${response.data.txn_id}`);
      setWithdrawOpen(false);
      setWithdrawForm({ amount: "", to_address: "" });
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  // Internal transfer handler (Earnings <-> Deposit)
  const handleInternalTransfer = async (e) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    const settings = data?.wallet_settings || {};
    const minTransfer = settings.min_transfer_amount || 1;
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (amount < minTransfer) {
      toast.error(`Minimum transfer is $${minTransfer}`);
      return;
    }
    
    const sourceBalance = transferType === "earnings_to_deposit" 
      ? (data?.earnings_balance || 0) 
      : (data?.deposit_balance || 0);
    
    if (amount > sourceBalance) {
      toast.error(`Insufficient balance. Available: $${sourceBalance.toFixed(2)}`);
      return;
    }

    setTransferring(true);
    try {
      const response = await userAPI.internalTransfer({
        amount,
        transfer_type: transferType
      });
      const feeMsg = response.data.fee > 0 ? ` (Fee: $${response.data.fee.toFixed(2)})` : "";
      toast.success(`Transfer successful! Net: $${response.data.net_amount.toFixed(2)}${feeMsg}`);
      setTransferOpen(false);
      setTransferAmount("");
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  // User-to-user transfer handler
  const handleUserTransfer = async (e) => {
    e.preventDefault();
    const amount = parseFloat(userTransferForm.amount);
    const settings = data?.wallet_settings || {};
    const minTransfer = settings.min_transfer_amount || 1;
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (amount < minTransfer) {
      toast.error(`Minimum transfer is $${minTransfer}`);
      return;
    }
    
    if (amount > (data?.deposit_balance || 0)) {
      toast.error(`Insufficient deposit balance. Available: $${(data?.deposit_balance || 0).toFixed(2)}`);
      return;
    }
    
    if (!userTransferForm.recipient_identifier) {
      toast.error("Please enter recipient's email or referral code");
      return;
    }

    setUserTransferring(true);
    try {
      const response = await userAPI.userTransfer({
        amount,
        recipient_identifier: userTransferForm.recipient_identifier,
        identifier_type: userTransferForm.identifier_type
      });
      const feeMsg = response.data.fee > 0 ? ` (Fee: $${response.data.fee.toFixed(2)})` : "";
      toast.success(`Sent $${response.data.net_amount.toFixed(2)} to ${response.data.recipient_email}${feeMsg}`);
      setUserTransferOpen(false);
      setUserTransferForm({ amount: "", recipient_identifier: "", identifier_type: "email" });
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Transfer failed");
    } finally {
      setUserTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const settings = data?.wallet_settings || {};
  const earningsBalance = data?.earnings_balance || 0;
  const depositBalance = data?.deposit_balance || 0;

  return (
    <div className="space-y-6 fade-in" data-testid="wallet-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
            Wallet
          </h1>
          <p className="text-neutral-500">Manage your USDT wallets and transfers</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshBalance}
          disabled={refreshingBalance}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshingBalance ? 'animate-spin' : ''}`} />
          Refresh Balances
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Earnings Balance */}
        <Card className="card-hover bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" data-testid="earnings-balance-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Earnings Balance
                </p>
                <p className="font-heading text-3xl md:text-4xl font-bold mt-1 num-display">
                  ${earningsBalance.toFixed(2)}
                </p>
                <p className="text-emerald-200 text-xs mt-2">USDT - Level Income</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <WalletIcon className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white"
                    disabled={earningsBalance <= 0}
                    data-testid="withdraw-btn"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-heading">Withdraw to External Wallet</DialogTitle>
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
                        Available: ${earningsBalance.toFixed(2)} | Min: ${settings.min_withdrawal_amount || 10}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Withdrawal Address (BEP20)</Label>
                      <Input
                        placeholder="0x..."
                        value={withdrawForm.to_address}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, to_address: e.target.value })}
                        className="h-12 rounded-xl font-mono text-sm"
                        data-testid="withdraw-address-input"
                      />
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-xl text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Withdrawal Fee</span>
                        <span className="font-medium">${settings.withdrawal_fee || 0} USDT</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-neutral-500">You'll Receive</span>
                        <span className="font-bold text-emerald-600">
                          ${Math.max((parseFloat(withdrawForm.amount) || 0) - (settings.withdrawal_fee || 0), 0).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                      disabled={withdrawing}
                      data-testid="confirm-withdraw-btn"
                    >
                      {withdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Withdrawal"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Balance */}
        <Card className="card-hover bg-gradient-to-br from-blue-500 to-blue-600 text-white" data-testid="deposit-balance-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Deposit Balance
                </p>
                <p className="font-heading text-3xl md:text-4xl font-bold mt-1 num-display">
                  ${depositBalance.toFixed(2)}
                </p>
                <p className="text-blue-200 text-xs mt-2">USDT - For Activation/Renewal</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Dialog open={userTransferOpen} onOpenChange={setUserTransferOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white"
                    disabled={depositBalance <= 0}
                    data-testid="send-user-btn"
                  >
                    <Send className="w-4 h-4 mr-1" /> Send to User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-heading">Send to Another User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUserTransfer} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Amount (USDT)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={userTransferForm.amount}
                        onChange={(e) => setUserTransferForm({ ...userTransferForm, amount: e.target.value })}
                        className="h-12 rounded-xl"
                        data-testid="user-transfer-amount-input"
                      />
                      <p className="text-xs text-neutral-500">
                        Available: ${depositBalance.toFixed(2)} | Min: ${settings.min_transfer_amount || 1}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Find Recipient By</Label>
                      <Tabs value={userTransferForm.identifier_type} onValueChange={(v) => setUserTransferForm({ ...userTransferForm, identifier_type: v })}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="email" className="gap-2">
                            <Mail className="w-4 h-4" /> Email
                          </TabsTrigger>
                          <TabsTrigger value="referral_code" className="gap-2">
                            <Hash className="w-4 h-4" /> Referral Code
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    <div className="space-y-2">
                      <Label>{userTransferForm.identifier_type === "email" ? "Recipient Email" : "Recipient Referral Code"}</Label>
                      <Input
                        placeholder={userTransferForm.identifier_type === "email" ? "user@example.com" : "GEMXXXX"}
                        value={userTransferForm.recipient_identifier}
                        onChange={(e) => setUserTransferForm({ ...userTransferForm, recipient_identifier: e.target.value })}
                        className="h-12 rounded-xl"
                        data-testid="user-transfer-recipient-input"
                      />
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-xl text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Transfer Fee ({settings.user_transfer_fee || 0}%)</span>
                        <span className="font-medium">
                          ${((parseFloat(userTransferForm.amount) || 0) * (settings.user_transfer_fee || 0) / 100).toFixed(2)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-neutral-500">Recipient Gets</span>
                        <span className="font-bold text-blue-600">
                          ${((parseFloat(userTransferForm.amount) || 0) * (1 - (settings.user_transfer_fee || 0) / 100)).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
                      disabled={userTransferring}
                      data-testid="confirm-user-transfer-btn"
                    >
                      {userTransferring ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Transfer"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Internal Transfer Card */}
      <Card data-testid="internal-transfer-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-600" />
            Internal Transfer
          </CardTitle>
          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700" data-testid="internal-transfer-btn">
                <ArrowLeftRight className="w-4 h-4 mr-2" /> Transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Internal Wallet Transfer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInternalTransfer} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Transfer Direction</Label>
                  <Tabs value={transferType} onValueChange={setTransferType}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="earnings_to_deposit" className="text-xs">
                        Earnings → Deposit
                      </TabsTrigger>
                      <TabsTrigger value="deposit_to_earnings" className="text-xs">
                        Deposit → Earnings
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-2">
                  <Label>Amount (USDT)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="h-12 rounded-xl"
                    data-testid="internal-transfer-amount-input"
                  />
                  <p className="text-xs text-neutral-500">
                    Available: ${transferType === "earnings_to_deposit" ? earningsBalance.toFixed(2) : depositBalance.toFixed(2)} | 
                    Min: ${settings.min_transfer_amount || 1}
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl text-sm space-y-2">
                  {(() => {
                    const feePercent = transferType === "earnings_to_deposit" 
                      ? (settings.earnings_to_deposit_fee || 0)
                      : (settings.deposit_to_earnings_fee || 0);
                    const amount = parseFloat(transferAmount) || 0;
                    const fee = amount * (feePercent / 100);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Transfer Fee ({feePercent}%)</span>
                          <span className="font-medium">${fee.toFixed(2)} USDT</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-neutral-500">Net Amount</span>
                          <span className="font-bold text-purple-600">${(amount - fee).toFixed(2)} USDT</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <Button 
                  type="submit"
                  className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700"
                  disabled={transferring}
                  data-testid="confirm-internal-transfer-btn"
                >
                  {transferring ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Transfer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-sm text-emerald-600 font-medium">Earnings → Deposit</p>
              <p className="text-xs text-emerald-500 mt-1">
                Fee: {settings.earnings_to_deposit_fee || 0}%
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600 font-medium">Deposit → Earnings</p>
              <p className="text-xs text-blue-500 mt-1">
                Fee: {settings.deposit_to_earnings_fee || 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Up Deposit Wallet */}
      <Card data-testid="topup-card">
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
                  <p className="font-semibold">Important:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Only send USDT (BEP20 Network)</li>
                    <li>Minimum deposit: $10 USDT</li>
                    <li>Confirmation time: 5-30 minutes</li>
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

      {/* Transaction History */}
      <Card data-testid="wallet-history-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.withdrawals?.length > 0 || data?.transfers?.length > 0) ? (
              [...(data?.withdrawals || []), ...(data?.transfers || [])]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 15)
                .map((txn) => (
                  <div 
                    key={txn.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        txn.type === "withdrawal" ? "bg-red-100" :
                        txn.type === "internal_transfer" ? "bg-purple-100" :
                        txn.type === "user_transfer_sent" ? "bg-orange-100" :
                        txn.type === "user_transfer_received" ? "bg-green-100" :
                        "bg-emerald-100"
                      }`}>
                        {txn.type === "withdrawal" ? (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        ) : txn.type === "internal_transfer" ? (
                          <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                        ) : txn.type === "user_transfer_sent" ? (
                          <Send className="w-5 h-5 text-orange-600" />
                        ) : txn.type === "user_transfer_received" ? (
                          <ArrowDownRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">
                          {txn.type === "withdrawal" && "Withdrawal"}
                          {txn.type === "internal_transfer" && `Internal (${txn.transfer_type?.replace("_", " → ")})`}
                          {txn.type === "user_transfer_sent" && `Sent to ${txn.recipient_email}`}
                          {txn.type === "user_transfer_received" && `Received from ${txn.sender_email}`}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(txn.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-heading font-bold num-display ${
                        txn.type === "user_transfer_received" ? "text-green-600" : 
                        txn.type === "withdrawal" || txn.type === "user_transfer_sent" ? "text-red-600" : 
                        "text-purple-600"
                      }`}>
                        {txn.type === "user_transfer_received" ? "+" : "-"}${txn.amount?.toFixed(2)}
                      </p>
                      {txn.fee > 0 && (
                        <p className="text-xs text-neutral-400">Fee: ${txn.fee?.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-neutral-500 text-center py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
