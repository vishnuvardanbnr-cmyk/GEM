import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Layers,
  DollarSign,
  Loader2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  RefreshCw,
  Calendar,
  Target,
  Award,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Income() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await userAPI.getIncome();
      setData(response.data);
      if (showRefresh) toast.success("Data refreshed");
    } catch (error) {
      toast.error("Failed to load income data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const totalIncome = data?.total_income || 0;
  const activationIncome = data?.income_by_type?.activation || 0;
  const renewalIncome = data?.income_by_type?.renewal || 0;
  const levelSettings = data?.level_settings || [];
  const levelIncome = data?.level_income || [];
  const recentIncome = data?.recent_income || [];
  
  // Calculate stats
  const totalTransactions = levelIncome.reduce((sum, l) => sum + (l.count || 0), 0);
  const activeLevels = levelIncome.filter(l => l.total > 0).length;
  const highestLevel = levelIncome.length > 0 ? Math.max(...levelIncome.map(l => l.level)) : 0;
  const maxLevelIncome = Math.max(...levelIncome.map(l => l.total), 1);

  return (
    <div className="space-y-6 fade-in" data-testid="income-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
            Income Overview
          </h1>
          <p className="text-neutral-500">Track your earnings and level performance</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fetchIncome(true)}
          disabled={refreshing}
          className="self-start"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats Card */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Total Income - Large Card */}
        <Card className="lg:col-span-2 overflow-hidden" data-testid="total-income-card">
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">
                  Total Earnings
                </p>
                <p className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-2 num-display">
                  ${totalIncome.toFixed(2)}
                </p>
                <p className="text-emerald-200 text-sm mt-3">USDT</p>
                
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span className="text-white text-sm font-medium">{totalTransactions} transactions</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                    <Layers className="w-4 h-4 text-emerald-200" />
                    <span className="text-white text-sm font-medium">{activeLevels} active levels</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex w-24 h-24 rounded-2xl bg-white/10 items-center justify-center">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="card-hover border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 text-xs uppercase tracking-wider">Activation</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900 num-display mt-1">
                    ${activationIncome.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 text-xs uppercase tracking-wider">Renewal</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900 num-display mt-1">
                    ${renewalIncome.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <p className="font-heading text-2xl font-bold text-purple-700 mt-2 num-display">{activeLevels}</p>
            <p className="text-purple-600 text-xs">Active Levels</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <p className="font-heading text-2xl font-bold text-amber-700 mt-2 num-display">L{highestLevel || '-'}</p>
            <p className="text-amber-600 text-xs">Highest Level</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-heading text-2xl font-bold text-blue-700 mt-2 num-display">{totalTransactions}</p>
            <p className="text-blue-600 text-xs">Total Transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="font-heading text-2xl font-bold text-emerald-700 mt-2 num-display">
              ${totalTransactions > 0 ? (totalIncome / totalTransactions).toFixed(2) : '0.00'}
            </p>
            <p className="text-emerald-600 text-xs">Avg per Transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <Layers className="w-4 h-4" />
            Level Breakdown
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Calendar className="w-4 h-4" />
            Recent Income
          </TabsTrigger>
        </TabsList>

        {/* Level Breakdown Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card data-testid="level-income-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Level-wise Income Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {levelSettings.map((level) => {
                  const income = levelIncome.find(l => l.level === level.level);
                  const earned = income?.total || 0;
                  const count = income?.count || 0;
                  const percentage = maxLevelIncome > 0 ? (earned / maxLevelIncome) * 100 : 0;
                  const activationPct = level.activation_percentage || level.percentage || 0;
                  const renewalPct = level.renewal_percentage || level.percentage || 0;
                  const minDirect = level.min_direct_referrals || 0;
                  
                  return (
                    <div 
                      key={level.level}
                      className={`group relative p-4 rounded-xl border transition-all hover:shadow-md ${
                        earned > 0 
                          ? 'bg-gradient-to-r from-emerald-50/80 to-white border-emerald-100' 
                          : 'bg-neutral-50/50 border-neutral-100'
                      }`}
                      data-testid={`level-${level.level}-income`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Level Badge */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-heading text-lg font-bold ${
                          earned > 0 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-neutral-200 text-neutral-500'
                        }`}>
                          {level.level}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900">Level {level.level}</span>
                            {earned > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">Active</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-emerald-500" />
                              {activationPct}% activation
                            </span>
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 text-blue-500" />
                              {renewalPct}% renewal
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Min {minDirect} direct
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-2">
                            <Progress 
                              value={percentage} 
                              className="h-1.5"
                            />
                          </div>
                        </div>

                        {/* Earnings */}
                        <div className="text-right">
                          <p className={`font-heading text-xl font-bold num-display ${
                            earned > 0 ? 'text-emerald-600' : 'text-neutral-400'
                          }`}>
                            ${earned.toFixed(2)}
                          </p>
                          <p className="text-xs text-neutral-500">{count} txns</p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Footer */}
              <div className="mt-6 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Total from all levels</span>
                  <span className="font-heading text-lg font-bold text-emerald-600 num-display">
                    ${totalIncome.toFixed(2)} USDT
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Income Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card data-testid="recent-income-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Recent Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentIncome.length > 0 ? (
                <div className="space-y-2">
                  {recentIncome.map((txn, index) => (
                    <div 
                      key={txn.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Level Badge */}
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <span className="font-heading text-sm font-bold text-emerald-600">
                          L{txn.level}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">Level {txn.level} Income</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {txn.income_type || 'subscription'}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {new Date(txn.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        <span className="font-heading text-lg font-bold text-emerald-600 num-display">
                          +${txn.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-neutral-900">No Income Yet</h3>
                  <p className="text-neutral-500 mt-1 text-sm">
                    Start referring users to earn level income!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Income Tips Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-blue-900">
                Maximize Your Earnings
              </h3>
              <p className="text-blue-700 text-sm mt-1">
                Build your team to unlock higher levels. Each direct referral helps you qualify for deeper level income. 
                Active users in your network generate both activation and renewal commissions.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-blue-100 text-blue-700">10 Levels Deep</Badge>
                <Badge className="bg-emerald-100 text-emerald-700">Activation Bonus</Badge>
                <Badge className="bg-purple-100 text-purple-700">Renewal Bonus</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
