import { useState, useEffect } from "react";
import { 
  Users, 
  ChevronDown, 
  ChevronRight,
  User,
  Loader2,
  UserCheck,
  UserX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Team() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [openLevels, setOpenLevels] = useState({});

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await userAPI.getTeam();
      setData(response.data);
      // Open first level by default
      if (response.data.levels.length > 0) {
        setOpenLevels({ 1: true });
      }
    } catch (error) {
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const toggleLevel = (level) => {
    setOpenLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="team-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
          My Team
        </h1>
        <p className="text-neutral-500">View your network hierarchy</p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Total Team</p>
                <p className="font-heading text-xl font-bold text-neutral-900 num-display">
                  {data?.total_team || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Direct</p>
                <p className="font-heading text-xl font-bold text-neutral-900 num-display">
                  {data?.levels?.[0]?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Active Levels</p>
                <p className="font-heading text-xl font-bold text-neutral-900 num-display">
                  {data?.levels?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Max Level</p>
                <p className="font-heading text-xl font-bold text-neutral-900 num-display">
                  10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Tree */}
      <Card data-testid="team-tree-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Network Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.levels?.length > 0 ? (
            <div className="space-y-2">
              {data.levels.map((level) => (
                <Collapsible
                  key={level.level}
                  open={openLevels[level.level]}
                  onOpenChange={() => toggleLevel(level.level)}
                >
                  <CollapsibleTrigger 
                    className="w-full"
                    data-testid={`level-${level.level}-trigger`}
                  >
                    <div className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        {openLevels[level.level] ? (
                          <ChevronDown className="w-5 h-5 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-neutral-400" />
                        )}
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <span className="font-heading font-bold text-emerald-600">
                            {level.level}
                          </span>
                        </div>
                        <span className="font-medium text-neutral-900">
                          Level {level.level}
                        </span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {level.count} {level.count === 1 ? "member" : "members"}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-8 mt-2 space-y-2">
                      {level.members.map((member) => (
                        <div 
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-xl"
                          data-testid={`member-${member.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-neutral-500" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">
                                {member.first_name || "Unknown"} {member.last_name || ""}
                              </p>
                              <p className="text-xs text-neutral-500">{member.email}</p>
                            </div>
                          </div>
                          <Badge 
                            className={member.is_active 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-neutral-100 text-neutral-600"
                            }
                          >
                            {member.is_active ? (
                              <><UserCheck className="w-3 h-3 mr-1" /> Active</>
                            ) : (
                              <><UserX className="w-3 h-3 mr-1" /> Inactive</>
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-neutral-900">
                No Team Members Yet
              </h3>
              <p className="text-neutral-500 mt-1">
                Share your referral link to grow your network
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
