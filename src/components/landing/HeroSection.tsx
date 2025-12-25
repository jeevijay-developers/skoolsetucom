import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Users, School, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-school.jpg";

const HeroSection = () => {
  const stats = [
    { icon: School, value: "500+", label: "Schools Trust Us" },
    { icon: Users, value: "1M+", label: "Students Managed" },
  ];

  return (
    <section className="relative min-h-screen pt-28 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-secondary/5" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle size={16} />
              1 Day Free Trial • No Credit Card Required
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Transform Your{" "}
              <span className="text-gradient">School Management</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              SkoolSetu is the complete ERP solution for Indian schools. Manage 
              attendance, fees, exams, and parent communication—all in one 
              powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
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
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
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

          {/* Right Content - Hero Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={heroImage}
                alt="Modern school building with students"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -bottom-6 -left-6 bg-background rounded-xl shadow-card p-4 animate-bounce-gentle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <CheckCircle className="text-secondary" size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">98% Attendance</div>
                  <div className="text-xs text-muted-foreground">Average this month</div>
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
                  <div className="text-xs text-muted-foreground">Fees this week</div>
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
