import { useEffect, useRef, useState } from "react";
import { 
  CalendarCheck, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Users, 
  BarChart3,
  Shield,
  Bell,
  GraduationCap,
  Wallet,
  UserCog,
  FileCheck,
  Building2,
  ClipboardList
} from "lucide-react";

const FeaturesSection = () => {
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

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Complete student profiles with admission, class assignments, academic history, and document management.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: GraduationCap,
      title: "Teacher Management",
      description: "Staff profiles, class assignments, subject mapping, attendance tracking, and performance management.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: CalendarCheck,
      title: "Attendance System",
      description: "Daily attendance with real-time parent notifications. Track trends and generate detailed reports.",
      color: "bg-info/10 text-info",
    },
    {
      icon: CreditCard,
      title: "Fee Collection",
      description: "Multiple payment modes, automatic reminders, instant digital receipts, and comprehensive tracking.",
      color: "bg-accent/20 text-accent-foreground",
    },
    {
      icon: FileText,
      title: "Exam & Results",
      description: "Create exams, schedule tests, enter marks, auto-calculate grades, and generate report cards.",
      color: "bg-warning/20 text-warning-foreground",
    },
    {
      icon: Wallet,
      title: "Payroll System",
      description: "Complete staff salary management with allowances, deductions, and payslip generation.",
      color: "bg-success/10 text-success",
    },
    {
      icon: FileCheck,
      title: "Invoice Customization",
      description: "Custom receipt formats with your school branding, authorized signatures, and multiple templates.",
      color: "bg-destructive/10 text-destructive",
    },
    {
      icon: UserCog,
      title: "Discount Management",
      description: "Authority-based fee discounts with approval workflows and comprehensive audit trails.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: MessageSquare,
      title: "Parent Portal",
      description: "Full visibility for parents - fees, attendance, results, notices, and direct communication.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Bell,
      title: "Notice Board",
      description: "Digital announcements with instant notifications to parents, students, and staff.",
      color: "bg-info/10 text-info",
    },
    {
      icon: ClipboardList,
      title: "Staff Access Control",
      description: "Role-based permissions for office staff with granular control over module access.",
      color: "bg-accent/20 text-accent-foreground",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time insights with beautiful charts for fees, attendance, performance, and more.",
      color: "bg-warning/20 text-warning-foreground",
    },
  ];

  return (
    <section id="features" className="py-24 bg-muted/30" ref={sectionRef}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            ✨ 12+ Powerful Modules
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Complete School Management
            <span className="text-gradient"> in One Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From admission to graduation, SkoolSetu covers every aspect of school operations 
            with intelligent automation and beautiful interfaces.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group bg-background rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                isVisible ? "animate-fade-in" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <feature.icon size={28} />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            And many more features designed specifically for <span className="font-semibold text-foreground">Indian schools</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
