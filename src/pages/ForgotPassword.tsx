import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import logo from "@/assets/skoolsetu-logo.png";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      setEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - SkoolSetu</title>
        <meta name="description" content="Reset your SkoolSetu password" />
      </Helmet>

      <div className="min-h-screen bg-muted/30 flex flex-col">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
            <Link to="/">
              <img src={logo} alt="SkoolSetu" className="h-10" />
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="shadow-card">
              <CardHeader className="text-center">
                {emailSent ? (
                  <>
                    <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-secondary" />
                    </div>
                    <CardTitle className="text-2xl">Check Your Email</CardTitle>
                    <CardDescription>
                      We've sent a password reset link to <strong>{email}</strong>
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                    <CardDescription>
                      Enter your email and we'll send you a reset link
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent>
                {emailSent ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setEmailSent(false)}
                    >
                      Try Again
                    </Button>
                    <Link to="/login">
                      <Button className="w-full">
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
                          Sending...
                        </span>
                      ) : (
                        "Send Reset Link"
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

export default ForgotPassword;
