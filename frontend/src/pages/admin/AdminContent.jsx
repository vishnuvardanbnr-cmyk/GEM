import { useState, useEffect } from "react";
import { 
  FileText,
  Save,
  Loader2,
  Mail,
  BookOpen,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { adminAPI } from "../../lib/api";

export default function AdminContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  
  const [terms, setTerms] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [emailTemplates, setEmailTemplates] = useState([]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const [termsRes, privacyRes, templatesRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/public/terms`).then(r => r.json()),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/public/privacy`).then(r => r.json()),
        adminAPI.getEmailTemplates()
      ]);
      
      setTerms(termsRes.content || "");
      setPrivacy(privacyRes.content || "");
      setEmailTemplates(templatesRes.data.templates || []);
    } catch (error) {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const saveTerms = async () => {
    setSaving({ ...saving, terms: true });
    try {
      await adminAPI.updateContent("terms", terms);
      toast.success("Terms & Conditions saved");
    } catch (error) {
      toast.error("Failed to save Terms & Conditions");
    } finally {
      setSaving({ ...saving, terms: false });
    }
  };

  const savePrivacy = async () => {
    setSaving({ ...saving, privacy: true });
    try {
      await adminAPI.updateContent("privacy", privacy);
      toast.success("Privacy Policy saved");
    } catch (error) {
      toast.error("Failed to save Privacy Policy");
    } finally {
      setSaving({ ...saving, privacy: false });
    }
  };

  const saveEmailTemplate = async (template) => {
    setSaving({ ...saving, [template.template_type]: true });
    try {
      await adminAPI.updateEmailTemplate(template.template_type, template);
      toast.success("Email template saved");
    } catch (error) {
      toast.error("Failed to save email template");
    } finally {
      setSaving({ ...saving, [template.template_type]: false });
    }
  };

  const updateEmailTemplate = (type, field, value) => {
    setEmailTemplates(templates => 
      templates.map(t => 
        t.template_type === type ? { ...t, [field]: value } : t
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="admin-content-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">
          Content Management
        </h1>
        <p className="text-neutral-500">Manage pages and email templates</p>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pages" data-testid="pages-tab">
            <FileText className="w-4 h-4 mr-2" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="emails" data-testid="emails-tab">
            <Mail className="w-4 h-4 mr-2" />
            Email Templates
          </TabsTrigger>
        </TabsList>

        {/* Pages */}
        <TabsContent value="pages" className="space-y-6">
          {/* Terms & Conditions */}
          <Card data-testid="terms-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Terms & Conditions
              </CardTitle>
              <CardDescription>
                HTML content is supported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter Terms & Conditions content (HTML supported)"
                data-testid="terms-textarea"
              />
              <Button 
                onClick={saveTerms}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={saving.terms}
                data-testid="save-terms-btn"
              >
                {saving.terms ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Terms & Conditions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card data-testid="privacy-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Privacy Policy
              </CardTitle>
              <CardDescription>
                HTML content is supported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter Privacy Policy content (HTML supported)"
                data-testid="privacy-textarea"
              />
              <Button 
                onClick={savePrivacy}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={saving.privacy}
                data-testid="save-privacy-btn"
              >
                {saving.privacy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Privacy Policy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="emails" className="space-y-6">
          {emailTemplates.map((template) => (
            <Card key={template.template_type} data-testid={`email-template-${template.template_type}`}>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2 capitalize">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  {template.template_type} Email
                </CardTitle>
                <CardDescription>
                  Available variables: {"{{otp}}"}, {"{{name}}"}, {"{{amount}}"}, {"{{referral_code}}"}, {"{{txn_hash}}"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={template.subject}
                    onChange={(e) => updateEmailTemplate(template.template_type, "subject", e.target.value)}
                    className="h-12 rounded-xl"
                    data-testid={`email-subject-${template.template_type}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body (HTML supported)</Label>
                  <Textarea
                    value={template.body}
                    onChange={(e) => updateEmailTemplate(template.template_type, "body", e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                    data-testid={`email-body-${template.template_type}`}
                  />
                </div>
                <Button 
                  onClick={() => saveEmailTemplate(template)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={saving[template.template_type]}
                  data-testid={`save-email-${template.template_type}-btn`}
                >
                  {saving[template.template_type] ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
