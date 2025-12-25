import { useEffect, useRef, useState } from "react";
import { 
  UserPlus, 
  Settings, 
  Rocket, 
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";

const HowItWorksSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Sign Up & Onboard",
      description: "Create your school account in minutes. Our team helps you set up everything.",
      features: ["Quick registration", "Guided setup", "Data import"],
      color: "from-primary to-primary/80",
      bgColor: "bg-primary/5",
    },
    {
      number: "02",
      icon: Settings,
      title: "Configure School",
      description: "Customize fee structures, sessions, and notification preferences.",
      features: ["Custom fee heads", "Academic calendar", "Role access"],
      color: "from-secondary to-secondary/80",
      bgColor: "bg-secondary/5",
    },
    {
      number: "03",
      icon: Rocket,
      title: "Go Live",
      description: "Start managing daily operations seamlessly.",
      features: ["Real-time tracking", "Auto reminders", "Instant reports"],
      color: "from-accent to-accent/80",
      bgColor: "bg-accent/10",
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "Grow & Scale",
      description: "Analyze insights and scale your school management.",
      features: ["Analytics", "Performance", "24/7 Support"],
      color: "from-info to-info/80",
      bgColor: "bg-info/5",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden" ref={sectionRef}>
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-20 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary px-5 py-2.5 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Sparkles size={16} className="text-secondary" />
            Simple 4-Step Process
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Get Started with{" "}
            <span className="relative">
              <span className="text-gradient">SkoolSetu</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--secondary))" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From signup to full operations in just a few days
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`relative group ${isVisible ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-14 left-full w-full h-0.5 z-0">
                  <div className={`h-full bg-gradient-to-r from-border via-primary/30 to-border ${isVisible ? "animate-draw-line" : ""}`} style={{ animationDelay: `${0.5 + index * 0.2}s` }} />
                  <ArrowRight className="absolute -right-1 -top-2 text-primary/50" size={16} />
                </div>
              )}

              <div className={`relative ${step.bgColor} rounded-2xl p-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-border/30 h-full backdrop-blur-sm group-hover:border-primary/30`}>
                {/* Step Number Badge */}
                <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300 shadow-md`}>
                  <step.icon className="text-primary-foreground" size={28} />
                </div>

                {/* Content */}
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {step.description}
                </p>

                {/* Features */}
                <ul className="space-y-1.5">
                  {step.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 size={12} className="text-secondary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
