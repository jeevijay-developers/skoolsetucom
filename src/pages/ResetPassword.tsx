import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/skoolsetu-logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Password updated successfully!");
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password - SkoolSetu</title>
        <meta name="description" content="Set your new SkoolSetu password" />
      </Helmet>

      <div className="min-h-screen bg-muted/30 flex flex-col">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <Link to="/">
              <img src={logo} alt="SkoolSetu" className="h-10" />
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="shadow-card">
              <CardHeader className="text-center">
                {success ? (
                  <>
                    <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-secondary" />
                    </div>
                    <CardTitle className="text-2xl">Password Updated!</CardTitle>
                    <CardDescription>
                      Your password has been successfully reset
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Set New Password</CardTitle>
                    <CardDescription>
                      Enter your new password below
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent>
                {success ? (
                  <Button className="w-full" onClick={() => navigate("/login")}>
                    Go to Login
                  </Button>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
                          Updating...
                        </span>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
