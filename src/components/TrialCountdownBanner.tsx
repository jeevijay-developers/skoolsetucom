import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TrialCountdownBanner = () => {
  const { subscription } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (subscription?.status !== "trial") return;

    const calculateTimeLeft = () => {
      const trialEnd = new Date(subscription.trial_end_date).getTime();
      const now = new Date().getTime();
      const difference = trialEnd - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [subscription]);

  if (subscription?.status !== "trial") return null;

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 6;

  return (
    <div className={`px-4 py-3 flex items-center justify-between flex-wrap gap-2 ${
      isExpired 
        ? "bg-destructive/10 border-b border-destructive/20" 
        : isUrgent 
          ? "bg-amber-500/10 border-b border-amber-500/20"
          : "bg-primary/10 border-b border-primary/20"
    }`}>
      <div className="flex items-center gap-3">
        {isExpired ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <Clock className={`h-5 w-5 ${isUrgent ? "text-amber-500" : "text-primary"}`} />
        )}
        <div>
          {isExpired ? (
            <span className="font-medium text-destructive">Your trial has expired!</span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${isUrgent ? "text-amber-600" : "text-primary"}`}>
                Trial ends in:
              </span>
              <div className="flex items-center gap-1 font-mono text-sm">
                {timeLeft.days > 0 && (
                  <span className="bg-background px-2 py-1 rounded font-bold">
                    {timeLeft.days}d
                  </span>
                )}
                <span className="bg-background px-2 py-1 rounded font-bold">
                  {String(timeLeft.hours).padStart(2, "0")}h
                </span>
                <span className="bg-background px-2 py-1 rounded font-bold">
                  {String(timeLeft.minutes).padStart(2, "0")}m
                </span>
                <span className="bg-background px-2 py-1 rounded font-bold">
                  {String(timeLeft.seconds).padStart(2, "0")}s
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <Button 
        size="sm" 
        variant={isExpired ? "destructive" : "default"}
        onClick={() => navigate("/school-admin/subscription")}
      >
        {isExpired ? "Subscribe Now" : "Upgrade Plan"}
      </Button>
    </div>
  );
};

export default TrialCountdownBanner;
