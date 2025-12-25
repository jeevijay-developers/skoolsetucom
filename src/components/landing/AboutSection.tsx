import { useEffect, useRef, useState } from "react";
import { 
  Lightbulb, 
  Code2, 
  GraduationCap, 
  Target, 
  Eye, 
  Rocket,
  Quote,
  Building2,
  Brain,
  Smartphone,
  Cloud,
  Cpu,
  User
} from "lucide-react";

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

  const expertise = [
    { icon: GraduationCap, title: "School & Institute ERP" },
    { icon: Building2, title: "Learning Management Systems" },
    { icon: Brain, title: "AI-powered Platforms" },
    { icon: Smartphone, title: "Mobile Applications" },
    { icon: Cloud, title: "Cloud Infrastructure" },
    { icon: Cpu, title: "Enterprise SaaS" },
  ];

  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden" ref={sectionRef}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* About SkoolSetu */}
        <div className={`text-center max-w-4xl mx-auto mb-20 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
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
            Indian schools with powerful tools designed for their unique needs. Our platform brings 
            together students, teachers, parents, and administrators on a unified system that 
            works seamlessly across devices.
          </p>
        </div>

        {/* Founder's Vision */}
        <div className={`mb-20 ${isVisible ? "animate-slide-up" : "opacity-0"}`} style={{ animationDelay: "0.2s" }}>
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
                    and empower institutions, educators, and students through smart, reliable, 
                    and future-ready technology."
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
                ].map((item, index) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <item.icon size={16} className="text-secondary" />
                    <span className="text-primary-foreground/80">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Parent Company */}
        <div className={`${isVisible ? "animate-slide-up" : "opacity-0"}`} style={{ animationDelay: "0.4s" }}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Building2 size={16} />
              Parent Company
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Jeevijay Technologies <span className="text-gradient">Private Limited</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A technology-first company focused on building robust SaaS platforms, ERP systems, 
              mobile applications, and AI-driven solutions for education and enterprise sectors.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-muted/50 rounded-2xl p-6 md:p-8 text-center mb-12">
            <p className="text-xl md:text-2xl font-heading font-medium text-foreground">
              "At Jeevijay Technologies, we don't just build software — 
              <span className="text-secondary"> we solve real operational problems.</span>"
            </p>
          </div>

          {/* Expertise Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {expertise.map((item, index) => (
              <div 
                key={item.title}
                className="bg-card rounded-xl p-4 text-center shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <item.icon className="text-primary" size={24} />
                </div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
              </div>
            ))}
          </div>

          {/* Vision & Mission */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border/50">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Eye className="text-primary" size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To become a trusted digital backbone for Indian education, enabling schools and 
                institutions to operate smarter, teach better, and grow faster through technology.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border/50">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                <Target className="text-secondary" size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-4">Our Mission</h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Digitize education operations with simplicity",
                  "Empower educators with efficient tools",
                  "Enhance learning through technology and AI",
                  "Build scalable products that grow with institutions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Rocket size={16} className="mt-1 text-secondary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The Connection */}
          <div className="mt-12 text-center">
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
              {[
                { icon: Lightbulb, title: "Vikas Patel's Vision", subtitle: "Drives innovation", color: "bg-primary/10 text-primary" },
                { icon: Code2, title: "Jeevijay Technologies", subtitle: "Builds the technology", color: "bg-secondary/10 text-secondary" },
                { icon: GraduationCap, title: "SkoolSetu", subtitle: "Delivers the impact", color: "bg-accent/20 text-accent-foreground" },
              ].map((item, index) => (
                <div key={item.title} className="relative">
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
                  )}
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
                    <div className={`w-12 h-12 mx-auto rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                      <item.icon size={24} />
                    </div>
                    <h4 className="font-heading font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Together, they form a unified mission to transform education management in India 
              through practical, powerful, and purpose-built technology.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
