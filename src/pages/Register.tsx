import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, School, User, CheckCircle } from "lucide-react";
import logo from "@/assets/skoolsetu-logo.png";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
  
  // Admin details
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    if (!adminName.trim()) {
      toast.error("Please enter admin name");
      return false;
    }
    if (!adminEmail.trim() || !adminEmail.includes("@")) {
      toast.error("Please enter a valid admin email");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    
    try {
      // 1. Sign up the admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: adminName,
          }
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered. Please login or use a different email.");
        } else {
          toast.error(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // 2. Create the school
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
          created_by: userId,
        })
        .select()
        .single();

      if (schoolError) {
        console.error("School creation error:", schoolError);
        toast.error("Failed to create school. Please contact support.");
        setLoading(false);
        return;
      }

      // 3. Create user role as school_admin
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "school_admin",
          school_id: schoolData.id,
        });

      if (roleError) {
        console.error("Role creation error:", roleError);
        toast.error("Failed to assign admin role. Please contact support.");
        setLoading(false);
        return;
      }

      // 4. Create subscription (trial)
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

      // 5. Update profile with phone
      if (adminPhone) {
        await supabase
          .from("profiles")
          .update({ phone: adminPhone })
          .eq("id", userId);
      }

      toast.success("Registration successful! Welcome to SkoolSetu.");
      setStep(3);
      
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register Your School - SkoolSetu</title>
        <meta name="description" content="Register your school on SkoolSetu and start your 1-day free trial. Complete school management solution for Indian schools." />
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <Link to="/">
              <img src={logo} alt="SkoolSetu" className="h-10" />
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
                </div>
                <span className="hidden sm:inline font-medium">School Details</span>
              </div>
              <div className="w-12 h-0.5 bg-border" />
              <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {step > 2 ? <CheckCircle className="h-5 w-5" /> : "2"}
                </div>
                <span className="hidden sm:inline font-medium">Admin Account</span>
              </div>
              <div className="w-12 h-0.5 bg-border" />
              <div className={`flex items-center gap-2 ${step >= 3 ? "text-secondary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}>
                  {step >= 3 ? <CheckCircle className="h-5 w-5" /> : "3"}
                </div>
                <span className="hidden sm:inline font-medium">Complete</span>
              </div>
            </div>
          </div>

          {/* Step 1: School Details */}
          {step === 1 && (
            <Card className="shadow-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <School className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">School Information</CardTitle>
                <CardDescription>
                  Tell us about your school to get started
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
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                >
                  Continue to Admin Setup
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Login here
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <Card className="shadow-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Admin Account</CardTitle>
                <CardDescription>
                  Create your school administrator account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name *</Label>
                  <Input
                    id="adminName"
                    placeholder="Your full name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email Address *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@school.edu"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone Number</Label>
                    <Input
                      id="adminPhone"
                      type="tel"
                      placeholder="9876543210"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  By creating an account, you agree to our{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <Card className="shadow-card">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to SkoolSetu!</h2>
                <p className="text-muted-foreground mb-6">
                  Your school <span className="font-medium text-foreground">{schoolName}</span> has been registered successfully.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium mb-2">Your Free Trial Includes:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Full access to all features</li>
                    <li>✓ Unlimited students & teachers</li>
                    <li>✓ Attendance, fees & exam management</li>
                    <li>✓ Parent communication portal</li>
                  </ul>
                </div>

                <Button size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>

                <p className="text-sm text-muted-foreground mt-4">
                  Check your email for verification link
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Register;
