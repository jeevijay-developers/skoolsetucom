import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, School, User, CheckCircle, Sparkles, Shield, Users, Crown, IndianRupee } from "lucide-react";
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

const DESIGNATIONS = ["School Owner", "Principal", "Manager", "Director", "Decision Maker"];

// Validation helpers
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Get pricing data from URL params
  const selectedPlan = searchParams.get("plan") || "basic";
  const selectedStudents = parseInt(searchParams.get("students") || "50");
  const selectedBilling = searchParams.get("billing") || "monthly";
  
  // School details
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [yourName, setYourName] = useState("");
  const [designation, setDesignation] = useState("");
  const [board, setBoard] = useState("");
  const [studentCount, setStudentCount] = useState(selectedStudents.toString());
  
  // Admin details
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Update student count from URL params
  useEffect(() => {
    if (selectedStudents) {
      setStudentCount(selectedStudents.toString());
    }
  }, [selectedStudents]);

  const validateStep1 = () => {
    if (!schoolName.trim()) {
      toast.error("Please enter school name");
      return false;
    }
    if (!schoolEmail.trim()) {
      toast.error("Please enter school email");
      return false;
    }
    if (!isValidEmail(schoolEmail)) {
      toast.error("Invalid email format. Please enter a valid email address (e.g., info@school.edu)");
      return false;
    }
    if (!schoolPhone.trim()) {
      toast.error("Please enter phone number");
      return false;
    }
    if (!isValidPhone(schoolPhone)) {
      toast.error("Invalid mobile number. Please enter a valid 10-digit Indian mobile number starting with 6-9");
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
    if (!yourName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!designation) {
      toast.error("Please select your designation");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!adminName.trim()) {
      toast.error("Please enter admin name");
      return false;
    }
    if (!adminEmail.trim()) {
      toast.error("Please enter admin email");
      return false;
    }
    if (!isValidEmail(adminEmail)) {
      toast.error("Invalid email format. Please enter a valid email address");
      return false;
    }
    if (adminPhone && !isValidPhone(adminPhone)) {
      toast.error("Invalid mobile number. Please enter a valid 10-digit Indian mobile number starting with 6-9");
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

      if (!authData.user || !authData.session) {
        toast.error("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Call the atomic registration function
      const { data: regData, error: regError } = await supabase.rpc('complete_school_registration', {
        _school_name: schoolName,
        _school_email: schoolEmail,
        _school_phone: schoolPhone,
        _city: city,
        _state: state,
        _board: board,
        _address: address || null,
        _pincode: pincode || null,
        _principal_name: yourName ? `${yourName} (${designation})` : null,
        _student_count: studentCount ? parseInt(studentCount) : selectedStudents
      });

      if (regError) {
        console.error("Registration error:", regError);
        toast.error("School setup incomplete. Please complete registration after logging in.");
        navigate("/complete-registration");
        setLoading(false);
        return;
      }

      // 3. Update subscription with pricing data
      const schoolId = (regData as any)?.school_id;
      if (schoolId) {
        await supabase
          .from("subscriptions")
          .update({
            plan: selectedPlan as "basic" | "pro",
            billing_cycle: selectedBilling,
            student_count: parseInt(studentCount) || selectedStudents
          })
          .eq("school_id", schoolId);
      }

      // 4. Update profile with phone (optional, non-critical)
      if (adminPhone) {
        await supabase
          .from("profiles")
          .update({ phone: adminPhone })
          .eq("id", authData.user.id);
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

  // Calculate price for display
  const pricePerDay = selectedPlan === "pro" 
    ? (selectedBilling === "annually" ? 2 : 3)
    : (selectedBilling === "annually" ? 1 : 2);
  const monthlyPrice = parseInt(studentCount || "50") * pricePerDay * 30;
  const displayPrice = selectedBilling === "annually" ? monthlyPrice * 12 : monthlyPrice;

  return (
    <>
      <Helmet>
        <title>Start Free Trial - SkoolSetu</title>
        <meta name="description" content="Register your school on SkoolSetu and start your 14-day free trial. Complete school management solution for Indian schools." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex">
        {/* Left Panel - Plan Summary */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
          
          <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground w-full">
            <div>
              <Link to="/">
                <img src={logo} alt="SkoolSetu" className="h-12 brightness-0 invert" />
              </Link>
            </div>
            
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Sparkles className="w-4 h-4" />
                  14-Day Free Trial
                </div>
                <h1 className="text-3xl font-bold mb-4">Start Your Free Trial</h1>
                <p className="text-lg text-primary-foreground/80">
                  Experience the complete school management solution with no commitment.
                </p>
              </div>

              {/* Selected Plan Summary */}
              <div className="bg-primary-foreground/10 backdrop-blur rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedPlan === "pro" ? (
                      <Crown className="w-5 h-5 text-secondary" />
                    ) : (
                      <Shield className="w-5 h-5" />
                    )}
                    <span className="font-semibold text-lg capitalize">{selectedPlan} Plan</span>
                  </div>
                  <span className="text-sm bg-primary-foreground/20 px-3 py-1 rounded-full capitalize">
                    {selectedBilling}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <Users className="w-4 h-4" />
                  <span>{studentCount || selectedStudents} Students</span>
                </div>

                <div className="pt-4 border-t border-primary-foreground/20">
                  <p className="text-sm text-primary-foreground/60 mb-1">After free trial</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">₹{displayPrice.toLocaleString('en-IN')}</span>
                    <span className="text-primary-foreground/60">/{selectedBilling === "annually" ? "year" : "month"}</span>
                  </div>
                  <p className="text-sm text-secondary mt-1">
                    ₹{pricePerDay}/student/day
                  </p>
                </div>

                {selectedBilling === "annually" && selectedPlan === "basic" && (
                  <div className="flex items-center gap-2 text-secondary bg-secondary/20 px-3 py-2 rounded-lg text-sm">
                    <IndianRupee className="w-4 h-4" />
                    <span className="font-medium">Pen se bhi Sasta — ₹1/day!</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  <span>Full access during trial</span>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  <span>WhatsApp notifications</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-primary-foreground/60">
              © 2024 SkoolSetu by Jeevijay Technologies
            </p>
          </div>
        </div>

        {/* Right Panel - Registration Form */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
            <Link to="/">
              <img src={logo} alt="SkoolSetu" className="h-8" />
            </Link>
          </div>

          {/* Desktop Back Link */}
          <div className="hidden lg:block p-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4">
            <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
              {[
                { num: 1, label: "School Details" },
                { num: 2, label: "Admin Account" },
                { num: 3, label: "Complete" }
              ].map((s, i) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s.num 
                      ? step > s.num 
                        ? "bg-secondary text-secondary-foreground" 
                        : "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                  </div>
                  <span className={`hidden sm:inline text-sm font-medium ${
                    step >= s.num ? "text-foreground" : "text-muted-foreground"
                  }`}>{s.label}</span>
                  {i < 2 && <div className="w-8 h-0.5 bg-border mx-2" />}
                </div>
              ))}
            </div>
          </div>

          {/* Form Container */}
          <div className="flex-1 flex items-start justify-center p-6">
            <div className="w-full max-w-2xl">
              {/* Mobile Plan Summary */}
              <div className="lg:hidden mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedPlan === "pro" ? <Crown className="w-4 h-4 text-primary" /> : <Shield className="w-4 h-4 text-primary" />}
                    <span className="font-semibold capitalize">{selectedPlan} Plan</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{selectedBilling}</span>
                  </div>
                  <span className="font-bold">₹{displayPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Step 1: School Details */}
              {step === 1 && (
                <div className="bg-card rounded-2xl shadow-card border border-border p-8">
                  <div className="text-center mb-8">
                    <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                      <School className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">School Information</h2>
                    <p className="text-muted-foreground mt-1">Tell us about your school</p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName" className="font-medium">School Name *</Label>
                      <Input
                        id="schoolName"
                        placeholder="e.g., Delhi Public School"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="schoolEmail" className="font-medium">School Email *</Label>
                        <Input
                          id="schoolEmail"
                          type="email"
                          placeholder="info@school.edu"
                          value={schoolEmail}
                          onChange={(e) => setSchoolEmail(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schoolPhone" className="font-medium">Phone Number *</Label>
                        <Input
                          id="schoolPhone"
                          type="tel"
                          placeholder="9876543210"
                          value={schoolPhone}
                          onChange={(e) => setSchoolPhone(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="font-medium">Address</Label>
                      <Input
                        id="address"
                        placeholder="Street address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="font-medium">City *</Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="font-medium">State *</Label>
                        <Select value={state} onValueChange={setState}>
                          <SelectTrigger className="h-12">
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
                        <Label htmlFor="pincode" className="font-medium">Pincode</Label>
                        <Input
                          id="pincode"
                          placeholder="110001"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="board" className="font-medium">Education Board *</Label>
                        <Select value={board} onValueChange={setBoard}>
                          <SelectTrigger className="h-12">
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
                        <Label htmlFor="studentCount" className="font-medium">Number of Students</Label>
                        <Input
                          id="studentCount"
                          type="number"
                          placeholder="500"
                          value={studentCount}
                          onChange={(e) => setStudentCount(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="yourName" className="font-medium">Your Name *</Label>
                        <Input
                          id="yourName"
                          placeholder="Your full name"
                          value={yourName}
                          onChange={(e) => setYourName(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designation" className="font-medium">Designation *</Label>
                        <Select value={designation} onValueChange={setDesignation}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select designation" />
                          </SelectTrigger>
                          <SelectContent>
                            {DESIGNATIONS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-12 text-base font-semibold mt-4" 
                      size="lg"
                      onClick={() => {
                        if (validateStep1()) setStep(2);
                      }}
                    >
                      Continue to Admin Setup
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link to="/login" className="text-primary hover:underline font-semibold">
                        Login here
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Admin Account */}
              {step === 2 && (
                <div className="bg-card rounded-2xl shadow-card border border-border p-8">
                  <div className="text-center mb-8">
                    <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Admin Account</h2>
                    <p className="text-muted-foreground mt-1">Create your administrator account</p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="adminName" className="font-medium">Full Name *</Label>
                      <Input
                        id="adminName"
                        placeholder="Your full name"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail" className="font-medium">Email Address *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@school.edu"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPhone" className="font-medium">Phone Number</Label>
                        <Input
                          id="adminPhone"
                          type="tel"
                          placeholder="9876543210"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="font-medium">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Min. 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="font-medium">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button 
                        variant="outline"
                        className="flex-1 h-12" 
                        size="lg"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-1 h-12 font-semibold" 
                        size="lg"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></span>
                            Creating...
                          </span>
                        ) : (
                          "Start Free Trial"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center">
                  <div className="mx-auto w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-10 w-10 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to SkoolSetu!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your 14-day free trial has started. Explore all features with full access.
                  </p>

                  <div className="bg-muted/50 rounded-xl p-6 mb-6 text-left space-y-3">
                    <h3 className="font-semibold">What's Next?</h3>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-secondary">1</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Add your classes and sections</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-secondary">2</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Register students and teachers</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-secondary">3</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Set up fee structures</p>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-12 font-semibold"
                    onClick={() => navigate("/school-admin")}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
