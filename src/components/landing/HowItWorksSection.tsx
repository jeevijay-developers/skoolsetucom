import { 
  UserPlus, 
  Settings, 
  Rocket, 
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Sign Up & Onboard",
      description: "Create your school account in minutes. Our team helps you set up classes, teachers, and students.",
      features: ["Quick registration", "Guided setup wizard", "Data import support"],
      color: "from-primary to-primary/80",
    },
    {
      number: "02",
      icon: Settings,
      title: "Configure Your School",
      description: "Customize fee structures, academic sessions, attendance rules, and notification preferences.",
      features: ["Custom fee heads", "Academic calendar", "Role-based access"],
      color: "from-secondary to-secondary/80",
    },
    {
      number: "03",
      icon: Rocket,
      title: "Go Live & Operate",
      description: "Start managing daily operations—attendance, fees, exams, and parent communication seamlessly.",
      features: ["Real-time tracking", "Automated reminders", "Instant reports"],
      color: "from-accent to-accent/80",
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "Grow & Scale",
      description: "Analyze insights, optimize operations, and scale your school management effortlessly.",
      features: ["Analytics dashboard", "Performance insights", "Continuous support"],
      color: "from-info to-info/80",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Rocket size={16} />
            Simple Process
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How <span className="text-gradient">SkoolSetu</span> Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in just 4 simple steps. From signup to full operations in no time.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0">
                  <ArrowRight className="absolute -right-2 -top-2 text-muted-foreground/30" size={16} />
                </div>
              )}

              <div className="relative bg-card rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border/50 h-full">
                {/* Step Number */}
                <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="text-primary-foreground" size={32} />
                </div>

                {/* Content */}
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {step.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {step.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={14} className="text-secondary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
