import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { School, AlertCircle, LogOut } from "lucide-react";
import logo from "@/assets/skoolsetu-logo.png";
import { Alert, AlertDescription } from "@/components/ui/alert";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"];

const CompleteRegistration = () => {
  const navigate = useNavigate();
  const { user, signOut, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // School details
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [board, setBoard] = useState("");
  const [studentCount, setStudentCount] = useState("");

  const validateForm = () => {
    if (!schoolName.trim()) {
      toast.error("Please enter school name");
      return false;
    }
    if (!schoolEmail.trim() || !schoolEmail.includes("@")) {
      toast.error("Please enter a valid school email");
      return false;
    }
    if (!schoolPhone.trim() || schoolPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (!city.trim()) {
      toast.error("Please enter city");
      return false;
    }
    if (!state) {
      toast.error("Please select state");
      return false;
    }
    if (!board) {
      toast.error("Please select education board");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;
    
    setLoading(true);
    
    try {
      // 1. Create the school
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: schoolName,
          email: schoolEmail,
          phone: schoolPhone,
          address: address || null,
          city,
          state,
          pincode: pincode || null,
          principal_name: principalName || null,
          board,
          student_count: studentCount ? parseInt(studentCount) : 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (schoolError) {
        console.error("School creation error:", schoolError);
        toast.error("Failed to create school. Please try again or contact support.");
        setLoading(false);
        return;
      }

      // 2. Create user role as school_admin
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "school_admin",
          school_id: schoolData.id,
        });

      if (roleError) {
        console.error("Role creation error:", roleError);
        toast.error("Failed to assign admin role. Please contact support.");
        setLoading(false);
        return;
      }

      // 3. Create subscription (trial)
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          school_id: schoolData.id,
          plan: "basic",
          status: "trial",
        });

      if (subscriptionError) {
        console.error("Subscription creation error:", subscriptionError);
        // Non-critical error, continue
      }

      toast.success("Registration completed! Redirecting to dashboard...");
      
      // Refresh user data and navigate
      await refreshUserData();
      navigate("/school-admin");
      
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Complete Registration - SkoolSetu</title>
        <meta name="description" content="Complete your school registration on SkoolSetu." />
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
            <Link to="/">
              <img src={logo} alt="SkoolSetu" className="h-10" />
            </Link>
          </div>

          <Alert className="mb-6 border-primary/50 bg-primary/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your account was created but registration wasn't completed. Please provide your school details below to continue.
            </AlertDescription>
          </Alert>

          <Card className="shadow-card">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <School className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Complete School Registration</CardTitle>
              <CardDescription>
                Add your school details to finish setting up your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  placeholder="e.g., Delhi Public School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">School Email *</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    placeholder="info@school.edu"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolPhone">Phone Number *</Label>
                  <Input
                    id="schoolPhone"
                    type="tel"
                    placeholder="9876543210"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="110001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="board">Education Board *</Label>
                  <Select value={board} onValueChange={setBoard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARDS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentCount">Number of Students</Label>
                  <Input
                    id="studentCount"
                    type="number"
                    placeholder="500"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="principalName">Principal Name</Label>
                <Input
                  id="principalName"
                  placeholder="Dr. Sharma"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                />
              </div>

              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating School..." : "Complete Registration"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CompleteRegistration;
