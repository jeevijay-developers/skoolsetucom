import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Star, Crown, IndianRupee, Users, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually");
  const [students, setStudents] = useState(50);
  const [isAnimating, setIsAnimating] = useState(true);

  const MIN_STUDENTS = 50;
  const MAX_STUDENTS = 2000;

  // Animated guide effect - increases student count on load
  useEffect(() => {
    if (!isAnimating) return;
    
    const targetStudents = 200;
    const duration = 2000;
    const steps = 30;
    const increment = (targetStudents - MIN_STUDENTS) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setStudents(Math.round(MIN_STUDENTS + increment * currentStep));
      } else {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  // Basic Plan Pricing (per student per day)
  const basicPricing = {
    monthly: 2, // ₹2/day after discount
    annually: 1, // ₹1/day - "pen ki refill se bhi sasta"
  };

  // Pro Plan Pricing (per student per day)
  const proPricing = {
    monthly: 3, // ₹3/day after discount
    annually: 2, // ₹2/day
  };

  const calculatePrice = (studentCount: number, pricePerDay: number, cycle: "monthly" | "annually") => {
    const daysPerMonth = 30;
    const monthlyPrice = studentCount * pricePerDay * daysPerMonth;
    
    if (cycle === "annually") {
      return monthlyPrice * 12;
    }
    return monthlyPrice;
  };

  const basicPrice = calculatePrice(students, basicPricing[billingCycle], billingCycle);
  const proPrice = calculatePrice(students, proPricing[billingCycle], billingCycle);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN').format(price);
  };

  const basicFeatures = [
    { name: "Student Management", included: true },
    { name: "Teacher Management", included: true },
    { name: "Attendance Management", included: true },
    { name: "Basic Fee Collection", included: true },
    { name: "Class & Section Management", included: true },
    { name: "Exam & Results", included: true },
    { name: "Notice Board", included: true },
    { name: "Basic Reporting", included: true },
    { name: "Email Support", included: true },
    { name: "1 Admin Account", included: true },
    { name: "Payroll System", included: false },
    { name: "Role-based Staff Access", included: false },
    { name: "Parent/Student Portal", included: false },
    { name: "Custom Invoice Generator", included: false },
  ];

  const proFeatures = [
    { name: "Everything in Basic", included: true },
    { name: "Payroll System", included: true, premium: true },
    { name: "Role-based Staff Access", included: true, premium: true },
    { name: "Parent/Student Portal", included: true, premium: true },
    { name: "Custom Invoice Generator", included: true, premium: true },
    { name: "Advanced Analytics & Reports", included: true, premium: true },
    { name: "SMS Notifications", included: true },
    { name: "Custom School Branding", included: true },
    { name: "Priority Phone Support", included: true },
    { name: "5 Admin Accounts", included: true },
    { name: "Discount Authority Management", included: true },
    { name: "Greeting Cards Generator", included: true },
    { name: "API Access", included: true },
    { name: "Dedicated Account Manager", included: true },
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown size={16} />
            Transparent Pricing
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Simple Plans for
            <span className="text-gradient"> Every School</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Pay only for what you need. Per student pricing with no hidden fees.
          </p>
        </div>

        {/* Highlighted ₹1 Tagline */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/50 to-accent/50 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground px-8 py-4 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className="flex items-center justify-center w-14 h-14 bg-background rounded-xl shadow-md">
                <IndianRupee size={28} className="text-secondary" />
                <span className="font-heading text-2xl font-bold text-secondary">1</span>
              </div>
              <div className="text-left">
                <p className="text-lg font-bold">Pen se bhi Sasta!</p>
                <p className="text-sm opacity-90">Just ₹1/day per student (Billed Annually)</p>
              </div>
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-card border border-border rounded-full p-1.5 inline-flex shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annually")}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "annually"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annually
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-semibold">
                Save 50%
              </span>
            </button>
          </div>
        </div>

        {/* Student Count Selector - Single Slider for Both Plans */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Select Your School Size</p>
                    <p className="text-sm text-muted-foreground">Drag to adjust student count</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-bold text-primary">{students}</span>
                    <span className="text-muted-foreground">students</span>
                  </div>
                  {isAnimating && (
                    <p className="text-xs text-secondary animate-pulse">Adjusting...</p>
                  )}
                </div>
              </div>
              
              <div className="px-2">
                <Slider
                  value={[students]}
                  onValueChange={(value) => {
                    setStudents(value[0]);
                    setIsAnimating(false);
                  }}
                  min={MIN_STUDENTS}
                  max={MAX_STUDENTS}
                  step={10}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground mt-3 px-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full"></span>
                  Min: {MIN_STUDENTS}
                </span>
                <span className="text-center text-xs px-3 py-1 bg-muted rounded-full">
                  {students < 200 ? "Small School" : students < 500 ? "Medium School" : students < 1000 ? "Large School" : "Institution"}
                </span>
                <span className="flex items-center gap-1">
                  Max: {MAX_STUDENTS}
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full"></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <div className="group relative bg-card rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-border overflow-hidden">
            {/* Card gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground mb-3">
                  Essential
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground">Basic</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Perfect for small to medium schools
                </p>
              </div>

              {/* Price Display */}
              <div className="mb-6 p-4 bg-muted/50 rounded-2xl">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg text-muted-foreground">₹</span>
                  <span className="font-heading text-5xl font-bold text-foreground">
                    {formatPrice(basicPrice)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">
                  /{billingCycle === "annually" ? "year" : "month"}
                </p>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Per student/day</span>
                    <span className={`font-bold text-lg ${billingCycle === "annually" ? "text-secondary" : "text-foreground"}`}>
                      ₹{basicPricing[billingCycle]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    For {students} students
                  </p>
                </div>
              </div>

              <Link to="/register">
                <Button variant="outline" size="lg" className="w-full mb-6 h-12 text-base font-semibold border-2 hover:bg-primary hover:text-primary-foreground transition-all">
                  Start Free Trial
                </Button>
              </Link>

              <div className="space-y-3">
                {basicFeatures.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-secondary" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <X size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <span className={`text-sm ${
                      !feature.included 
                        ? "text-muted-foreground line-through opacity-50" 
                        : "text-foreground"
                    }`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="group relative rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
            {/* Premium gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
            
            {/* Popular badge */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-secondary text-secondary-foreground px-6 py-2 rounded-b-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                <Star size={14} className="fill-current" />
                Most Popular
              </div>
            </div>

            <div className="relative p-8 pt-12">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-primary-foreground/20 px-3 py-1 rounded-full text-xs font-medium text-primary-foreground mb-3">
                  <Crown size={12} />
                  Premium
                </div>
                <h3 className="font-heading text-2xl font-bold text-primary-foreground">Pro</h3>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Complete solution for growing schools
                </p>
              </div>

              {/* Price Display */}
              <div className="mb-6 p-4 bg-primary-foreground/10 backdrop-blur rounded-2xl border border-primary-foreground/20">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg text-primary-foreground/80">₹</span>
                  <span className="font-heading text-5xl font-bold text-primary-foreground">
                    {formatPrice(proPrice)}
                  </span>
                </div>
                <p className="text-primary-foreground/80 mt-1">
                  /{billingCycle === "annually" ? "year" : "month"}
                </p>
                <div className="mt-3 pt-3 border-t border-primary-foreground/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary-foreground/80">Per student/day</span>
                    <span className="font-bold text-lg text-secondary">
                      ₹{proPricing[billingCycle]}
                    </span>
                  </div>
                  <p className="text-xs text-primary-foreground/60 mt-1">
                    For {students} students
                  </p>
                </div>
              </div>

              <Link to="/register">
                <Button variant="secondary" size="lg" className="w-full mb-6 h-12 text-base font-bold shadow-lg hover:scale-[1.02] transition-transform">
                  Start Free Trial
                </Button>
              </Link>

              <div className="space-y-3">
                {proFeatures.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      feature.premium ? "bg-secondary" : "bg-primary-foreground/20"
                    }`}>
                      <Check size={12} className={feature.premium ? "text-secondary-foreground" : "text-primary-foreground"} />
                    </div>
                    <span className={`text-sm ${
                      feature.premium ? "text-secondary font-medium" : "text-primary-foreground/90"
                    }`}>
                      {feature.name}
                      {feature.premium && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary/30 text-secondary">
                          Pro
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <div className="inline-flex flex-wrap justify-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
              🔒 Secure Payments
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
              📞 24/7 Support
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
              💯 30-day Money Back
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
