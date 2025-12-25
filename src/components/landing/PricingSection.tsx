import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Star, Crown } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Basic",
      price: "25,000",
      period: "/year",
      description: "Essential features for schools with up to 500 students",
      features: [
        { name: "Up to 500 Students", included: true },
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
        { name: "Advanced Analytics", included: false },
        { name: "SMS Notifications", included: false },
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "38,000",
      period: "/year",
      description: "Complete solution for growing schools with advanced needs",
      features: [
        { name: "Unlimited Students", included: true },
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
        { name: "Data Export", included: true },
        { name: "Dedicated Account Manager", included: true },
      ],
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown size={16} />
            Transparent Pricing
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Simple Plans for
            <span className="text-gradient"> Every School</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees. No surprises. Start with a 1-day free trial and 
            choose the plan that fits your school's needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-xl scale-[1.02]"
                  : "bg-card shadow-card border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star size={14} className="fill-current" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-heading text-2xl font-bold mb-2 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className={`font-heading text-5xl font-bold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  ₹{plan.price}
                </span>
                <span className={plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}>
                  {plan.period}
                </span>
              </div>

              <Link to="/register">
                <Button
                  variant={plan.popular ? "secondary" : "hero"}
                  size="lg"
                  className="w-full mb-8"
                >
                  Start Free Trial
                </Button>
              </Link>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {plan.features.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.popular 
                          ? feature.premium ? "bg-secondary text-primary" : "bg-secondary/20"
                          : feature.premium ? "bg-secondary text-secondary-foreground" : "bg-secondary/10"
                      }`}>
                        <Check size={12} className={plan.popular ? "text-primary" : "text-secondary"} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <X size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <span className={`text-sm ${
                      !feature.included 
                        ? "text-muted-foreground line-through opacity-50" 
                        : plan.popular 
                          ? feature.premium ? "text-secondary font-medium" : "text-primary-foreground/90"
                          : "text-foreground"
                    }`}>
                      {feature.name}
                      {feature.premium && feature.included && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          plan.popular ? "bg-secondary/30 text-secondary" : "bg-secondary/20 text-secondary"
                        }`}>
                          Pro
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
