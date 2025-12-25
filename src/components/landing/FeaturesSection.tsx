import { 
  CalendarCheck, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Users, 
  BarChart3,
  Shield,
  Bell
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: CalendarCheck,
      title: "Attendance Management",
      description: "Track daily attendance with real-time reports. Parents receive instant notifications about their child's attendance.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: CreditCard,
      title: "Fees Collection",
      description: "Streamlined fee management with online payments, automatic reminders, and comprehensive receipt generation.",
      color: "bg-accent/20 text-accent-foreground",
    },
    {
      icon: FileText,
      title: "Exam & Results",
      description: "Create exams, enter marks, generate report cards. Complete academic tracking from one dashboard.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: MessageSquare,
      title: "Parent Communication",
      description: "Send notices, share updates, and keep parents informed with our integrated messaging system.",
      color: "bg-info/10 text-info",
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Complete student profiles, class assignments, and academic history in one centralized database.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time insights into school performance, fee collections, attendance trends, and more.",
      color: "bg-warning/20 text-warning-foreground",
    },
    {
      icon: Shield,
      title: "Data Security",
      description: "Bank-grade encryption and role-based access ensure your school data stays protected.",
      color: "bg-destructive/10 text-destructive",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Automated alerts for fees, attendance, exams, and important school events.",
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            ✨ Powerful Features
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything You Need to
            <span className="text-gradient"> Run Your School</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From attendance tracking to result publishing, SkoolSetu provides a complete 
            suite of tools designed specifically for Indian schools.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-background rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={28} />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
