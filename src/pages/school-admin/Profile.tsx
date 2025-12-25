import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Save, Building2, Phone, Mail, MapPin, User, Loader2 } from "lucide-react";

interface SchoolProfile {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  principal_name: string | null;
  board: string | null;
  logo_url: string | null;
}

const Profile = () => {
  const { schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    principal_name: "",
    board: "",
  });

  useEffect(() => {
    if (schoolId) {
      fetchProfile();
    }
  }, [schoolId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        name: data.name || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        phone: data.phone || "",
        email: data.email || "",
        principal_name: data.principal_name || "",
        board: data.board || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load school profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${schoolId}-logo-${Date.now()}.${fileExt}`;
      const filePath = `${schoolId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("school-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("school-logos")
        .getPublicUrl(filePath);

      // Update school record
      const { error: updateError } = await supabase
        .from("schools")
        .update({ logo_url: publicUrl })
        .eq("id", schoolId);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("School name is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("schools")
        .update({
          name: formData.name,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          phone: formData.phone || null,
          email: formData.email || null,
          principal_name: formData.principal_name || null,
          board: formData.board || null,
        })
        .eq("id", schoolId);

      if (error) throw error;
      toast.success("Profile updated successfully");
      fetchProfile();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet><title>School Profile - SkoolSetu</title></Helmet>
        <DashboardLayout role="school_admin">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Helmet><title>School Profile - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">School Profile</h1>
            <p className="text-muted-foreground">Manage your school's information and branding</p>
          </div>

          {/* Logo Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                School Logo
              </CardTitle>
              <CardDescription>
                Upload your school logo. This will appear on fee receipts, report cards, and other documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 rounded-lg">
                  <AvatarImage src={profile?.logo_url || ""} alt="School Logo" />
                  <AvatarFallback className="rounded-lg bg-muted text-2xl font-bold">
                    {profile?.name?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {uploading ? "Uploading..." : "Upload Logo"}
                        </span>
                      </Button>
                    </div>
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, at least 200x200px, max 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* School Information */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>Update your school's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter school name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board">Board</Label>
                  <Input
                    id="board"
                    value={formData.board}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                    placeholder="e.g., CBSE, ICSE, State Board"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Principal Name
                </Label>
                <Input
                  id="principal_name"
                  value={formData.principal_name}
                  onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                  placeholder="Principal's name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="school@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="Pincode"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Profile;
