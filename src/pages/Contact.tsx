import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle,
  Send,
  Clock,
  Building2
} from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    school: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    });
    
    setFormData({ name: "", email: "", phone: "", school: "", message: "" });
    setIsSubmitting(false);
  };

  const handleWhatsAppClick = (phone: string) => {
    const cleanPhone = phone.replace(/\s+/g, "").replace("+", "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const contactInfo = [
    { icon: Mail, label: "Email", value: "hello@skoolsetu.com", href: "mailto:hello@skoolsetu.com" },
    { icon: Phone, label: "Phone", value: "+91 9664402955", href: "tel:+919664402955" },
    { icon: Clock, label: "Working Hours", value: "Mon - Sat, 9AM - 6PM IST", href: null },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us - SkoolSetu</title>
        <meta name="description" content="Get in touch with SkoolSetu. We're here to help you transform your school management." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-16 bg-gradient-to-br from-muted/50 via-background to-primary/5 relative overflow-hidden">
            <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="container mx-auto px-4 relative">
              <div className="max-w-3xl mx-auto text-center animate-fade-in">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <MessageCircle size={16} />
                  Get In Touch
                </div>
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Contact <span className="text-gradient">Us</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 animate-fade-in">
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                    Send us a Message
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="school">School Name</Label>
                        <Input
                          id="school"
                          placeholder="Your school name"
                          value={formData.school}
                          onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your requirements..."
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                      <Send size={18} />
                    </Button>
                  </form>
                </div>

                {/* Contact Info */}
                <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  {/* Quick Contact */}
                  <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                      Quick Contact
                    </h2>
                    
                    <div className="space-y-4">
                      {contactInfo.map((item) => (
                        <div key={item.label} className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <item.icon className="text-primary" size={24} />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                            {item.href ? (
                              <a href={item.href} className="font-medium text-foreground hover:text-primary transition-colors">
                                {item.value}
                              </a>
                            ) : (
                              <p className="font-medium text-foreground">{item.value}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Buttons */}
                  <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                    <h2 className="font-heading text-xl font-bold text-foreground mb-4">
                      WhatsApp Support
                    </h2>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-14 bg-[#25D366]/5 border-[#25D366]/30 hover:bg-[#25D366]/10"
                        onClick={() => handleWhatsAppClick("+91 8619483010")}
                      >
                        <MessageCircle size={24} className="text-[#25D366]" />
                        <div className="text-left">
                          <p className="font-medium">Technical Enquiry</p>
                          <p className="text-xs text-muted-foreground">+91 8619483010</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-14 bg-[#25D366]/5 border-[#25D366]/30 hover:bg-[#25D366]/10"
                        onClick={() => handleWhatsAppClick("+91 9664402955")}
                      >
                        <MessageCircle size={24} className="text-[#25D366]" />
                        <div className="text-left">
                          <p className="font-medium">Sales Enquiry</p>
                          <p className="text-xs text-muted-foreground">+91 9664402955</p>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
                    <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Building2 className="text-primary" size={24} />
                      Our Office
                    </h2>
                    <div className="flex items-start gap-4">
                      <MapPin className="text-primary mt-1 flex-shrink-0" size={20} />
                      <p className="text-muted-foreground">
                        22, Second Floor, Jeevijay Technologies,<br />
                        Behind Modern Petrol Pump,<br />
                        Kota Gumanpura Thana Nearby - 324007
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Contact;
