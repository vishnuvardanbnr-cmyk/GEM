import { useState, useEffect } from "react";
import { 
  Layers,
  Save,
  Loader2,
  Percent,
  Users,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { adminAPI } from "../../lib/api";

export default function AdminLevels() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await adminAPI.getLevels();
      setLevels(response.data.levels);
    } catch (error) {
      toast.error("Failed to load level settings");
    } finally {
      setLoading(false);
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

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">How Level Income Works:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>When a user activates or renews their subscription, income is distributed to upline sponsors</li>
                <li>Each level gets a percentage of the subscription amount</li>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-neutral-400" />
                    Percentage
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={level.percentage}
                    onChange={(e) => handleLevelChange(index, "percentage", e.target.value)}
                    className="h-12 rounded-xl"
                    data-testid={`level-${level.level}-percentage`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-400" />
                    Min Direct
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={level.min_direct_referrals}
                    onChange={(e) => handleLevelChange(index, "min_direct_referrals", e.target.value)}
                    className="h-12 rounded-xl"
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
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500 text-sm">Total Percentage</p>
              <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                {levels.reduce((sum, l) => sum + l.percentage, 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500 text-sm">Active Levels</p>
              <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                {levels.filter(l => l.percentage > 0).length}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500 text-sm">Max Level</p>
              <p className="font-heading text-2xl font-bold text-neutral-900 num-display">
                10
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
