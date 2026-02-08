import { useState, useEffect } from "react";
import { 
  Users, 
  ChevronDown, 
  ChevronRight,
  User,
  Loader2,
  UserCheck,
  UserX,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  Layers,
  Share2,
  Network,
  Crown,
  Star,
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Team() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [openLevels, setOpenLevels] = useState({});
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("hierarchy");

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await userAPI.getTeam();
      setData(response.data);
      // Open first two levels by default
      if (response.data.levels.length > 0) {
        setOpenLevels({ 1: true, 2: true });
      }
      if (showRefresh) toast.success("Team data refreshed");
    } catch (error) {
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleLevel = (level) => {
    setOpenLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  const expandAll = () => {
    const allOpen = {};
    data?.levels?.forEach(l => { allOpen[l.level] = true; });
    setOpenLevels(allOpen);
  };

  const collapseAll = () => {
    setOpenLevels({});
  };

  const copyReferralLink = async () => {
    try {
      const profile = await userAPI.getProfile();
      const link = `${window.location.origin}/auth?ref=${profile.data.referral_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareOnWhatsApp = async () => {
    try {
      const profile = await userAPI.getProfile();
      const link = `${window.location.origin}/auth?ref=${profile.data.referral_code}`;
      const message = `🚀 Join GEM BOT MLM Platform!\n\nStart earning with our 10-level income structure. Use my referral link to sign up:\n\n${link}\n\n💰 $100 to activate | Earn on 10 levels!`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      toast.error("Failed to share link");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const totalTeam = data?.total_team || 0;
  const directCount = data?.levels?.[0]?.count || 0;
  const activeLevels = data?.levels?.length || 0;
  const totalActive = data?.levels?.reduce((sum, l) => 
    sum + l.members.filter(m => m.is_active).length, 0) || 0;
  const totalInactive = totalTeam - totalActive;

  // Calculate level distribution for chart
  const maxMembers = Math.max(...(data?.levels?.map(l => l.count) || [1]));

  return (
    <div className="space-y-6 fade-in" data-testid="team-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
            My Network
          </h1>
          <p className="text-neutral-500">Build and manage your team</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchTeam(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm"
            onClick={copyReferralLink}
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="copy-referral-btn"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button 
            size="sm"
            onClick={shareOnWhatsApp}
            className="bg-green-500 hover:bg-green-600"
            data-testid="whatsapp-share-btn"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Total Team Card */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">
                  Total Network Size
                </p>
                <p className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-2 num-display">
                  {totalTeam}
                </p>
                <p className="text-blue-200 text-sm mt-2">Team Members</p>
                
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-300" />
                    <span className="text-white text-sm font-medium">{totalActive} active</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                    <Layers className="w-4 h-4 text-blue-200" />
                    <span className="text-white text-sm font-medium">{activeLevels} levels deep</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex w-24 h-24 rounded-2xl bg-white/10 items-center justify-center">
                <Network className="w-12 h-12 text-white" />
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
                  <p className="text-neutral-500 text-xs uppercase tracking-wider">Direct Referrals</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900 num-display mt-1">
                    {directCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 text-xs uppercase tracking-wider">Inactive Members</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900 num-display mt-1">
                    {totalInactive}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <UserX className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Level Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Level Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((levelNum) => {
              const levelData = data?.levels?.find(l => l.level === levelNum);
              const count = levelData?.count || 0;
              const percentage = maxMembers > 0 ? (count / maxMembers) * 100 : 0;
              const activeCount = levelData?.members?.filter(m => m.is_active).length || 0;
              
              return (
                <div key={levelNum} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    count > 0 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    {levelNum}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-600">Level {levelNum}</span>
                      <span className="text-sm font-medium text-neutral-900">
                        {count} {count === 1 ? 'member' : 'members'}
                        {count > 0 && (
                          <span className="text-emerald-600 ml-1">({activeCount} active)</span>
                        )}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="hierarchy" className="gap-2">
            <Layers className="w-4 h-4" />
            Team Hierarchy
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="w-4 h-4" />
            All Members
          </TabsTrigger>
        </TabsList>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-4">
          <Card data-testid="team-tree-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" />
                Network Hierarchy
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data?.levels?.length > 0 ? (
                <div className="space-y-2">
                  {data.levels.map((level) => {
                    const activeMembers = level.members.filter(m => m.is_active).length;
                    
                    return (
                      <Collapsible
                        key={level.level}
                        open={openLevels[level.level]}
                        onOpenChange={() => toggleLevel(level.level)}
                      >
                        <CollapsibleTrigger 
                          className="w-full"
                          data-testid={`level-${level.level}-trigger`}
                        >
                          <div className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                            openLevels[level.level] 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'bg-neutral-50 hover:bg-neutral-100'
                          }`}>
                            <div className="flex items-center gap-4">
                              {openLevels[level.level] ? (
                                <ChevronDown className="w-5 h-5 text-blue-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-neutral-400" />
                              )}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold ${
                                openLevels[level.level]
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {level.level}
                              </div>
                              <div className="text-left">
                                <span className="font-semibold text-neutral-900">
                                  Level {level.level}
                                </span>
                                <p className="text-xs text-neutral-500">
                                  {activeMembers} active, {level.count - activeMembers} inactive
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-blue-100 text-blue-700">
                                {level.count} {level.count === 1 ? "member" : "members"}
                              </Badge>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-6 mt-2 space-y-2 border-l-2 border-blue-200 pl-4">
                            {level.members.map((member, idx) => (
                              <div 
                                key={member.id}
                                className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-xl hover:shadow-sm transition-shadow"
                                data-testid={`member-${member.id}`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className={`font-semibold ${
                                      member.is_active 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-neutral-100 text-neutral-500'
                                    }`}>
                                      {member.first_name?.[0] || member.email?.[0]?.toUpperCase() || '?'}
                                      {member.last_name?.[0] || ''}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-neutral-900">
                                      {member.first_name || "Unknown"} {member.last_name || ""}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                      <Mail className="w-3 h-3" />
                                      {member.email}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {member.is_active ? (
                                    <Badge className="bg-emerald-100 text-emerald-700">
                                      <UserCheck className="w-3 h-3 mr-1" /> Active
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-neutral-100 text-neutral-600">
                                      <UserX className="w-3 h-3 mr-1" /> Inactive
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-neutral-900">
                    Start Building Your Network
                  </h3>
                  <p className="text-neutral-500 mt-2 max-w-sm mx-auto">
                    Share your referral link with friends and colleagues to grow your team and earn commissions.
                  </p>
                  <Button 
                    onClick={copyReferralLink}
                    className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Referral Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                All Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalTeam > 0 ? (
                <div className="space-y-2">
                  {data?.levels?.flatMap(level => 
                    level.members.map(member => ({ ...member, level: level.level }))
                  ).map((member, idx) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className={`font-semibold text-lg ${
                            member.is_active 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-neutral-200 text-neutral-500'
                          }`}>
                            {member.first_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-neutral-900">
                            {member.first_name || "Unknown"} {member.last_name || ""}
                          </p>
                          <p className="text-sm text-neutral-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          L{member.level}
                        </Badge>
                        {member.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <UserCheck className="w-3 h-3 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">
                            <UserX className="w-3 h-3 mr-1" /> Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">No team members yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Growth Tips */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-indigo-900">
                Grow Your Network
              </h3>
              <p className="text-indigo-700 text-sm mt-1">
                Your direct referrals qualify you for deeper level income. More direct referrals = more earning potential from your entire network up to 10 levels deep.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-indigo-100 text-indigo-700">Share your link</Badge>
                <Badge className="bg-purple-100 text-purple-700">Help team activate</Badge>
                <Badge className="bg-blue-100 text-blue-700">Earn on 10 levels</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
