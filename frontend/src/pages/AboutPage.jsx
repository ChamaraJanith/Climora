import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEAM = [
  { name: 'Aisha Rahman', role: 'CEO & Co-founder', bio: 'Former UNDP disaster risk advisor. 12 years in humanitarian response across Southeast Asia.', img: 'https://i.pravatar.cc/300?img=47', accent: '#06b6d4' },
  { name: 'Marcus Chen', role: 'CTO & Co-founder', bio: 'Ex-Google infrastructure engineer. Built real-time systems serving 100M+ users.', img: 'https://i.pravatar.cc/300?img=12', accent: '#3b82f6' },
  { name: 'Priya Nair', role: 'Head of Data Science', bio: 'PhD in atmospheric science. Pioneered ML-based flood prediction models used by 3 governments.', img: 'https://i.pravatar.cc/300?img=32', accent: '#a855f7' },
  { name: 'James Okafor', role: 'Head of Operations', bio: 'Led field operations for Red Cross across 8 countries. Expert in last-mile logistics.', img: 'https://i.pravatar.cc/300?img=15', accent: '#22c55e' },
  { name: 'Sofia Mendez', role: 'Lead Designer', bio: 'Previously at IDEO. Specialises in crisis UX — designing for high-stress, low-bandwidth environments.', img: 'https://i.pravatar.cc/300?img=25', accent: '#f97316' },
  { name: 'Yuki Tanaka', role: 'Head of Partnerships', bio: 'Built NGO and government partnerships across 40+ countries for climate resilience programs.', img: 'https://i.pravatar.cc/300?img=53', accent: '#eab308' },
];

const VALUES = [
  { icon: '⚡', title: 'Speed over perfection', desc: 'In a disaster, a good alert now beats a perfect alert too late. We build for real-time, always.' },
  { icon: '🌍', title: 'Equity by design', desc: 'Climate disasters hit the most vulnerable hardest. Every feature is built with that reality in mind.' },
  { icon: '🔍', title: 'Radical transparency', desc: 'We publish our model accuracy, our data sources, and our failure reports. Trust is earned, not assumed.' },
  { icon: '🤝', title: 'Community first', desc: 'The best data comes from the ground. We build tools that empower communities, not replace them.' },
];

const MILESTONES = [
  { year: '2021', title: 'Founded', desc: 'Climora started as a research project after the 2021 European floods exposed critical gaps in early warning systems.' },
  { year: '2022', title: 'First Deployment', desc: 'Piloted in Bangladesh during monsoon season. 8,000 residents received early warnings. Zero flood fatalities in covered zones.' },
  { year: '2023', title: 'Series A', desc: 'Raised $12M to expand the shelter network and build the community reporting layer. Reached 10 countries.' },
  { year: '2024', title: 'Scale', desc: '50,000+ active users. 200+ shelters. Deployed across 4 continents. Partnered with UNDP and Red Cross.' },
  { year: '2025', title: 'AI Forecasting', desc: 'Launched 72-hour predictive engine. Achieved 91% accuracy on flood forecasting in Southeast Asia.' },
  { year: '2026', title: 'Today', desc: 'Operating in 28 countries. Building toward a world where no one is caught off guard by a climate event.' },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────

function AboutHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Parallax bg image */}
      <motion.div style={{ y: imgY }} className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1800&q=80"
          alt="landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/70 via-[#030712]/60 to-[#030712]" />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-900/20 blur-[140px] rounded-full" />
      </div>

      <motion.div style={{ opacity }} className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 pt-40 pb-24 text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6"
        >
          Our Story
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
        >
          Built by people who've
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">seen the gaps.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Climora was born from frustration — watching communities suffer not from lack of data, but from lack of the right tools to act on it. We're here to close that gap.
        </motion.p>
      </motion.div>
    </section>
  );
}

// ─── Mission ──────────────────────────────────────────────────────────────────

function MissionSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-6">
              Our Mission
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6">
              No one should be caught off guard by a climate event.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-5">
              Climate disasters are becoming more frequent, more intense, and more unpredictable. The technology to respond better already exists — it's just not reaching the people who need it most.
            </p>
            <p className="text-slate-400 text-base leading-relaxed mb-8">
              Climora exists to change that. We build tools that give communities, emergency responders, and governments the intelligence and coordination they need — before, during, and after a disaster.
            </p>
            <div className="h-px w-16 bg-gradient-to-r from-cyan-500 to-transparent" />
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden aspect-[4/3]"
            style={{ boxShadow: '0 40px 80px -20px rgba(6,182,212,0.15)' }}
          >
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=80"
              alt="Mission"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#030712]/50 via-transparent to-transparent" />
            <div className="absolute inset-0 rounded-2xl border border-white/10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Values ───────────────────────────────────────────────────────────────────

function ValuesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm font-medium mb-5">
            What We Stand For
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Our values</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-white/8 bg-white/3 p-7 group overflow-hidden"
            >
              <div className="text-4xl mb-4">{v.icon}</div>
              <h3 className="text-white font-black text-xl mb-2">{v.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 30px rgba(99,102,241,0.06)' }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function MilestoneSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium mb-5">
            Our Journey
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">From idea to impact</h2>
        </motion.div>

        <div className="relative">
          <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-blue-500/20 to-transparent" />

          <div className="space-y-10">
            {MILESTONES.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex gap-8 items-start"
              >
                {/* Year */}
                <div className="w-16 flex-shrink-0 text-right">
                  <span className="text-sm font-black text-cyan-400">{m.year}</span>
                </div>

                {/* Dot */}
                <div className="flex-shrink-0 mt-1.5">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-cyan-500/20" />
                </div>

                {/* Content */}
                <div className="pb-2">
                  <h4 className="text-white font-bold text-base mb-1">{m.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────────────

function TeamSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-5">
            The Team
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            People behind the platform
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            A team of engineers, scientists, and humanitarian workers united by one goal.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              whileHover={{ y: -5 }}
              className="relative rounded-2xl border border-white/8 bg-[#080d1a] p-6 group overflow-hidden"
            >
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img src={member.img} alt={member.name}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#080d1a]"
                    style={{ background: member.accent }} />
                </div>
                <div>
                  <div className="text-white font-bold text-base">{member.name}</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: member.accent }}>{member.role}</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{member.bio}</p>

              {/* Hover glow */}
              <motion.div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 0 1px ${member.accent}30` }} />
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${member.accent}12, transparent 70%)` }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Partners ─────────────────────────────────────────────────────────────────

function PartnersSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const logos = ['UNDP', 'Red Cross', 'FEMA', 'WHO', 'World Bank', 'UNICEF'];

  return (
    <section ref={ref} className="py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.7 }}
          className="text-center text-slate-600 text-sm font-medium tracking-widest uppercase mb-10"
        >
          Trusted by global organizations
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {logos.map((logo, i) => (
            <motion.div
              key={logo}
              initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="text-slate-600 font-black text-lg tracking-tight hover:text-slate-400 transition-colors cursor-default"
            >
              {logo}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTAStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} className="py-28 border-t border-white/5">
      <div className="absolute inset-x-0 flex justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-indigo-900/20 blur-[120px] rounded-full" />
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
          Want to work with us?
        </h2>
        <p className="text-slate-400 text-lg mb-10">
          We're always looking for engineers, scientists, and humanitarian experts who want to build technology that matters.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(6,182,212,0.4)' }} whileTap={{ scale: 0.97 }}
            className="px-9 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20">
            View Open Roles
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="px-9 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-semibold backdrop-blur-sm hover:bg-white/10 transition-all">
            Partner With Us
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="bg-[#030712] min-h-screen">
      <Navbar />
      <main>
        <AboutHero />
        <MissionSection />
        <ValuesSection />
        <MilestoneSection />
        <TeamSection />
        <PartnersSection />
        <CTAStrip />
      </main>
      <Footer />
    </div>
  );
}
