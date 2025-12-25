import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Star, Crown, PenLine } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually");
  const [basicStudents, setBasicStudents] = useState(100);
  const [proStudents, setProStudents] = useState(100);

  const MIN_STUDENTS = 50;
  const MAX_STUDENTS = 2000;

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

  const calculatePrice = (students: number, pricePerDay: number, cycle: "monthly" | "annually") => {
    const daysPerMonth = 30;
    const monthlyPrice = students * pricePerDay * daysPerMonth;
    
    if (cycle === "annually") {
      return monthlyPrice * 12;
    }
    return monthlyPrice;
  };

  const basicPrice = calculatePrice(basicStudents, basicPricing[billingCycle], billingCycle);
  const proPrice = calculatePrice(proStudents, proPricing[billingCycle], billingCycle);

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
    <section id="pricing" className="py-24 bg-muted/30">
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
          <p className="text-lg text-muted-foreground mb-4">
            Pay only for what you need. Per student pricing with no hidden fees.
          </p>
          
          {/* Marketing Tagline */}
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-6 py-3 rounded-full text-base font-semibold">
            <PenLine size={20} />
            Pen ki refill se bhi sasta — ₹1/day per student!
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-card border border-border rounded-full p-1 inline-flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annually")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "annually"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annually
              <span className="ml-2 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                Save 50%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <div className="relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 bg-card shadow-card border border-border">
            <div className="mb-6">
              <h3 className="font-heading text-2xl font-bold mb-2 text-foreground">Basic</h3>
              <p className="text-sm text-muted-foreground">
                Essential features for small to medium schools
              </p>
            </div>

            {/* Price Display */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-4xl font-bold text-foreground">
                  ₹{formatPrice(basicPrice)}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === "annually" ? "year" : "month"}
                </span>
              </div>
              <p className="text-sm text-secondary font-medium mt-1">
                ₹{basicPricing[billingCycle]}/student/day • {basicStudents} students
              </p>
            </div>

            {/* Student Count Slider */}
            <div className="mb-6 p-4 bg-muted/50 rounded-xl">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Number of Students</span>
                <span className="font-semibold text-foreground">{basicStudents}</span>
              </div>
              <Slider
                value={[basicStudents]}
                onValueChange={(value) => setBasicStudents(value[0])}
                min={MIN_STUDENTS}
                max={MAX_STUDENTS}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Min: {MIN_STUDENTS}</span>
                <span>Max: {MAX_STUDENTS}</span>
              </div>
            </div>

            <Link to="/register">
              <Button variant="hero" size="lg" className="w-full mb-8">
                Start Free Trial
              </Button>
            </Link>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
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

          {/* Pro Plan */}
          <div className="relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 bg-primary text-primary-foreground shadow-xl scale-[1.02]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <Star size={14} className="fill-current" />
                Most Popular
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-heading text-2xl font-bold mb-2 text-primary-foreground">Pro</h3>
              <p className="text-sm text-primary-foreground/80">
                Complete solution for growing schools with advanced needs
              </p>
            </div>

            {/* Price Display */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-4xl font-bold text-primary-foreground">
                  ₹{formatPrice(proPrice)}
                </span>
                <span className="text-primary-foreground/80">
                  /{billingCycle === "annually" ? "year" : "month"}
                </span>
              </div>
              <p className="text-sm text-secondary font-medium mt-1">
                ₹{proPricing[billingCycle]}/student/day • {proStudents} students
              </p>
            </div>

            {/* Student Count Slider */}
            <div className="mb-6 p-4 bg-primary-foreground/10 rounded-xl">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-primary-foreground/80">Number of Students</span>
                <span className="font-semibold text-primary-foreground">{proStudents}</span>
              </div>
              <Slider
                value={[proStudents]}
                onValueChange={(value) => setProStudents(value[0])}
                min={MIN_STUDENTS}
                max={MAX_STUDENTS}
                step={10}
                className="w-full [&_[role=slider]]:bg-secondary [&_[role=slider]]:border-secondary [&_.relative]:bg-primary-foreground/30 [&_[data-orientation=horizontal]>span:first-child]:bg-secondary"
              />
              <div className="flex justify-between text-xs text-primary-foreground/60 mt-2">
                <span>Min: {MIN_STUDENTS}</span>
                <span>Max: {MAX_STUDENTS}</span>
              </div>
            </div>

            <Link to="/register">
              <Button variant="secondary" size="lg" className="w-full mb-8">
                Start Free Trial
              </Button>
            </Link>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {proFeatures.map((feature) => (
                <div key={feature.name} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    feature.premium ? "bg-secondary text-primary" : "bg-secondary/20"
                  }`}>
                    <Check size={12} className={feature.premium ? "text-primary" : "text-primary-foreground"} />
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

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            🔒 Secure payments • 📞 24/7 Support • 💯 30-day money-back guarantee
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
