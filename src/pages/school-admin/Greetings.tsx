import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Sparkles, Calendar, Eye, EyeOff, Download, Loader2, PartyPopper } from "lucide-react";
import { format } from "date-fns";

interface Greeting {
  id: string;
  festival_name: string;
  custom_message: string | null;
  image_url: string | null;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

interface SchoolInfo {
  name: string;
  logo_url: string | null;
}

const FESTIVALS = [
  { value: "diwali", label: "Diwali" },
  { value: "christmas", label: "Christmas" },
  { value: "eid", label: "Eid" },
  { value: "holi", label: "Holi" },
  { value: "republic_day", label: "Republic Day" },
  { value: "independence_day", label: "Independence Day" },
  { value: "ganesh_chaturthi", label: "Ganesh Chaturthi" },
  { value: "navratri", label: "Navratri" },
  { value: "teachers_day", label: "Teachers Day" },
  { value: "childrens_day", label: "Children's Day" },
  { value: "new_year", label: "New Year" },
  { value: "pongal", label: "Pongal" },
  { value: "onam", label: "Onam" },
  { value: "durga_puja", label: "Durga Puja" },
  { value: "gandhi_jayanti", label: "Gandhi Jayanti" },
  { value: "raksha_bandhan", label: "Raksha Bandhan" },
  { value: "other", label: "Other" },
];

const Greetings = () => {
  const { schoolId } = useAuth();
  const [greetings, setGreetings] = useState<Greeting[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    festival_name: "diwali",
    custom_message: "",
    valid_from: format(new Date(), "yyyy-MM-dd"),
    valid_until: "",
  });

  useEffect(() => {
    if (schoolId) {
      fetchGreetings();
      fetchSchoolInfo();
    }
  }, [schoolId]);

  const fetchGreetings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("greetings")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    setGreetings(data || []);
    setLoading(false);
  };

  const fetchSchoolInfo = async () => {
    const { data } = await supabase
      .from("schools")
      .select("name, logo_url")
      .eq("id", schoolId)
      .single();
    if (data) setSchoolInfo(data);
  };

  const generateGreetingPoster = async () => {
    if (!schoolInfo) {
      toast.error("School information not available");
      return;
    }

    setGenerating(true);
    try {
      const festivalLabel = FESTIVALS.find(f => f.value === formData.festival_name)?.label || formData.festival_name;
      
      const { data, error } = await supabase.functions.invoke("generate-greeting", {
        body: {
          festival: festivalLabel,
          school_name: schoolInfo.name,
          custom_message: formData.custom_message || `Wishing you a Happy ${festivalLabel}!`,
        },
      });

      if (error) throw error;

      if (data?.image_url) {
        setGeneratedImage(data.image_url);
        toast.success("Greeting poster generated!");
      } else if (data?.message) {
        // If no image, show the AI-generated message
        setFormData(prev => ({ ...prev, custom_message: data.message }));
        toast.success("Greeting message generated!");
      }
    } catch (error: any) {
      console.error("Error generating greeting:", error);
      toast.error(error.message || "Failed to generate greeting");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateGreeting = async () => {
    if (!formData.festival_name || !formData.valid_from) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const { error } = await supabase.from("greetings").insert({
        school_id: schoolId,
        festival_name: formData.festival_name,
        custom_message: formData.custom_message || null,
        image_url: generatedImage || null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        is_active: true,
      });

      if (error) throw error;
      toast.success("Greeting created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchGreetings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (greeting: Greeting) => {
    try {
      const { error } = await supabase
        .from("greetings")
        .update({ is_active: !greeting.is_active })
        .eq("id", greeting.id);

      if (error) throw error;
      toast.success(`Greeting ${greeting.is_active ? "hidden" : "activated"}`);
      fetchGreetings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this greeting?")) return;
    try {
      const { error } = await supabase.from("greetings").delete().eq("id", id);
      if (error) throw error;
      toast.success("Greeting deleted");
      fetchGreetings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      festival_name: "diwali",
      custom_message: "",
      valid_from: format(new Date(), "yyyy-MM-dd"),
      valid_until: "",
    });
    setGeneratedImage(null);
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = filename;
    a.click();
  };

  const getFestivalLabel = (value: string) => FESTIVALS.find(f => f.value === value)?.label || value;

  return (
    <>
      <Helmet><title>Festival Greetings - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <PartyPopper className="h-6 w-6 text-primary" />
                Festival Greetings
              </h1>
              <p className="text-muted-foreground">Create and manage festival greetings for students and parents</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Create Greeting</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Festival Greeting</DialogTitle>
                  <DialogDescription>Generate an AI-powered greeting poster for your school</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Festival *</Label>
                      <Select value={formData.festival_name} onValueChange={(v) => setFormData({ ...formData, festival_name: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FESTIVALS.map(f => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valid From *</Label>
                      <Input type="date" value={formData.valid_from} onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until (Optional)</Label>
                    <Input type="date" value={formData.valid_until} onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Message (Optional)</Label>
                    <Textarea
                      value={formData.custom_message}
                      onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                      placeholder="Enter a custom greeting message or let AI generate one..."
                      rows={3}
                    />
                  </div>

                  {/* AI Generation Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={generateGreetingPoster}
                    disabled={generating}
                  >
                    {generating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />Generate AI Greeting</>
                    )}
                  </Button>

                  {/* Generated Image Preview */}
                  {generatedImage && (
                    <div className="space-y-2">
                      <Label>Generated Poster</Label>
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <img src={generatedImage} alt="Generated greeting" className="w-full rounded-lg" />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => downloadImage(generatedImage, `${formData.festival_name}_greeting.png`)}
                        >
                          <Download className="h-4 w-4 mr-2" />Download Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateGreeting}>Create Greeting</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10"><PartyPopper className="h-6 w-6 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Greetings</p>
                    <p className="text-2xl font-bold">{greetings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100"><Eye className="h-6 w-6 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{greetings.filter(g => g.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100"><Calendar className="h-6 w-6 text-blue-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">
                      {greetings.filter(g => new Date(g.valid_from).getMonth() === new Date().getMonth()).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Greetings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : greetings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <PartyPopper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No greetings created yet</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Create First Greeting
                </Button>
              </div>
            ) : (
              greetings.map((greeting) => (
                <Card key={greeting.id} className="shadow-card overflow-hidden">
                  {greeting.image_url ? (
                    <div className="h-40 bg-muted">
                      <img src={greeting.image_url} alt={greeting.festival_name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <PartyPopper className="h-16 w-16 text-primary/50" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{getFestivalLabel(greeting.festival_name)}</h3>
                      <Badge variant={greeting.is_active ? "default" : "secondary"}>
                        {greeting.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                    {greeting.custom_message && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{greeting.custom_message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(greeting.valid_from), "MMM dd, yyyy")}
                      {greeting.valid_until && ` - ${format(new Date(greeting.valid_until), "MMM dd, yyyy")}`}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggleActive(greeting)}
                      >
                        {greeting.is_active ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {greeting.is_active ? "Hide" : "Show"}
                      </Button>
                      {greeting.image_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadImage(greeting.image_url!, `${greeting.festival_name}.png`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Greetings;
