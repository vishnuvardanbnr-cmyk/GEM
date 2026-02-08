import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail,
  Phone,
  Copy,
  Check,
  Edit,
  Save,
  X,
  Loader2,
  Wallet,
  Calendar,
  Link as LinkIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { toast } from "sonner";
import { userAPI } from "../lib/api";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    mobile: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.data);
      setFormData({
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        mobile: response.data.mobile || ""
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await userAPI.updateProfile(formData);
      setUser(response.data);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${user?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="profile-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
          Profile
        </h1>
        <p className="text-neutral-500">Manage your account details</p>
      </div>

      {/* Profile Card */}
      <Card data-testid="profile-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Personal Information</CardTitle>
          {!editing ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditing(true)}
              data-testid="edit-profile-btn"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    first_name: user?.first_name || "",
                    last_name: user?.last_name || "",
                    mobile: user?.mobile || ""
                  });
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="save-profile-btn"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-heading font-bold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Badge className={user?.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                {user?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              {editing ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="h-12 rounded-xl"
                        data-testid="edit-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="h-12 rounded-xl"
                        data-testid="edit-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="h-12 rounded-xl"
                      data-testid="edit-mobile"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <User className="w-5 h-5 text-neutral-400" />
                    <div>
                      <p className="text-xs text-neutral-500">Full Name</p>
                      <p className="font-medium text-neutral-900">
                        {user?.first_name} {user?.last_name}
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
                      <p className="font-medium text-neutral-900">{user?.mobile || "Not set"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card data-testid="account-details-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <Wallet className="w-5 h-5 text-neutral-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500">Wallet Address</p>
                <p className="font-mono text-sm text-neutral-900 truncate">
                  {user?.wallet_address || "Not generated"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <Calendar className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Member Since</p>
                <p className="font-medium text-neutral-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>
          
          {user?.subscription_expires && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-emerald-600">Subscription Expires</p>
                <p className="font-medium text-emerald-700">
                  {new Date(user.subscription_expires).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card data-testid="referral-link-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-emerald-600" />
            Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <div>
                <p className="text-xs text-neutral-500">Your Referral Code</p>
                <p className="font-heading text-lg font-bold text-emerald-600">
                  {user?.referral_code}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 text-sm font-mono text-neutral-600 break-all">
                {window.location.origin}/auth?ref={user?.referral_code}
              </div>
              <Button 
                onClick={copyReferralLink}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="copy-referral-btn"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/terms")}
              className="text-neutral-600"
            >
              Terms & Conditions
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/privacy")}
              className="text-neutral-600"
            >
              Privacy Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
