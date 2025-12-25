import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Lightbulb, 
  Code2, 
  GraduationCap, 
  Target, 
  Quote,
  User,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AboutSection = () => {
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

  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden" ref={sectionRef}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* About SkoolSetu */}
        <div className={`text-center max-w-4xl mx-auto mb-16 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <GraduationCap size={16} />
            About SkoolSetu
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            One Platform. One Ecosystem.
            <span className="text-gradient"> Total School Management.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            SkoolSetu is built with a singular vision — to digitize and simplify every aspect of 
            school management. From admissions to alumni, from attendance to analytics, we provide 
            Indian schools with powerful tools designed for their unique needs.
          </p>
        </div>

        {/* Founder's Vision */}
        <div className={`mb-12 ${isVisible ? "animate-slide-up" : "opacity-0"}`} style={{ animationDelay: "0.2s" }}>
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <Quote className="absolute top-8 left-8 opacity-10" size={80} />
            <Quote className="absolute bottom-8 right-8 opacity-10 rotate-180" size={80} />
            
            <div className="max-w-4xl mx-auto relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Founder Image/Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg">
                    <User className="text-primary-foreground" size={48} />
                  </div>
                </div>
                
                {/* Quote */}
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-heading font-medium leading-relaxed mb-6">
                    "Education systems should be efficient, transparent, and accessible — 
                    not burdened by outdated processes. My vision is to simplify complex systems 
                    and empower institutions through smart, reliable technology."
                  </p>
                  <div>
                    <h3 className="font-heading text-lg font-bold">Vikas Patel</h3>
                    <p className="text-primary-foreground/70">Founder & CEO, Jeevijay Technologies</p>
                  </div>
                </div>
              </div>

              {/* Founder Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-primary-foreground/20">
                {[
                  { icon: Lightbulb, label: "Tech Entrepreneur" },
                  { icon: Code2, label: "Product Strategist" },
                  { icon: GraduationCap, label: "EdTech Innovator" },
                  { icon: Target, label: "Growth Driver" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <item.icon size={16} className="text-secondary" />
                    <span className="text-primary-foreground/80">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Link to Jeevijay Page */}
        <div className={`text-center ${isVisible ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "0.4s" }}>
          <Link to="/about-jeevijay">
            <Button variant="outline" size="lg" className="gap-2">
              Learn About Our Parent Company
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
