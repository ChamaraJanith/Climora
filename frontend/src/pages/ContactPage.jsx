import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

// ─── Data ─────────────────────────────────────────────────────────────────────

const CONTACT_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Email Us',
    value: 'hello@climora.io',
    sub: 'We reply within 24 hours',
    accent: '#06b6d4',
    href: 'mailto:hello@climora.io',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    label: 'Headquarters',
    value: 'Amsterdam, Netherlands',
    sub: 'UTC+1 · Mon–Fri 9am–6pm',
    accent: '#6366f1',
    href: null,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Live Chat',
    value: 'Available in-app',
    sub: 'Avg. response under 5 min',
    accent: '#22c55e',
    href: null,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'GitHub',
    value: 'github.com/climora',
    sub: 'Open source contributions welcome',
    accent: '#a855f7',
    href: 'https://github.com',
  },
];

const TOPICS = [
  'General Inquiry',
  'Partnership / NGO',
  'Government / Emergency Services',
  'Press & Media',
  'Technical Support',
  'Careers',
];

// ─── Hero ─────────────────────────────────────────────────────────────────────

function ContactHero() {
  return (
    <section className="relative pt-40 pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-900/15 blur-[160px] rounded-full" />
      </div>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="max-w-3xl mx-auto px-6 md:px-12 text-center relative z-10">
        <motion.span
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6"
        >
          Get In Touch
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-5"
        >
          Let's talk about
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">what matters.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-400 text-lg max-w-xl mx-auto"
        >
          Whether you're an NGO, government agency, journalist, or just curious — we'd love to hear from you.
        </motion.p>
      </div>
    </section>
  );
}

// ─── Contact cards ────────────────────────────────────────────────────────────

