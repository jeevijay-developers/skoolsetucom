import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Upload, FileText, Signature, Trash2, Eye } from "lucide-react";
import { generateReceiptHTML, ReceiptTemplate } from "@/utils/receiptTemplates";

interface InvoiceSettings {
  id?: string;
  signature_url: string | null;
  authorized_name: string | null;
  default_template: string;
}

interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

const InvoiceSettingsPage = () => {
  const { schoolId } = useAuth();
  const [settings, setSettings] = useState<InvoiceSettings>({
    signature_url: null,
    authorized_name: "",
    default_template: "A4",
  });
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  useEffect(() => {
    if (schoolId) {
      fetchSettings();
      fetchSchoolInfo();
    }
  }, [schoolId]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("invoice_settings")
      .select("*")
      .eq("school_id", schoolId)
      .single();
    
    if (data) {
      setSettings(data);
      if (data.signature_url) {
        setSignaturePreview(data.signature_url);
      }
    }
  };

  const fetchSchoolInfo = async () => {
    const { data } = await supabase
      .from("schools")
      .select("name, address, phone, email, logo_url")
      .eq("id", schoolId)
      .single();
    if (data) setSchoolInfo(data);
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size should be less than 2MB");
        return;
      }
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadSignature = async (): Promise<string | null> => {
    if (!signatureFile) return settings.signature_url;

    setUploading(true);
    try {
      const fileExt = signatureFile.name.split('.').pop();
      const fileName = `${schoolId}/signature.${fileExt}`;

      // Delete existing signature if any
      if (settings.signature_url) {
        const oldPath = settings.signature_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('invoice-signatures').remove([`${schoolId}/${oldPath}`]);
        }
      }

      const { error } = await supabase.storage
        .from('invoice-signatures')
        .upload(fileName, signatureFile, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('invoice-signatures')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error("Failed to upload signature: " + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const signatureUrl = await uploadSignature();

      const settingsData = {
        school_id: schoolId,
        signature_url: signatureUrl,
        authorized_name: settings.authorized_name,
        default_template: settings.default_template,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("invoice_settings")
          .update(settingsData)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("invoice_settings")
          .insert(settingsData);
        if (error) throw error;
      }

      toast.success("Invoice settings saved successfully");
      setSignatureFile(null);
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!settings.signature_url) return;

    try {
      const fileName = settings.signature_url.split('/').slice(-2).join('/');
      await supabase.storage.from('invoice-signatures').remove([fileName]);

      await supabase
        .from("invoice_settings")
        .update({ signature_url: null })
        .eq("id", settings.id);

      setSettings({ ...settings, signature_url: null });
      setSignaturePreview(null);
      toast.success("Signature removed");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const previewTemplate = (template: ReceiptTemplate) => {
    if (!schoolInfo) {
      toast.error("School information not available");
      return;
    }

    const sampleData = {
      receiptNumber: "RCP-SAMPLE001",
      date: new Date().toLocaleDateString(),
      studentName: "Sample Student",
      studentClass: "Class 10 - A",
      rollNumber: "101",
      parentName: "Sample Parent",
      feeType: "Tuition Fee",
      amount: 15000,
      paidAmount: 15000,
      currentPayment: 15000,
      paymentDate: new Date().toLocaleDateString(),
      paymentMode: "Cash",
      school: schoolInfo,
      signatureUrl: signaturePreview || undefined,
      authorizedName: settings.authorized_name || undefined,
    };

    const html = generateReceiptHTML(sampleData, template);
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  };

  return (
    <>
      <Helmet><title>Invoice Settings - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Invoice Settings</h1>
            <p className="text-muted-foreground">Configure receipt templates and authorized signature</p>
          </div>

          <div className="grid gap-6">
            {/* Signature Settings */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Signature className="h-5 w-5" />
                  Authorized Signature
                </CardTitle>
                <CardDescription>
                  Upload signature that will appear on all receipts and invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Authorized Person Name</Label>
                  <Input
                    value={settings.authorized_name || ""}
                    onChange={(e) => setSettings({ ...settings, authorized_name: e.target.value })}
                    placeholder="e.g., Principal / Accountant Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Signature Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    {signaturePreview ? (
                      <div className="flex flex-col items-center gap-4">
                        <img 
                          src={signaturePreview} 
                          alt="Signature Preview" 
                          className="max-h-24 object-contain bg-white p-2 rounded"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('signature-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Change
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveSignature}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="signature-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="h-10 w-10" />
                          <span>Click to upload signature</span>
                          <span className="text-xs">PNG or JPG, transparent background recommended</span>
                        </div>
                      </label>
                    )}
                    <input
                      type="file"
                      id="signature-upload"
                      accept="image/*"
                      onChange={handleSignatureChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Settings */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Receipt Templates
                </CardTitle>
                <CardDescription>
                  Choose default template and preview different formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Template</Label>
                  <Select 
                    value={settings.default_template} 
                    onValueChange={(v) => setSettings({ ...settings, default_template: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 - Full Page</SelectItem>
                      <SelectItem value="Letter">Letter - Standard</SelectItem>
                      <SelectItem value="Receipt">Receipt - Compact</SelectItem>
                      <SelectItem value="Thermal">Thermal - POS Printer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  {(["A4", "Letter", "Receipt", "Thermal"] as ReceiptTemplate[]).map((template) => (
                    <Button
                      key={template}
                      variant="outline"
                      onClick={() => previewTemplate(template)}
                      className="flex flex-col h-auto py-4"
                    >
                      <Eye className="h-5 w-5 mb-2" />
                      <span className="text-sm">Preview {template}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={loading || uploading}>
                <Settings className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default InvoiceSettingsPage;