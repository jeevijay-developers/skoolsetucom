import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { School, Users, Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
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
    // Only redirect when we have complete information
    if (!loading && user && roleLoaded) {
      if (userRole) {
        redirectBasedOnRole(userRole.role);
      } else {
        // User is authenticated but has no role - redirect to complete registration
        navigate("/complete-registration");
      }
    }
  }, [user, userRole, loading, roleLoaded]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "super_admin":
        navigate("/super-admin");
        break;
      case "school_admin":
        navigate("/school-admin");
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
      // Redirect will happen via useEffect when userRole is loaded
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading while checking role after login
  if (user && !roleLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
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

      <div className="min-h-screen bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <Link to="/">
              <img src={logo} alt="SkoolSetu" className="h-10" />
            </Link>
          </div>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Show alert if user is logged in but has no role */}
            {user && roleLoaded && !userRole && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your account exists but registration is incomplete.{" "}
                  <Link to="/complete-registration" className="font-medium underline">
                    Complete registration
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <Card className="shadow-card">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Login to access your SkoolSetu dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={loginType} onValueChange={(v) => setLoginType(v as "school" | "student")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="school" className="flex items-center gap-2">
                      <School className="h-4 w-4" />
                      <span>Login as School</span>
                    </TabsTrigger>
                    <TabsTrigger value="student" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Student / Parent</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="school">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="school-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="school-email"
                            type="email"
                            placeholder="admin@school.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="school-password">Password</Label>
                          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="school-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
                            Logging in...
                          </span>
                        ) : (
                          "Login as School Admin / Teacher"
                        )}
                      </Button>

                      <p className="text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                          Register your school
                        </Link>
                      </p>
                    </form>
                  </TabsContent>

                  <TabsContent value="student">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="student-email"
                            type="email"
                            placeholder="student@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="student-password">Password</Label>
                          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="student-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
                            Logging in...
                          </span>
                        ) : (
                          "Login as Student / Parent"
                        )}
                      </Button>

                      <p className="text-center text-sm text-muted-foreground">
                        Your school will provide you with login credentials.
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Need help? Contact your school administrator or</p>
              <a href="mailto:support@skoolsetu.com" className="text-primary hover:underline">
                support@skoolsetu.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;