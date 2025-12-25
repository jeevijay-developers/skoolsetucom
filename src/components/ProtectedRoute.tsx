import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireSubscription?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, requireSubscription = false }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, userRole, loading, isSubscriptionActive, signOut } = useAuth();
  const [showIncompleteMessage, setShowIncompleteMessage] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    // Give some time for userRole to load after auth
    const timeout = setTimeout(() => {
      if (user && !userRole) {
        // User has auth but no role - incomplete registration
        setShowIncompleteMessage(true);
      }
    }, 2000);

    if (userRole) {
      setShowIncompleteMessage(false);
      
      if (allowedRoles && !allowedRoles.includes(userRole.role)) {
        // User doesn't have required role, redirect to appropriate dashboard
        switch (userRole.role) {
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
            navigate("/login");
        }
        return;
      }

      // Check subscription for non-super-admin roles
      if (requireSubscription && userRole.role !== "super_admin" && !isSubscriptionActive) {
        // Subscription is not active - for now we show a warning but don't block
      }
    }

    return () => clearTimeout(timeout);
  }, [user, userRole, loading, allowedRoles, requireSubscription, isSubscriptionActive, navigate]);

  const handleCompleteRegistration = () => {
    navigate("/complete-registration");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show incomplete registration message
  if (showIncompleteMessage && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Registration Incomplete</CardTitle>
            <CardDescription>
              Your account was created but the registration process wasn't completed. 
              This can happen due to a temporary issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please complete your school registration to access the dashboard.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleCompleteRegistration} className="w-full">
                Complete Registration
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="w-full">
                Sign Out & Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Still loading user role
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(userRole.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
