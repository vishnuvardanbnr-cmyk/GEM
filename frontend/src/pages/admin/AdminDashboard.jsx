import { useState, useEffect } from "react";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  Loader2,
  UserCheck,
  Receipt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { adminAPI } from "../../lib/api";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
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
    <div className="space-y-6 fade-in" data-testid="admin-dashboard-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
          Admin Dashboard
        </h1>
        <p className="text-neutral-500">Overview of your MLM network</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover" data-testid="stat-total-users">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs md:text-sm">Total Users</p>
                <p className="font-heading text-xl md:text-2xl font-bold text-neutral-900 num-display">
                  {data?.total_users || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-active-users">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs md:text-sm">Active Users</p>
                <p className="font-heading text-xl md:text-2xl font-bold text-neutral-900 num-display">
                  {data?.active_users || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-total-income">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs md:text-sm">Total Revenue</p>
                <p className="font-heading text-xl md:text-2xl font-bold text-neutral-900 num-display">
                  ${(data?.total_income || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-withdrawals">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs md:text-sm">Withdrawals</p>
                <p className="font-heading text-xl md:text-2xl font-bold text-neutral-900 num-display">
                  ${(data?.total_withdrawals || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card data-testid="recent-users-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-500" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recent_users?.length > 0 ? (
              <div className="space-y-3">
                {data.recent_users.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {user.first_name || "Unknown"} {user.last_name || ""}
                      </p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                    <Badge 
                      className={user.is_active 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-neutral-100 text-neutral-600"
                      }
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-center py-4">No users yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card data-testid="recent-transactions-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-neutral-500" />
              Recent Transactions
            </CardTitle>
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
              <p className="text-neutral-500 text-center py-4">No transactions yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
