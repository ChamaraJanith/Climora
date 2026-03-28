import { useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from './components/landing/Navbar';
import HeroSection from './components/landing/HeroSection';
import FeaturesSection from './components/landing/FeaturesSection';
import ShowcaseSection from './components/landing/ShowcaseSection';
import StatsSection from './components/landing/StatsSection';
import TestimonialsSection from './components/landing/TestimonialsSection';
import CTASection from './components/landing/CTASection';
import Footer from './components/landing/Footer';
import './App.css';

export default function App() {
  // Smooth scroll via Lenis
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-[#030712] min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ShowcaseSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
