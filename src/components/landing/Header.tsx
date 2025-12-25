import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/skoolsetu-logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollingNotice, setScrollingNotice] = useState("");

  const notices = [
    "🎉 New Year Admissions Open!",
    "📚 Free Demo Available",
    "⭐ Trusted by 500+ Schools",
  ];

  useEffect(() => {
    let idx = 0;
    setScrollingNotice(notices[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % notices.length;
      setScrollingNotice(notices[idx]);
    }, 4000);
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
