import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireSubscription?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, requireSubscription = false }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, userRole, loading, isSubscriptionActive } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!userRole) {
      // User exists but no role assigned yet, wait a bit
      return;
    }

    if (allowedRoles && !allowedRoles.includes(userRole.role)) {
      // User doesn't have required role, redirect to appropriate dashboard
      switch (userRole.role) {
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
          navigate("/login");
      }
      return;
    }

    // Check subscription for non-super-admin roles
    if (requireSubscription && userRole.role !== "super_admin" && !isSubscriptionActive) {
      // Subscription is not active - for now we show a warning but don't block
      // You can change this to redirect to a subscription page if needed
    }
  }, [user, userRole, loading, allowedRoles, requireSubscription, isSubscriptionActive, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !userRole) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(userRole.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
