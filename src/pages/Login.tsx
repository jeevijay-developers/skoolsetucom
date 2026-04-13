import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { School, Users, Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle, Sparkles, Shield, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logo from "@/assets/skoolsetu-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, userRole, loading, roleLoaded } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<"school" | "student">("school");

  useEffect(() => {
    if (!loading && user && roleLoaded) {
      if (userRole) {
        redirectBasedOnRole(userRole.role);
      }
    }
  }, [user, userRole, loading, roleLoaded, navigate]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "super_admin":
        navigate("/super-admin");
        break;
      case "school_admin":
        navigate("/school-admin");
        break;
      case "school_staff":
        navigate("/school-staff");
        break;
      case "teacher":
        navigate("/teacher");
        break;
      case "student":
      case "parent":
        navigate("/student");
        break;
      default:
        navigate("/");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email before logging in.");
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      toast.success("Login successful!");
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && !roleLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login - SkoolSetu</title>
        <meta name="description" content="Login to SkoolSetu - School ERP for managing attendance, fees, exams, and parent communication." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/90 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
            <div>
              <Link to="/">
                <img src={logo} alt="SkoolSetu" className="h-12 brightness-0 invert" />
              </Link>
            </div>
            
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
                <p className="text-xl text-primary-foreground/80">
                  Access your school management dashboard and continue where you left off.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span>Secure & Encrypted Login</span>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span>Role-based Access Control</span>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>24/7 Available Dashboard</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-primary-foreground/60">
              © 2024 SkoolSetu. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
            <Link to="/">
              <img src={logo} alt="SkoolSetu" className="h-8" />
            </Link>
          </div>

          {/* Desktop Back Link */}
          <div className="hidden lg:block p-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Login Form Container */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
              {/* Alert for delayed account setup */}
              {user && roleLoaded && !userRole && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your account setup is still being finalized. Please wait a moment and sign in again if the dashboard does not open automatically.
                  </AlertDescription>
                </Alert>
              )}

              {/* Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground">Sign In</h2>
                <p className="mt-2 text-muted-foreground">
                  Access your SkoolSetu dashboard
                </p>
              </div>

              {/* Login Type Tabs */}
              <div className="bg-muted/50 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setLoginType("school")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                    loginType === "school"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <School className="h-4 w-4" />
                  <span>School Login</span>
                </button>
                <button
                  onClick={() => setLoginType("student")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                    loginType === "student"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Student / Parent</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={loginType === "school" ? "admin@school.edu" : "student@email.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 text-base bg-background border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 text-base bg-background border-border/50 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></span>
                      Signing in...
                    </span>
                  ) : (
                    `Sign In as ${loginType === "school" ? "School Admin / Teacher" : "Student / Parent"}`
                  )}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="space-y-4 text-center">
                {loginType === "school" ? (
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-primary hover:underline font-semibold">
                      Start Free Trial
                    </Link>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your school will provide you with login credentials.
                  </p>
                )}

                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Need help?{" "}
                    <a href="mailto:support@skoolsetu.com" className="text-primary hover:underline">
                      support@skoolsetu.com
                    </a>
                    {" "}or call{" "}
                    <a href="tel:+918619483010" className="text-primary hover:underline">
                      +91 86194 83010
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
