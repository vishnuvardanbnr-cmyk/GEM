import { useState, useEffect } from "react";
import { 
  Receipt, 
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { adminAPI } from "../../lib/api";

export default function AdminTransactions() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 30;

  useEffect(() => {
    fetchTransactions();
  }, [page, filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const type = filter === "all" ? null : filter;
      const response = await adminAPI.getTransactions(page * limit, limit, type);
      setTransactions(response.data.transactions);
      setTotal(response.data.total);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "withdrawal":
        return <ArrowUpRight className="w-5 h-5 text-purple-600" />;
      case "level_income":
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      default:
        return <ArrowDownRight className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "withdrawal":
        return "bg-purple-100";
      case "level_income":
        return "bg-emerald-100";
      default:
        return "bg-blue-100";
    }
  };

  return (
    <div className="space-y-6 fade-in" data-testid="admin-transactions-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
            Transactions
          </h1>
          <p className="text-neutral-500">View all system transactions</p>
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full md:w-48" data-testid="admin-transaction-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="level_income">Level Income</SelectItem>
            <SelectItem value="activation">Activation</SelectItem>
            <SelectItem value="renewal">Renewal</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-500 text-xs">Total Transactions</p>
            <p className="font-heading text-xl font-bold text-neutral-900">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-500 text-xs">Activations</p>
            <p className="font-heading text-xl font-bold text-blue-600">
              {transactions.filter(t => t.type === "activation").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-500 text-xs">Level Income</p>
            <p className="font-heading text-xl font-bold text-emerald-600">
              {transactions.filter(t => t.type === "level_income").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-500 text-xs">Withdrawals</p>
            <p className="font-heading text-xl font-bold text-purple-600">
              {transactions.filter(t => t.type === "withdrawal").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card data-testid="admin-transactions-list-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-neutral-500" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div 
                  key={txn.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
                  data-testid={`admin-txn-${txn.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getIconBg(txn.type)}`}>
                      {getIcon(txn.type)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 capitalize">
                        {txn.type.replace("_", " ")}
                        {txn.level && <span className="text-neutral-500"> (L{txn.level})</span>}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(txn.created_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-400 font-mono">
                        User: {txn.user_id?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-heading text-lg font-bold num-display ${
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
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-8">No transactions found</p>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-neutral-600">
                Page {page + 1} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= total}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
