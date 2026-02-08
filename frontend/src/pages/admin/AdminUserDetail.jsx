import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Wallet,
  Calendar,
  Users,
  DollarSign,
  Loader2,
  Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import { adminAPI } from "../../lib/api";

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [editData, setEditData] = useState({
    is_active: false,
    wallet_balance: 0
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await adminAPI.getUser(userId);
      setData(response.data);
      setEditData({
        is_active: response.data.user.is_active,
        wallet_balance: response.data.user.wallet_balance || 0
      });
    } catch (error) {
      toast.error("Failed to load user");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateUser(userId, editData);
      toast.success("User updated successfully");
      fetchUser();
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6 fade-in" data-testid="admin-user-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
            User Details
          </h1>
          <p className="text-neutral-500">{user?.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="user-info-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <User className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Full Name</p>
                    <p className="font-medium text-neutral-900">
                      {user?.first_name || "N/A"} {user?.last_name || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <Mail className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Email</p>
                    <p className="font-medium text-neutral-900">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <Phone className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Mobile</p>
                    <p className="font-medium text-neutral-900">{user?.mobile || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Joined</p>
                    <p className="font-medium text-neutral-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                <Wallet className="w-5 h-5 text-neutral-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-500">Wallet Address</p>
                  <p className="font-mono text-sm text-neutral-900 truncate">
                    {user?.wallet_address || "Not generated"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Section */}
          <Card data-testid="user-edit-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Edit User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div>
                  <p className="font-medium text-neutral-900">Account Status</p>
                  <p className="text-sm text-neutral-500">Toggle user active status</p>
                </div>
                <Switch
                  checked={editData.is_active}
                  onCheckedChange={(checked) => setEditData({ ...editData, is_active: checked })}
                  data-testid="user-status-switch"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Wallet Balance (USDT)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.wallet_balance}
                  onChange={(e) => setEditData({ ...editData, wallet_balance: parseFloat(e.target.value) || 0 })}
                  className="h-12 rounded-xl"
                  data-testid="user-balance-input"
                />
              </div>

              <Button 
                onClick={handleSave}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={saving}
                data-testid="save-user-btn"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Direct Referrals */}
          <Card data-testid="direct-referrals-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Direct Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.direct_referrals?.length > 0 ? (
                <div className="space-y-2">
                  {data.direct_referrals.map((ref) => (
                    <div 
                      key={ref.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">
                          {ref.first_name || "Unknown"} {ref.last_name || ""}
                        </p>
                        <p className="text-xs text-neutral-500">{ref.email}</p>
                      </div>
                      <Badge 
                        className={ref.is_active 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-neutral-100 text-neutral-600"
                        }
                      >
                        {ref.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">No direct referrals</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-neutral-500 text-sm">Total Income</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                    ${(user?.total_income || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-neutral-500 text-sm">Wallet Balance</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                    ${(user?.wallet_balance || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-neutral-500 text-sm">Direct Referrals</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                    {user?.direct_referrals || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-neutral-500 text-sm mb-2">Referral Code</p>
              <p className="font-heading text-xl font-bold text-emerald-600">
                {user?.referral_code}
              </p>
            </CardContent>
          </Card>

          {user?.subscription_expires && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-6">
                <p className="text-emerald-600 text-sm mb-2">Subscription Expires</p>
                <p className="font-heading text-lg font-bold text-emerald-700">
                  {new Date(user.subscription_expires).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card data-testid="user-transactions-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.transactions?.length > 0 ? (
            <div className="space-y-2">
              {data.transactions.map((txn) => (
                <div 
                  key={txn.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-neutral-900 capitalize">
                      {txn.type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(txn.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className={`font-heading font-bold num-display ${
                    txn.type === "withdrawal" ? "text-purple-600" : "text-emerald-600"
                  }`}>
                    {txn.type === "withdrawal" ? "-" : "+"}${txn.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-4">No transactions</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
