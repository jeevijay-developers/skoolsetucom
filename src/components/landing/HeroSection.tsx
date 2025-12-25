import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Users, School, CheckCircle } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

const HeroSection = () => {
  const stats = [
    { icon: School, value: "500+", label: "Schools" },
    { icon: Users, value: "1M+", label: "Students" },
  ];

  const quickFeatures = ["Attendance", "Fees", "Exams", "Payroll", "Parent Portal"];

  return (
    <section className="relative min-h-[90vh] pt-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-secondary/5" />
      <div className="absolute top-20 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left Content - Shorter */}
          <div className="space-y-6 animate-slide-in-left">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle size={16} />
              1 Day Free Trial
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Complete{" "}
              <span className="text-gradient">School ERP</span>{" "}
              System
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              All-in-one platform for Indian schools. Manage students, fees, exams, 
              and parent communication — 12+ powerful modules.
            </p>

            <div className="flex flex-wrap gap-2">
              {quickFeatures.map((feature) => (
                <span key={feature} className="text-xs bg-muted/60 text-muted-foreground px-3 py-1.5 rounded-full">
                  {feature}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/register">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2">
                <Play size={18} className="fill-current" />
                Watch Demo
              </Button>
            </div>

            {/* Stats - Compact */}
            <div className="flex items-center gap-6 pt-2">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <stat.icon className="text-secondary" size={20} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Multi-Dashboard Layout */}
          <div className="relative animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
            {/* Main Dashboard - School Admin */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              <div className="absolute top-0 left-0 right-0 h-7 bg-muted/80 flex items-center px-3 gap-1.5 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                <span className="ml-2 text-xs text-muted-foreground">School Admin Dashboard</span>
              </div>
              <img
                src={dashboardMockup}
                alt="SkoolSetu School Admin Dashboard"
                className="w-full h-auto object-cover pt-7"
              />
            </div>

            {/* Floating Card - Parent View Preview */}
            <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-xl p-3 border border-border/50 animate-float w-40">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-sm">👨‍👩‍👧</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Parent View</p>
                  <p className="text-[10px] text-muted-foreground">Real-time updates</p>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-secondary rounded-full" />
              </div>
            </div>

            {/* Floating Card - Student Stats */}
            <div className="absolute -top-2 -right-2 bg-card rounded-xl shadow-xl p-3 border border-border/50 animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <CheckCircle className="text-secondary" size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">98%</p>
                  <p className="text-[10px] text-muted-foreground">Attendance</p>
                </div>
              </div>
            </div>

            {/* Floating Card - Fee Collection */}
            <div className="absolute top-1/3 -right-6 bg-card rounded-xl shadow-xl p-3 border border-border/50 animate-float hidden md:block" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-sm">💰</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">₹2.5L</p>
                  <p className="text-[10px] text-muted-foreground">Collected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
