import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Cpu, 
  GraduationCap, 
  Cloud, 
  Smartphone,
  Brain,
  ArrowRight,
  Target,
  Eye,
  Rocket
} from "lucide-react";

const AboutJeevijay = () => {
  const expertise = [
    { icon: GraduationCap, title: "School & Institute ERP systems", color: "bg-primary/10 text-primary" },
    { icon: Building2, title: "Learning Management Systems (LMS)", color: "bg-secondary/10 text-secondary" },
    { icon: Brain, title: "AI-powered education platforms", color: "bg-accent/20 text-accent-foreground" },
    { icon: Smartphone, title: "Custom web & mobile application development", color: "bg-info/10 text-info" },
    { icon: Cloud, title: "Scalable cloud-based infrastructure", color: "bg-warning/20 text-warning-foreground" },
    { icon: Cpu, title: "Enterprise SaaS Solutions", color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <>
      <Helmet>
        <title>About Jeevijay Technologies - SkoolSetu</title>
        <meta name="description" content="Jeevijay Technologies Private Limited - Technology-first company focused on building robust SaaS platforms, ERP systems, and AI-driven solutions." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-20 bg-gradient-to-br from-muted/50 via-background to-primary/5 relative overflow-hidden">
            <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
            
            <div className="container mx-auto px-4 relative">
              <div className="max-w-4xl mx-auto text-center animate-fade-in">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Building2 size={16} />
                  About The Company
                </div>
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                  Jeevijay Technologies <span className="text-gradient">Private Limited</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  A technology-first company focused on building robust SaaS platforms, ERP systems, 
                  mobile applications, and AI-driven solutions for education and enterprise sectors.
                </p>
              </div>
            </div>
          </section>

          {/* Mission Statement */}
          <section className="py-16 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-2xl md:text-3xl font-heading font-medium leading-relaxed">
                  "At Jeevijay Technologies, we don't just build software — 
                  <span className="text-accent"> we solve real operational problems.</span>"
                </p>
              </div>
            </div>
          </section>

          {/* Expertise Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Our <span className="text-gradient">Expertise</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  With a strong product mindset and in-house development capability, 
                  we deliver secure, scalable, and performance-driven solutions.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expertise.map((item, index) => (
                  <div 
                    key={item.title}
                    className="bg-card rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                      <item.icon size={28} />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Vision & Mission */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Vision */}
                <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Eye className="text-primary" size={32} />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-4">Our Vision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To become a trusted digital backbone for Indian education, enabling schools and 
                    institutions to operate smarter, teach better, and grow faster through technology.
                  </p>
                </div>

                {/* Mission */}
                <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                    <Target className="text-secondary" size={32} />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-4">Our Mission</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Rocket size={16} className="mt-1 text-secondary flex-shrink-0" />
                      To digitize education operations with simplicity and reliability
                    </li>
                    <li className="flex items-start gap-2">
                      <Rocket size={16} className="mt-1 text-secondary flex-shrink-0" />
                      To empower educators with efficient tools
                    </li>
                    <li className="flex items-start gap-2">
                      <Rocket size={16} className="mt-1 text-secondary flex-shrink-0" />
                      To enhance learning experiences using technology and AI
                    </li>
                    <li className="flex items-start gap-2">
                      <Rocket size={16} className="mt-1 text-secondary flex-shrink-0" />
                      To build scalable products that grow with institutions
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-gradient-to-r from-primary to-primary/90">
            <div className="container mx-auto px-4 text-center">
              <h2 className="font-heading text-3xl font-bold text-primary-foreground mb-6">
                Ready to Transform Your School?
              </h2>
              <Link to="/contact">
                <Button variant="secondary" size="lg" className="gap-2">
                  Contact Us <ArrowRight size={20} />
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

export default AboutJeevijay;
