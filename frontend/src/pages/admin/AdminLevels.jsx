import { useState, useEffect } from "react";
import { 
  Layers,
  Save,
  Loader2,
  Percent,
  Users,
  Info,
  Plus,
  Trash2,
  Search,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { toast } from "sonner";
import { adminAPI } from "../../lib/api";

export default function AdminLevels() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState([]);
  
  // Additional Commissions state
  const [commissions, setCommissions] = useState([]);
  const [loadingCommissions, setLoadingCommissions] = useState(true);
  const [addCommissionOpen, setAddCommissionOpen] = useState(false);
  const [savingCommission, setSavingCommission] = useState(false);
  const [newCommission, setNewCommission] = useState({
    user_id: "",
    activation_percentage: 0,
    renewal_percentage: 0
  });
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchLevels();
    fetchCommissions();
    fetchUsers();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await adminAPI.getLevels();
      // Migrate old format to new format if needed
      const migratedLevels = response.data.levels.map(level => ({
        level: level.level,
        activation_percentage: level.activation_percentage ?? level.percentage ?? 0,
        renewal_percentage: level.renewal_percentage ?? level.percentage ?? 0,
        min_direct_referrals: level.min_direct_referrals ?? 0
      }));
      setLevels(migratedLevels);
    } catch (error) {
      toast.error("Failed to load level settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    try {
      const response = await adminAPI.getAdditionalCommissions();
      setCommissions(response.data.commissions || []);
    } catch (error) {
      console.error("Failed to load additional commissions");
    } finally {
      setLoadingCommissions(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers(0, 1000);
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error("Failed to load users");
    }
  };

  const handleLevelChange = (index, field, value) => {
    const updated = [...levels];
    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    setLevels(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateLevels(levels);
      toast.success("Level settings saved successfully");
    } catch (error) {
      toast.error("Failed to save level settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCommission = async () => {
    if (!newCommission.user_id) {
      toast.error("Please select a user");
      return;
    }
    
    setSavingCommission(true);
    try {
      await adminAPI.addAdditionalCommission(newCommission);
      toast.success("Additional commission added");
      setAddCommissionOpen(false);
      setNewCommission({ user_id: "", activation_percentage: 0, renewal_percentage: 0 });
      setSelectedUser(null);
      setUserSearch("");
      fetchCommissions();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add commission");
    } finally {
      setSavingCommission(false);
    }
  };

  const handleDeleteCommission = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this commission?")) return;
    
    try {
      await adminAPI.deleteAdditionalCommission(userId);
      toast.success("Commission deleted");
      fetchCommissions();
    } catch (error) {
      toast.error("Failed to delete commission");
    }
  };

  const filteredUsers = allUsers.filter(user => 
    !commissions.some(c => c.user_id === user.id) &&
    (user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
     user.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
     user.id?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="admin-levels-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
            Level Settings
          </h1>
          <p className="text-neutral-500">Configure MLM level income percentages</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={saving}
          data-testid="save-levels-btn"
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
      </div>

      {/* Additional Commissions Section */}
      <Card className="border-purple-200 bg-purple-50/50" data-testid="additional-commissions-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Additional User Commissions
              </CardTitle>
              <CardDescription>
                Add extra commission for specific users on every activation/renewal
              </CardDescription>
            </div>
            <Dialog open={addCommissionOpen} onOpenChange={setAddCommissionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700" data-testid="add-commission-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Add Additional Commission</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        placeholder="Search by email or name..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 h-12 rounded-xl"
                        data-testid="user-search-commission"
                      />
                    </div>
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-3 bg-purple-100 rounded-xl">
                        <div>
                          <p className="font-medium text-purple-900">
                            {selectedUser.first_name || "Unknown"} {selectedUser.last_name || ""}
                          </p>
                          <p className="text-xs text-purple-600">{selectedUser.email}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(null);
                            setNewCommission({ ...newCommission, user_id: "" });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : userSearch && (
                      <div className="max-h-48 overflow-y-auto border rounded-xl">
                        {filteredUsers.slice(0, 10).map(user => (
                          <div
                            key={user.id}
                            className="p-3 hover:bg-neutral-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewCommission({ ...newCommission, user_id: user.id });
                              setUserSearch("");
                            }}
                          >
                            <p className="font-medium text-neutral-900">
                              {user.first_name || "Unknown"} {user.last_name || ""}
                            </p>
                            <p className="text-xs text-neutral-500">{user.email}</p>
                          </div>
                        ))}
                        {filteredUsers.length === 0 && (
                          <p className="p-3 text-neutral-500 text-center">No users found</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Activation %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={newCommission.activation_percentage}
                        onChange={(e) => setNewCommission({ ...newCommission, activation_percentage: parseFloat(e.target.value) || 0 })}
                        className="h-12 rounded-xl"
                        data-testid="commission-activation-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Renewal %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={newCommission.renewal_percentage}
                        onChange={(e) => setNewCommission({ ...newCommission, renewal_percentage: parseFloat(e.target.value) || 0 })}
                        className="h-12 rounded-xl"
                        data-testid="commission-renewal-input"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddCommission}
                    className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700"
                    disabled={savingCommission || !selectedUser}
                    data-testid="confirm-add-commission-btn"
                  >
                    {savingCommission ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Add Commission"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCommissions ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : commissions.length > 0 ? (
            <div className="space-y-2">
              {commissions.map((comm) => (
                <div 
                  key={comm.user_id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-purple-100"
                  data-testid={`commission-${comm.user_id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-heading font-bold text-purple-600">
                        {comm.user?.first_name?.[0] || comm.user?.email?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {comm.user?.first_name || "Unknown"} {comm.user?.last_name || ""}
                      </p>
                      <p className="text-xs text-neutral-500">{comm.user?.email || comm.user_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm">
                        <Badge className="bg-emerald-100 text-emerald-700 mr-1">
                          Activation: {comm.activation_percentage}%
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700">
                          Renewal: {comm.renewal_percentage}%
                        </Badge>
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteCommission(comm.user_id)}
                      data-testid={`delete-commission-${comm.user_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-500 py-4">
              No additional commissions configured. Click "Add User" to add one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">How Level Income Works:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>When a user activates or renews their subscription, income is distributed to upline sponsors</li>
                <li><strong>Activation %</strong> applies when a new user pays $100 to activate</li>
                <li><strong>Renewal %</strong> applies when existing users pay $70 monthly renewal</li>
                <li>Users must have minimum direct referrals to qualify for each level's income</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Settings Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {levels.map((level, index) => (
          <Card key={level.level} data-testid={`level-${level.level}-card`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <span className="font-heading font-bold text-emerald-600">{level.level}</span>
                </div>
                <div>
                  <CardTitle className="font-heading text-lg">Level {level.level}</CardTitle>
                  <CardDescription>
                    {level.level === 1 ? "Direct Sponsor" : `${level.level} levels deep`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Percent className="w-3 h-3 text-emerald-500" />
                    Activation %
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={level.activation_percentage}
                    onChange={(e) => handleLevelChange(index, "activation_percentage", e.target.value)}
                    className="h-10 rounded-xl text-sm"
                    data-testid={`level-${level.level}-activation`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Percent className="w-3 h-3 text-blue-500" />
                    Renewal %
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={level.renewal_percentage}
                    onChange={(e) => handleLevelChange(index, "renewal_percentage", e.target.value)}
                    className="h-10 rounded-xl text-sm"
                    data-testid={`level-${level.level}-renewal`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Users className="w-3 h-3 text-neutral-400" />
                    Min Direct
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={level.min_direct_referrals}
                    onChange={(e) => handleLevelChange(index, "min_direct_referrals", e.target.value)}
                    className="h-10 rounded-xl text-sm"
                    data-testid={`level-${level.level}-min-direct`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-emerald-600 text-sm">Total Activation %</p>
              <p className="font-heading text-2xl font-bold text-emerald-700 num-display">
                {levels.reduce((sum, l) => sum + (l.activation_percentage || 0), 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-blue-600 text-sm">Total Renewal %</p>
              <p className="font-heading text-2xl font-bold text-blue-700 num-display">
                {levels.reduce((sum, l) => sum + (l.renewal_percentage || 0), 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500 text-sm">Active Levels</p>
              <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                {levels.filter(l => (l.activation_percentage || 0) > 0 || (l.renewal_percentage || 0) > 0).length}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-purple-600 text-sm">Additional Users</p>
              <p className="font-heading text-2xl font-bold text-purple-700 num-display">
                {commissions.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
