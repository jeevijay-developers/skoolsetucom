import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SkoolSetu - AI Trusted ERP | Complete School Management Solution</title>
        <meta 
          name="description" 
          content="SkoolSetu is the complete ERP solution for Indian schools. Manage attendance, fees, exams, and parent communication—all in one powerful platform." 
        />
        <meta name="keywords" content="school ERP, school management, attendance system, fees management, exam management, Indian schools, CBSE, parent communication" />
        <link rel="canonical" href="https://skoolsetu.com" />
      </Helmet>

      <div className="min-h-screen">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
