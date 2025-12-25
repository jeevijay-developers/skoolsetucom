import { useEffect, useState } from "react";
import { X, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Greeting {
  id: string;
  festival_name: string;
  custom_message: string | null;
  image_url: string | null;
}

const FESTIVAL_COLORS: Record<string, { bg: string; text: string }> = {
  diwali: { bg: "from-orange-500 to-yellow-500", text: "text-white" },
  christmas: { bg: "from-red-600 to-green-600", text: "text-white" },
  eid: { bg: "from-green-600 to-emerald-500", text: "text-white" },
  holi: { bg: "from-pink-500 via-purple-500 to-blue-500", text: "text-white" },
  republic_day: { bg: "from-orange-500 via-white to-green-500", text: "text-blue-900" },
  independence_day: { bg: "from-orange-500 via-white to-green-500", text: "text-blue-900" },
  new_year: { bg: "from-blue-600 to-purple-600", text: "text-white" },
  teachers_day: { bg: "from-blue-500 to-indigo-600", text: "text-white" },
  childrens_day: { bg: "from-pink-400 to-purple-500", text: "text-white" },
  default: { bg: "from-primary to-primary/80", text: "text-primary-foreground" },
};

interface GreetingBannerProps {
  schoolId?: string;
}

const GreetingBanner = ({ schoolId }: GreetingBannerProps) => {
  const { schoolId: authSchoolId } = useAuth();
  const effectiveSchoolId = schoolId || authSchoolId;
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (effectiveSchoolId) {
      fetchActiveGreeting();
    }
  }, [effectiveSchoolId]);

  const fetchActiveGreeting = async () => {
    const today = new Date().toISOString().split("T")[0];
    
    const { data } = await supabase
      .from("greetings")
      .select("id, festival_name, custom_message, image_url")
      .eq("school_id", effectiveSchoolId)
      .eq("is_active", true)
      .lte("valid_from", today)
      .or(`valid_until.is.null,valid_until.gte.${today}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      // Check if this greeting was already dismissed in this session
      const dismissedId = sessionStorage.getItem("dismissed_greeting");
      if (dismissedId !== data.id) {
        setGreeting(data);
      }
    }
  };

  const handleDismiss = () => {
    if (greeting) {
      sessionStorage.setItem("dismissed_greeting", greeting.id);
    }
    setDismissed(true);
  };

  if (!greeting || dismissed) return null;

  const colors = FESTIVAL_COLORS[greeting.festival_name] || FESTIVAL_COLORS.default;
  const festivalLabel = greeting.festival_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className={`relative bg-gradient-to-r ${colors.bg} ${colors.text} rounded-lg p-4 mb-6 shadow-lg`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 hover:bg-white/20"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-4">
        {greeting.image_url ? (
          <img 
            src={greeting.image_url} 
            alt={festivalLabel} 
            className="h-16 w-16 rounded-lg object-cover shadow-md"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
            <PartyPopper className="h-8 w-8" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <PartyPopper className="h-5 w-5" />
            Happy {festivalLabel}! 🎉
          </h3>
          <p className="text-sm opacity-90">
            {greeting.custom_message || `Wishing you a wonderful ${festivalLabel}!`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GreetingBanner;
