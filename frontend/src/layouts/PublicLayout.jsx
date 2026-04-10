import { Outlet } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

/**
 * PublicLayout
 * Shared shell for public-facing pages that need the landing Navbar + Footer
 * (e.g. /weather). Pages like LandingPage that manage their own Navbar/Footer
 * should NOT be wrapped by this layout.
 */
export default function PublicLayout() {
  return (
    <div className="bg-[#030712] min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
