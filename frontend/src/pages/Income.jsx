import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Layers,
  DollarSign,
  Loader2,
  Users,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Income() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      const response = await userAPI.getIncome();
      setData(response.data);
    } catch (error) {
      toast.error("Failed to load income data");
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

  const maxLevelIncome = Math.max(...(data?.level_income?.map(l => l.total) || [1]));

  return (
    <div className="space-y-6 fade-in" data-testid="income-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
          Income
        </h1>
        <p className="text-neutral-500">Track your level-wise earnings</p>
      </div>

      {/* Total Income Card */}
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" data-testid="total-income-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Income Earned</p>
              <p className="font-heading text-4xl md:text-5xl font-bold mt-1 num-display">
                ${(data?.total_income || 0).toFixed(2)}
              </p>
              <p className="text-emerald-200 text-sm mt-2">USDT</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-10 h-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income by Type */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-sm">Subscription Income</p>
                <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                  ${(data?.income_by_type?.subscription || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-sm">Referral Income</p>
                <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                  ${(data?.income_by_type?.referral || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Settings & Income */}
      <Card data-testid="level-income-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Level Income Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.level_settings?.map((level) => {
              const levelIncome = data?.level_income?.find(l => l.level === level.level);
              const earned = levelIncome?.total || 0;
              const count = levelIncome?.count || 0;
              
              return (
                <div 
                  key={level.level}
                  className="p-4 bg-neutral-50 rounded-xl"
                  data-testid={`level-${level.level}-income`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <span className="font-heading font-bold text-emerald-600">
                          {level.level}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">Level {level.level}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <Badge variant="outline" className="text-xs">
                            {level.percentage}%
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  Min {level.min_direct_referrals} direct
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>You need {level.min_direct_referrals} direct referrals to earn from this level</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-lg font-bold text-emerald-600 num-display">
                        ${earned.toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-500">{count} transactions</p>
                    </div>
                  </div>
                  <Progress 
                    value={maxLevelIncome > 0 ? (earned / maxLevelIncome) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Income Transactions */}
      <Card data-testid="recent-income-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent Income</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recent_income?.length > 0 ? (
            <div className="space-y-3">
              {data.recent_income.map((txn) => (
                <div 
                  key={txn.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <span className="font-heading text-sm font-bold text-emerald-600">
                        L{txn.level}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">
                        Level {txn.level} Income
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(txn.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-heading font-bold text-emerald-600 num-display">
                    +${txn.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-8">No income yet. Start referring to earn!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
