import { useState, useEffect } from "react";
import { 
  Settings,
  Save,
  Loader2,
  Mail,
  Server,
  Key,
  DollarSign,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { adminAPI } from "../../lib/api";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  
  const [subscription, setSubscription] = useState({
    activation_amount: 100,
    renewal_amount: 70
  });
  
  const [smtp, setSmtp] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    from_email: "",
    from_name: "GEM BOT"
  });
  
  const [coinconnect, setCoinconnect] = useState({
    cca_key: "",
    cca_secret: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [subRes, smtpRes, ccRes] = await Promise.all([
        adminAPI.getSubscription(),
        adminAPI.getSMTP(),
        adminAPI.getCoinConnect()
      ]);
      
      if (subRes.data) setSubscription(subRes.data);
      if (smtpRes.data && Object.keys(smtpRes.data).length > 0) setSmtp(smtpRes.data);
      if (ccRes.data) setCoinconnect(ccRes.data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSubscription = async () => {
    setSaving({ ...saving, subscription: true });
    try {
      await adminAPI.updateSubscription(subscription);
      toast.success("Subscription settings saved");
    } catch (error) {
      toast.error("Failed to save subscription settings");
    } finally {
      setSaving({ ...saving, subscription: false });
    }
  };

  const saveSMTP = async () => {
    setSaving({ ...saving, smtp: true });
    try {
      await adminAPI.updateSMTP(smtp);
      toast.success("SMTP settings saved");
    } catch (error) {
      toast.error("Failed to save SMTP settings");
    } finally {
      setSaving({ ...saving, smtp: false });
    }
  };

  const saveCoinConnect = async () => {
    setSaving({ ...saving, coinconnect: true });
    try {
      await adminAPI.updateCoinConnect(coinconnect);
      toast.success("CoinConnect settings saved");
    } catch (error) {
      toast.error("Failed to save CoinConnect settings");
    } finally {
      setSaving({ ...saving, coinconnect: false });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="admin-settings-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
          Settings
        </h1>
        <p className="text-neutral-500">Configure system settings</p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription" data-testid="subscription-tab">
            <DollarSign className="w-4 h-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="smtp" data-testid="smtp-tab">
            <Mail className="w-4 h-4 mr-2" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="coinconnect" data-testid="coinconnect-tab">
            <Key className="w-4 h-4 mr-2" />
            CoinConnect
          </TabsTrigger>
        </TabsList>

        {/* Subscription Settings */}
        <TabsContent value="subscription">
          <Card data-testid="subscription-settings-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Subscription Settings
              </CardTitle>
              <CardDescription>
                Configure activation and renewal amounts (USDT)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activation Amount (USDT)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={subscription.activation_amount}
                    onChange={(e) => setSubscription({ ...subscription, activation_amount: parseFloat(e.target.value) || 0 })}
                    className="h-12 rounded-xl"
                    data-testid="activation-amount-input"
                  />
                  <p className="text-xs text-neutral-500">Amount required for new user activation</p>
                </div>
                <div className="space-y-2">
                  <Label>Renewal Amount (USDT)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={subscription.renewal_amount}
                    onChange={(e) => setSubscription({ ...subscription, renewal_amount: parseFloat(e.target.value) || 0 })}
                    className="h-12 rounded-xl"
                    data-testid="renewal-amount-input"
                  />
                  <p className="text-xs text-neutral-500">Monthly renewal amount</p>
                </div>
              </div>
              <Button 
                onClick={saveSubscription}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={saving.subscription}
                data-testid="save-subscription-btn"
              >
                {saving.subscription ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Subscription Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Settings */}
        <TabsContent value="smtp">
          <Card data-testid="smtp-settings-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                SMTP Settings
              </CardTitle>
              <CardDescription>
                Configure email server for OTP and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    placeholder="smtp.example.com"
                    value={smtp.host}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="smtp-host-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    placeholder="587"
                    value={smtp.port}
                    onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 587 })}
                    className="h-12 rounded-xl"
                    data-testid="smtp-port-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    placeholder="your@email.com"
                    value={smtp.username}
                    onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="smtp-username-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets.smtp ? "text" : "password"}
                      placeholder="••••••••"
                      value={smtp.password}
                      onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                      className="h-12 rounded-xl pr-10"
                      data-testid="smtp-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets({ ...showSecrets, smtp: !showSecrets.smtp })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showSecrets.smtp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    placeholder="noreply@example.com"
                    value={smtp.from_email}
                    onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="smtp-from-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    placeholder="GEM BOT"
                    value={smtp.from_name}
                    onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="smtp-from-name-input"
                  />
                </div>
              </div>
              <Button 
                onClick={saveSMTP}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={saving.smtp}
                data-testid="save-smtp-btn"
              >
                {saving.smtp ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save SMTP Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CoinConnect Settings */}
        <TabsContent value="coinconnect">
          <Card data-testid="coinconnect-settings-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                CoinConnect API Settings
              </CardTitle>
              <CardDescription>
                Configure CoinConnect API credentials for USDT transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CCA Key</Label>
                <Input
                  placeholder="Enter your CCA Key"
                  value={coinconnect.cca_key}
                  onChange={(e) => setCoinconnect({ ...coinconnect, cca_key: e.target.value })}
                  className="h-12 rounded-xl font-mono"
                  data-testid="cca-key-input"
                />
              </div>
              <div className="space-y-2">
                <Label>CCA Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecrets.cca ? "text" : "password"}
                    placeholder="Enter your CCA Secret"
                    value={coinconnect.cca_secret}
                    onChange={(e) => setCoinconnect({ ...coinconnect, cca_secret: e.target.value })}
                    className="h-12 rounded-xl font-mono pr-10"
                    data-testid="cca-secret-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets({ ...showSecrets, cca: !showSecrets.cca })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showSecrets.cca ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button 
                onClick={saveCoinConnect}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={saving.coinconnect}
                data-testid="save-coinconnect-btn"
              >
                {saving.coinconnect ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save CoinConnect Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
