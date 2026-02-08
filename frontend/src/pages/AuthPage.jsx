import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gem, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { toast } from "sonner";
import { authAPI } from "../lib/api";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState("email"); // email, otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [smtpConfigured, setSmtpConfigured] = useState(true);

  const referralCode = searchParams.get("ref");

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("gembot_token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.sendOTP(email);
      setUserExists(response.data.user_exists);
      setSmtpConfigured(response.data.smtp_configured !== false);
      setStep("otp");
      setCountdown(60);
      
      if (response.data.smtp_configured === false) {
        toast.info("SMTP not configured. Use OTP: 000000");
      } else {
        toast.success("OTP sent to your email");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(email, otp);
      localStorage.setItem("gembot_token", response.data.token);
      
      if (referralCode) {
        localStorage.setItem("gembot_referral", referralCode);
      }

      if (response.data.is_new_user || !response.data.is_profile_complete) {
        navigate("/setup");
      } else {
        navigate("/");
      }
      toast.success("Login successful!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid OTP");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      await authAPI.sendOTP(email);
      setCountdown(60);
      toast.success("OTP resent to your email");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4">
            <Gem className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">GEM BOT</h1>
          <p className="text-neutral-500 mt-1">MLM Network Platform</p>
        </div>

        <Card className="border-0 shadow-xl shadow-neutral-200/50" data-testid="auth-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-heading text-xl">
              {step === "email" ? "Welcome" : "Enter OTP"}
            </CardTitle>
            <CardDescription>
              {step === "email" 
                ? "Enter your email to login or register" 
                : smtpConfigured 
                  ? `We sent a 6-digit code to ${email}`
                  : `Use default OTP: 000000 (SMTP not configured)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    data-testid="email-input"
                    required
                  />
                </div>
                
                {referralCode && (
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm">
                    Referral: {referralCode}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 btn-glow"
                  disabled={loading}
                  data-testid="send-otp-btn"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-xl"
                    data-testid="otp-input"
                    autoFocus
                  />
                  <p className="text-center text-sm text-neutral-500 mt-2">
                    Enter 6-digit OTP
                  </p>
                </div>

                <Button 
                  onClick={handleVerifyOTP}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 btn-glow"
                  disabled={loading || otp.length !== 6}
                  data-testid="verify-otp-btn"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {userExists ? "Login" : "Create Account"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || loading}
                    className="text-sm text-neutral-500 hover:text-emerald-600 disabled:opacity-50"
                    data-testid="resend-otp-btn"
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>

                <button
                  onClick={() => { setStep("email"); setOtp(""); }}
                  className="w-full text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Change email
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-neutral-500">
          <a href="/terms" className="hover:text-emerald-600">Terms</a>
          <span className="mx-2">•</span>
          <a href="/privacy" className="hover:text-emerald-600">Privacy</a>
        </div>
      </div>
    </div>
  );
}
