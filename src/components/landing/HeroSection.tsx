import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Users, School, CheckCircle, GraduationCap, BookOpen, Calculator, Bell } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

const HeroSection = () => {
  const stats = [
    { icon: School, value: "500+", label: "Schools Trust Us" },
    { icon: Users, value: "1M+", label: "Students Managed" },
  ];

  const floatingElements = [
    { icon: GraduationCap, label: "Students", color: "bg-secondary/20 text-secondary", delay: "0s", position: "top-10 -left-8" },
    { icon: BookOpen, label: "Results", color: "bg-primary/20 text-primary", delay: "0.5s", position: "top-32 -right-6" },
    { icon: Calculator, label: "Fees", color: "bg-accent/30 text-accent-foreground", delay: "1s", position: "bottom-24 -left-4" },
    { icon: Bell, label: "Notices", color: "bg-info/20 text-info", delay: "1.5s", position: "bottom-10 -right-8" },
  ];

  return (
    <section className="relative min-h-screen pt-28 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-secondary/5" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Decorative floating icons */}
      <div className="absolute top-40 left-10 opacity-20 animate-float" style={{ animationDelay: "0s" }}>
        <GraduationCap size={48} className="text-primary" />
      </div>
      <div className="absolute top-60 right-20 opacity-20 animate-float" style={{ animationDelay: "1s" }}>
        <BookOpen size={40} className="text-secondary" />
      </div>
      <div className="absolute bottom-40 left-20 opacity-20 animate-float-slow" style={{ animationDelay: "2s" }}>
        <Calculator size={36} className="text-accent" />
      </div>

      <div className="container relative mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-in-left">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle size={16} />
              1 Day Free Trial • No Credit Card Required
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Complete{" "}
              <span className="text-gradient">School ERP</span>{" "}
              for Modern Education
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              SkoolSetu is the all-in-one platform for Indian schools. Manage students, 
              teachers, attendance, fees, exams, payroll, and parent communication seamlessly. 
              <span className="font-semibold text-foreground"> 12+ powerful modules</span> in one unified system.
            </p>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {["Student Management", "Fee Collection", "Exam & Results", "Attendance", "Payroll", "Parent Portal"].map((feature) => (
                <span key={feature} className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
                  <CheckCircle size={12} className="text-secondary" />
                  {feature}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button variant="hero" size="xl" className="w-full sm:w-auto animate-pulse-glow">
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="gap-2">
                <Play size={20} className="fill-current" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label} 
                  className="flex items-center gap-3 animate-fade-in"
                  style={{ animationDelay: `${0.5 + index * 0.2}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <stat.icon className="text-secondary" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Dashboard Mockup */}
          <div className="relative animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
            {/* Main Dashboard Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              <div className="absolute top-0 left-0 right-0 h-8 bg-muted/50 flex items-center px-3 gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <img
                src={dashboardMockup}
                alt="SkoolSetu School Admin Dashboard"
                className="w-full h-auto object-cover pt-8"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
            </div>
            
            {/* Floating Feature Cards */}
            {floatingElements.map((element, index) => (
              <div 
                key={element.label}
                className={`absolute ${element.position} bg-background rounded-xl shadow-card p-3 animate-float hidden md:flex items-center gap-2`}
                style={{ animationDelay: element.delay }}
              >
                <div className={`w-8 h-8 rounded-lg ${element.color} flex items-center justify-center`}>
                  <element.icon size={16} />
                </div>
                <span className="text-xs font-medium text-foreground">{element.label}</span>
              </div>
            ))}

            {/* Stats Cards */}
            <div className="absolute -bottom-6 -left-6 bg-background rounded-xl shadow-card p-4 animate-bounce-gentle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <CheckCircle className="text-secondary" size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">98% Attendance</div>
                  <div className="text-xs text-muted-foreground">Real-time tracking</div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-background rounded-xl shadow-card p-4 animate-bounce-gentle" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">₹2.5L Collected</div>
                  <div className="text-xs text-muted-foreground">Instant receipts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
