import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const CTASection = () => {
  const benefits = [
    "1 Day Free Trial",
    "No Credit Card Required",
    "Full Access to All Features",
    "WhatsApp Parent Notifications",
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join 500+ schools already using SkoolSetu. Start your free trial today 
            and see the difference in just one day.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <CheckCircle size={16} className="text-secondary" />
                <span className="text-primary-foreground text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="accent" size="xl" className="gap-2">
                Start Free Trial
                <ArrowRight size={20} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero-outline" size="xl">
                Login to Dashboard
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-primary-foreground/60 text-sm">
            Questions? Call us at{" "}
            <a href="tel:+918619483010" className="text-accent hover:underline font-medium">
              +91 86194 83010
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
