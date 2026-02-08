import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gem, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { authAPI, userAPI } from "../lib/api";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
  });

  useEffect(() => {
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.first_name) {
        navigate("/");
      }
    } catch (error) {
      // Token invalid, redirect to auth
      if (error.response?.status === 401) {
        navigate("/auth");
      }
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.mobile) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const referralCode = localStorage.getItem("gembot_referral");
      await authAPI.completeProfile(formData, referralCode);
      localStorage.removeItem("gembot_referral");
      toast.success("Profile setup complete!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to setup profile");
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4">
            <Gem className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">Complete Profile</h1>
          <p className="text-neutral-500 mt-1">Tell us about yourself</p>
        </div>

        <Card className="border-0 shadow-xl shadow-neutral-200/50" data-testid="profile-setup-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-heading text-xl">Personal Details</CardTitle>
            <CardDescription>
              This information will be used for your crypto wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      id="first_name"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="pl-10 h-12 rounded-xl"
                      data-testid="first-name-input"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="h-12 rounded-xl"
                    data-testid="last-name-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="pl-10 h-12 rounded-xl"
                    data-testid="mobile-input"
                    required
                  />
                </div>
              </div>

              <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm">
                <strong>Note:</strong> A USDT wallet will be created for you using this information.
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 btn-glow"
                disabled={loading}
                data-testid="complete-profile-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
