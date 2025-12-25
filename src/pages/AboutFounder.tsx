import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Lightbulb, 
  Code2, 
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Quote,
  Zap,
  Target
} from "lucide-react";

const AboutFounder = () => {
  const highlights = [
    { icon: Lightbulb, title: "Technology Entrepreneur", description: "Building scalable digital solutions" },
    { icon: Code2, title: "Product Strategist", description: "AI-powered platform development" },
    { icon: GraduationCap, title: "EdTech Innovator", description: "Focus on Indian education ecosystem" },
    { icon: TrendingUp, title: "Growth Driver", description: "Growth-driven product design" },
  ];

  return (
    <>
      <Helmet>
        <title>About Vikas Patel - Founder | SkoolSetu</title>
        <meta name="description" content="Vikas Patel is a technology entrepreneur, product strategist, and education-tech innovator with a deep focus on building scalable digital solutions." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-20 bg-gradient-to-br from-muted/50 via-background to-secondary/5 relative overflow-hidden">
            <div className="absolute top-20 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="container mx-auto px-4 relative">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Content */}
                <div className="animate-fade-in">
                  <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <User size={16} />
                    Founder & Visionary
                  </div>
                  <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                    Vikas <span className="text-gradient">Patel</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    Technology entrepreneur, product strategist, and education-tech innovator 
                    with a deep focus on building scalable digital solutions for the Indian education ecosystem.
                  </p>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-4">
                    {highlights.map((item, index) => (
                      <div 
                        key={item.title}
                        className="bg-card/50 rounded-xl p-4 border border-border/50"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <item.icon className="text-secondary mb-2" size={24} />
                        <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual */}
                <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <div className="bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl p-1">
                    <div className="bg-card rounded-3xl p-8 md:p-12">
                      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
                        <User className="text-primary-foreground" size={64} />
                      </div>
                      <div className="text-center">
                        <h2 className="font-heading text-2xl font-bold text-foreground">Vikas Patel</h2>
                        <p className="text-muted-foreground">Founder, Jeevijay Technologies</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Vision Quote */}
          <section className="py-16 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center relative">
                <Quote className="absolute -top-4 left-0 opacity-20" size={64} />
                <p className="text-xl md:text-2xl font-heading font-medium leading-relaxed relative z-10">
                  "Education systems should be efficient, transparent, and accessible — 
                  not burdened by outdated processes. My vision is to simplify complex systems 
                  and empower institutions, educators, and students through smart, reliable, 
                  and future-ready technology."
                </p>
                <Quote className="absolute -bottom-4 right-0 opacity-20 rotate-180" size={64} />
              </div>
            </div>
          </section>

          {/* About Content */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none">
                  <div className="bg-card rounded-2xl p-8 md:p-12 shadow-card border border-border/50">
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                      <Zap className="text-accent" size={28} />
                      About Vikas Patel
                    </h2>
                    
                    <div className="space-y-6 text-muted-foreground leading-relaxed">
                      <p>
                        Vikas Patel is a technology entrepreneur, product strategist, and education-tech 
                        innovator with a deep focus on building scalable digital solutions for the Indian 
                        education ecosystem. With hands-on experience in software development, AI-powered 
                        platforms, and growth-driven product design, he has consistently worked at the 
                        intersection of technology, education, and impact.
                      </p>
                      
                      <p>
                        His vision is clear — to simplify complex systems and empower institutions, 
                        educators, and students through smart, reliable, and future-ready technology. 
                        Vikas believes that education systems should be efficient, transparent, and 
                        accessible, not burdened by outdated processes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* The Connection */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                  The <span className="text-gradient">Connection</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-card rounded-2xl p-6 text-center shadow-card border border-border/50">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Lightbulb className="text-primary" size={32} />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">Vikas Patel's Vision</h3>
                  <p className="text-muted-foreground text-sm">Drives innovation</p>
                </div>

                <div className="bg-card rounded-2xl p-6 text-center shadow-card border border-border/50">
                  <div className="w-16 h-16 mx-auto rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <Code2 className="text-secondary" size={32} />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">Jeevijay Technologies</h3>
                  <p className="text-muted-foreground text-sm">Builds the technology</p>
                </div>

                <div className="bg-card rounded-2xl p-6 text-center shadow-card border border-border/50">
                  <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4">
                    <Target className="text-accent-foreground" size={32} />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">Skool Setu</h3>
                  <p className="text-muted-foreground text-sm">Delivers the impact</p>
                </div>
              </div>

              <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
                Together, they form a unified mission to transform education management in India 
                through practical, powerful, and purpose-built technology.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-gradient-to-r from-secondary to-secondary/90">
            <div className="container mx-auto px-4 text-center">
              <h2 className="font-heading text-3xl font-bold text-secondary-foreground mb-6">
                Let's Build the Future of Education Together
              </h2>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="gap-2 bg-background/10 border-background/20 text-secondary-foreground hover:bg-background/20">
                  Get in Touch <ArrowRight size={20} />
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AboutFounder;
