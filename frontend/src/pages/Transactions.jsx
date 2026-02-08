import { useState, useEffect } from "react";
import { 
  Receipt, 
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Loader2,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await userAPI.getTransactions();
      setData(response.data);
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

  const getAmountColor = (type) => {
    switch (type) {
      case "withdrawal":
        return "text-purple-600";
      default:
        return "text-emerald-600";
    }
  };

  const filteredTransactions = data?.transactions?.filter(txn => {
    if (filter === "all") return true;
    return txn.type === filter;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="transactions-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
            Transactions
          </h1>
          <p className="text-neutral-500">View all your transaction history</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="transaction-filter">
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

      {/* Transactions List */}
      <Card data-testid="transactions-list-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-neutral-500" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((txn) => (
                <div 
                  key={txn.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                  data-testid={`transaction-${txn.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconBg(txn.type)}`}>
                      {getIcon(txn.type)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 capitalize">
                        {txn.type.replace("_", " ")}
                        {txn.level && <span className="text-neutral-500"> (Level {txn.level})</span>}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {new Date(txn.created_at).toLocaleString()}
                      </p>
                      {txn.txn_hash && (
                        <p className="text-xs text-neutral-400 font-mono truncate max-w-[200px]">
                          Hash: {txn.txn_hash}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-heading text-lg font-bold num-display ${getAmountColor(txn.type)}`}>
                      {txn.type === "withdrawal" ? "-" : "+"}${txn.amount.toFixed(2)}
                    </p>
                    <Badge 
                      className={
                        txn.status === "completed" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : txn.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-neutral-900">
                No Transactions Yet
              </h3>
              <p className="text-neutral-500 mt-1">
                Your transaction history will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
