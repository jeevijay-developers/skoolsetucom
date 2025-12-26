import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/skoolsetu-logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollingNotice, setScrollingNotice] = useState("");

  const educationFacts = [
    "💡 Did you know? India has the world's largest education system with 1.5 million schools!",
    "📚 Fun Fact: The first university in the world, Takshashila, was founded in India in 700 BC!",
    "🎓 Did you know? India produces over 1.5 million engineers every year!",
    "✨ Fun Fact: Sanskrit is considered the mother of all European languages!",
    "📖 Did you know? India's literacy rate has grown from 12% in 1947 to over 77% today!",
    "🏫 Fun Fact: Nalanda University had 10,000+ students from all over the world in 5th century!",
    "🌟 Did you know? India has the largest number of schools in the world!",
    "📝 Fun Fact: Zero was invented in India by mathematician Aryabhata!",
    "🎯 Did you know? Indian students excel in STEM fields globally!",
    "💼 Fun Fact: IITs and IIMs are among the most competitive institutions worldwide!",
    "🧮 Did you know? The value of Pi was first calculated by Indian mathematician Budhayana!",
    "🌍 Fun Fact: India has the 2nd largest population of teachers - over 9 million!",
    "📱 Did you know? India has 50,000+ EdTech startups revolutionizing education!",
    "🔬 Fun Fact: India ranks 3rd globally in scientific research publications!",
    "👩‍🎓 Did you know? Female literacy in India has increased 4x since independence!",
    "🏆 Fun Fact: India has won 12 International Mathematical Olympiad medals!",
    "📊 Did you know? 65% of India's population is below 35 years - the learning generation!",
    "🌐 Fun Fact: India has the world's largest open online education platform - SWAYAM!",
    "✏️ Did you know? India's Right to Education Act covers 200+ million children!",
    "🎪 Fun Fact: Chess was invented in India and called 'Chaturanga'!",
    "🔢 Did you know? The Decimal system was invented in India around 100 BC!",
    "📜 Fun Fact: Aryabhata calculated Earth's circumference with 99.8% accuracy in 499 AD!",
    "🧬 Did you know? India has 800+ universities and 40,000+ colleges!",
    "🎨 Fun Fact: Yoga, practiced in 190+ countries, originated in Indian education!",
    "💻 Did you know? 75% of NASA scientists are of Indian origin!",
    "📈 Fun Fact: India's education budget has grown 10x in the last 20 years!",
    "🏅 Did you know? IIT JEE is considered the toughest entrance exam in the world!",
    "📗 Fun Fact: The Vedas are the oldest scriptures with educational hymns from 1500 BC!",
    "🌱 Did you know? Mid-Day Meal scheme feeds 120 million students daily in India!",
    "🎭 Fun Fact: Guru-Shishya tradition is the oldest form of mentorship education!",
  ];

  useEffect(() => {
    let idx = 0;
    setScrollingNotice(educationFacts[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % educationFacts.length;
      setScrollingNotice(educationFacts[idx]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <>
      {/* Mini Notice Board - Top Banner */}
      <div 
        className="fixed top-0 left-0 right-0 z-[60] h-7 flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(to right, hsl(145, 45%, 22%), hsl(145, 40%, 28%))',
          borderBottom: '2px solid hsl(30, 59%, 35%)',
        }}
      >
        <p 
          className="font-chalk text-xs md:text-sm tracking-wide text-center px-4 animate-fade-in"
          style={{ 
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}
          key={scrollingNotice}
        >
          {scrollingNotice}
        </p>
      </div>

      <header className="fixed top-7 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="SkoolSetu" className="h-12 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-foreground/70 hover:text-primary font-medium transition-colors duration-300"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="nav-login" size="default">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="nav-register" size="default">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border animate-slide-down">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-foreground/70 hover:text-primary font-medium py-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="nav-login" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="nav-register" className="w-full">
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
