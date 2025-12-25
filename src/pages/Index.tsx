import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AboutSection from "@/components/landing/AboutSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SkoolSetu - Complete School ERP | Attendance, Fees, Exams & Parent Communication</title>
        <meta 
          name="description" 
          content="SkoolSetu is the complete ERP solution for Indian schools. Manage students, teachers, attendance, fees, exams, payroll, and parent communication in one powerful platform." 
        />
        <meta name="keywords" content="school ERP, school management system, attendance system, fees management, exam management, Indian schools, CBSE, ICSE, parent communication, student management, payroll" />
        <link rel="canonical" href="https://skoolsetu.com" />
      </Helmet>

      <div className="min-h-screen">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <AboutSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