function ContactCards() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
      {CONTACT_CARDS.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08 }}
          whileHover={{ y: -4 }}
          className="relative rounded-2xl border border-white/8 bg-[#080d1a] p-5 group overflow-hidden cursor-default"
          onClick={() => card.href && window.open(card.href)}
          style={{ cursor: card.href ? 'pointer' : 'default' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: `${card.accent}18`, color: card.accent, border: `1px solid ${card.accent}30` }}>
            {card.icon}
          </div>
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: card.accent }}>{card.label}</p>
          <p className="text-white font-semibold text-sm mb-1">{card.value}</p>
          <p className="text-slate-600 text-xs">{card.sub}</p>

          {/* Hover glow */}
          <motion.div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400"
            style={{ boxShadow: `inset 0 0 0 1px ${card.accent}35` }} />
          <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle at top right, ${card.accent}12, transparent 70%)` }} />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function ContactForm() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1400);
  };

  const inputClass = (field) =>
    `w-full bg-[#080d1a] border rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-all duration-300 ${
      focused === field ? 'border-cyan-500/60 shadow-[0_0_0_3px_rgba(6,182,212,0.08)]' : 'border-white/8 hover:border-white/15'
    }`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl border border-white/8 bg-[#080d1a] p-8 md:p-10 overflow-hidden"
    >
      {/* Corner glows */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-6"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <h3 className="text-white font-black text-2xl mb-3">Message sent.</h3>
            <p className="text-slate-400 text-sm max-w-sm">We'll get back to you within 24 hours. In the meantime, feel free to explore the platform.</p>
            <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
              className="mt-8 text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
              Send another message →
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-1">Send us a message</h2>
              <p className="text-slate-500 text-sm">Fill in the form and we'll be in touch shortly.</p>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide uppercase">Name</label>
                <input
                  type="text" required placeholder="Your name"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                  className={inputClass('name')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide uppercase">Email</label>
                <input
                  type="email" required placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  className={inputClass('email')}
                />
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide uppercase">Topic</label>
              <select
                required value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                onFocus={() => setFocused('topic')} onBlur={() => setFocused(null)}
                className={`${inputClass('topic')} appearance-none`}
              >
                <option value="" disabled>Select a topic...</option>
                {TOPICS.map(t => <option key={t} value={t} className="bg-[#080d1a]">{t}</option>)}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide uppercase">Message</label>
              <textarea
                required rows={5} placeholder="Tell us what's on your mind..."
                value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                onFocus={() => setFocused('message')} onBlur={() => setFocused(null)}
                className={`${inputClass('message')} resize-none`}
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(6,182,212,0.35)' }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
            >
              {loading ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Side info ────────────────────────────────────────────────────────────────

function SideInfo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Response time */}
      <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-sm font-semibold">All systems operational</span>
        </div>
        <h3 className="text-white font-black text-lg mb-3">Response times</h3>
        {[
          { label: 'General inquiries', time: '< 24h', color: '#06b6d4' },
          { label: 'Partnership requests', time: '< 48h', color: '#6366f1' },
          { label: 'Technical support', time: '< 4h', color: '#22c55e' },
          { label: 'Emergency / critical', time: '< 1h', color: '#ef4444' },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
            <span className="text-slate-400 text-sm">{r.label}</span>
            <span className="text-sm font-bold" style={{ color: r.color }}>{r.time}</span>
          </div>
        ))}
      </div>

      {/* Office hours */}
      <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6">
        <h3 className="text-white font-black text-lg mb-4">Office hours</h3>
        {[
          { day: 'Monday – Friday', hours: '9:00 – 18:00 CET' },
          { day: 'Saturday', hours: '10:00 – 14:00 CET' },
          { day: 'Sunday', hours: 'Closed' },
        ].map(o => (
          <div key={o.day} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
            <span className="text-slate-400 text-sm">{o.day}</span>
            <span className="text-white text-sm font-medium">{o.hours}</span>
          </div>
        ))}
        <p className="text-slate-600 text-xs mt-4">Emergency response support is available 24/7 for active disaster events.</p>
      </div>

      {/* Social */}
      <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6">
        <h3 className="text-white font-black text-lg mb-4">Follow us</h3>
        <div className="flex gap-3">
          {[
            { label: 'X / Twitter', icon: '𝕏', color: '#fff' },
            { label: 'LinkedIn', icon: 'in', color: '#0a66c2' },
            { label: 'GitHub', icon: '⌥', color: '#a855f7' },
          ].map(s => (
            <motion.button
              key={s.label} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-sm font-black hover:bg-white/10 transition-all"
              style={{ color: s.color }}
              title={s.label}
            >
              {s.icon}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: 'Is Climora free to use?', a: 'Yes — the core platform is free for individuals and communities. We offer paid plans for organizations needing advanced features, API access, or dedicated support.' },
  { q: 'How do I integrate Climora with our existing emergency systems?', a: 'We provide a REST API and webhook system. Our partnerships team can guide you through integration with CAP-compliant alert systems, GIS platforms, and government databases.' },
  { q: 'Can NGOs and government agencies get special pricing?', a: 'Absolutely. We offer free or heavily discounted access for verified NGOs, humanitarian organizations, and government emergency services. Contact our partnerships team.' },
  { q: 'How accurate are the weather forecasts?', a: 'Our 72-hour flood forecasting model has achieved 91% accuracy in Southeast Asia deployments. Accuracy varies by region and event type — we publish full model performance reports on our GitHub.' },
];

function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [open, setOpen] = useState(null);

  return (
    <section ref={ref} className="py-24 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Frequently asked</h2>
          <p className="text-slate-500 text-base">Quick answers to common questions.</p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-xl border border-white/8 bg-[#080d1a] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
              >
                <span className="text-white font-semibold text-sm pr-4">{faq.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0 text-xl leading-none"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <div className="bg-[#030712] min-h-screen">
      <Navbar />
      <main>
        <ContactHero />

        <section className="max-w-7xl mx-auto px-6 md:px-12 pb-10">
          <ContactCards />

          {/* Form + side info */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <ContactForm />
            <SideInfo />
          </div>
        </section>

        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
