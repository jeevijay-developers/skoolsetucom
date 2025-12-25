import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Basic",
      price: "25,000",
      period: "/year",
      description: "Perfect for schools with up to 500 students",
      features: [
        "Up to 500 Students",
        "Attendance Management",
        "Fees Collection",
        "Basic Reporting",
        "Parent Portal",
        "Email Support",
        "1 Admin Account",
      ],
      notIncluded: [
        "Advanced Analytics",
        "SMS Notifications",
        "Custom Branding",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "38,000",
      period: "/year",
      description: "For growing schools with advanced needs",
      features: [
        "Unlimited Students",
        "Everything in Basic",
        "Advanced Analytics",
        "SMS Notifications",
        "Custom Branding",
        "Priority Support",
        "5 Admin Accounts",
        "API Access",
        "Data Export",
      ],
      notIncluded: [],
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
            💎 Simple Pricing
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Transparent Pricing for
            <span className="text-gradient"> Every School</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees. No surprises. Start with a 1-day free trial and 
            choose the plan that fits your school.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-xl scale-105"
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
                  variant={plan.popular ? "hero-outline" : "hero"}
                  size="lg"
                  className="w-full mb-8"
                >
                  Start Free Trial
                </Button>
              </Link>

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-secondary/20" : "bg-secondary/10"
                    }`}>
                      <Check size={12} className={plan.popular ? "text-secondary" : "text-secondary"} />
                    </div>
                    <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </div>
                ))}
                {plan.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs">—</span>
                    </div>
                    <span className={`text-sm line-through ${plan.popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {feature}
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
