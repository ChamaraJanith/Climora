import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const CAT_COLORS = {
  flood: '#06b6d4', drought: '#eab308', cyclone: '#6366f1',
  landslide: '#a855f7', wildfire: '#f97316', tsunami: '#3b82f6',
  earthquake: '#ef4444', general: '#22c55e',
};

const CAT_ICONS = {
  flood: '🌊', drought: '☀️', cyclone: '🌀', landslide: '⛰️',
  wildfire: '🔥', tsunami: '🌊', earthquake: '🏚️', general: '📄',
};

// ── Quiz Component ─────────────────────────────────────────────────────────────
function QuizSection({ quiz, articleId, previousAttempt }) {
  const { user } = useAuth();
  const total = quiz.questions.length;

  // answers[i] = selected option index (0-3) or null
  const [answers, setAnswers] = useState(() => new Array(total).fill(null));
  const [currentQ, setCurrentQ] = useState(0);
  const [step, setStep] = useState('start'); // start | taking | result
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const startQuiz = () => {
    setAnswers(new Array(total).fill(null));
    setCurrentQ(0);
    setResult(null);
    setSubmitError(null);
    setStep('taking');
  };

  const selectAnswer = (optionIndex) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentQ] = optionIndex;
      return next;
    });
  };

  const goTo = (index) => {
    if (index >= 0 && index < total) setCurrentQ(index);
  };

  const submit = async () => {
    if (answers.some(a => a === null)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post(`/articles/${articleId}/quiz/submit`, { answers });
      setResult(res.data);
      setStep('result');
    } catch (e) {
      setSubmitError(e?.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const q = quiz.questions[currentQ];
  const answeredCount = answers.filter(a => a !== null).length;
  const allAnswered = answeredCount === total;
  const progressPct = (answeredCount / total) * 100;

  // ── Start screen ──
  if (step === 'start') return (
    <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-yellow-500/8 to-yellow-500/3 p-5">
      <QuizHeader quiz={quiz} />
      {previousAttempt && (
        <div className={`mb-4 px-4 py-3 rounded-xl border text-sm flex items-center justify-between ${
          previousAttempt.passed
            ? 'border-green-500/30 bg-green-500/8 text-green-400'
            : 'border-orange-500/30 bg-orange-500/8 text-orange-400'
        }`}>
          <span>Last attempt: <strong>{previousAttempt.percentage}%</strong></span>
          <span>{previousAttempt.passed ? '✅ Passed' : '❌ Not passed'}</span>
        </div>
      )}
      {!user ? (
        <p className="text-slate-500 text-sm">
          <Link to="/login" className="text-cyan-400 hover:underline">Log in</Link> to take this quiz and track your progress.
        </p>
      ) : (
        <motion.button
          onClick={startQuiz}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-yellow-500/20"
        >
          {previousAttempt ? 'Retake Quiz' : 'Start Quiz'} →
        </motion.button>
      )}
    </div>
  );

  // ── Taking screen ──
  if (step === 'taking') return (
    <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-yellow-500/8 to-yellow-500/3 p-5">
      <QuizHeader quiz={quiz} />

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-500 text-xs">Question {currentQ + 1} of {total}</span>
          <span className="text-slate-500 text-xs">{answeredCount}/{total} answered</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question dot navigator */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {quiz.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${
              i === currentQ
                ? 'bg-yellow-500 text-black'
                : answers[i] !== null
                  ? 'bg-yellow-500/25 text-yellow-400 border border-yellow-500/40'
                  : 'bg-white/6 text-slate-500 border border-white/10 hover:bg-white/12'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
        >
          <p className="text-white font-semibold text-sm mb-4 leading-relaxed">{q.question}</p>

          <div className="space-y-2 mb-5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  answers[currentQ] === i
                    ? 'border-yellow-500/60 bg-yellow-500/15 text-yellow-300'
                    : 'border-white/8 bg-white/3 text-slate-300 hover:border-white/20 hover:bg-white/6'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold mr-3 shrink-0 ${
                  answers[currentQ] === i ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-white/20'
                }`}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => goTo(currentQ - 1)}
          disabled={currentQ === 0}
          className="px-4 py-2 rounded-xl border border-white/8 text-slate-400 text-sm disabled:opacity-30 hover:bg-white/4 transition-colors"
        >
          ← Prev
        </button>

        {currentQ < total - 1 ? (
          <button
            onClick={() => goTo(currentQ + 1)}
            className="px-4 py-2 rounded-xl bg-white/8 text-white text-sm hover:bg-white/12 transition-colors"
          >
            Next →
          </button>
        ) : (
          <motion.button
            onClick={submit}
            disabled={!allAnswered || submitting}
            whileHover={allAnswered && !submitting ? { scale: 1.02 } : {}}
            whileTap={allAnswered && !submitting ? { scale: 0.98 } : {}}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold disabled:opacity-40 transition-opacity"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : `Submit${!allAnswered ? ` (${total - answeredCount} left)` : ''}`}
          </motion.button>
        )}
      </div>

      {submitError && (
        <p className="mt-3 text-red-400 text-xs text-center">{submitError}</p>
      )}
    </div>
  );

  // ── Result screen ──
  if (step === 'result' && result) return (
    <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-yellow-500/8 to-yellow-500/3 p-5">
      <QuizHeader quiz={quiz} />

      {/* Score */}
      <div className={`rounded-xl border p-4 mb-4 text-center ${
        result.passed ? 'border-green-500/30 bg-green-500/8' : 'border-orange-500/30 bg-orange-500/8'
      }`}>
        <div className={`text-4xl font-black mb-1 ${result.passed ? 'text-green-400' : 'text-orange-400'}`}>
          {result.percentage}%
        </div>
        <div className={`text-sm font-bold mb-0.5 ${result.passed ? 'text-green-400' : 'text-orange-400'}`}>
          {result.passed ? '🎉 Passed!' : '📚 Keep Learning'}
        </div>
        <div className="text-slate-500 text-xs">{result.score} / {result.total} correct · Pass mark: {result.passingScore}%</div>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-4">
        {result.results?.map((r, i) => (
          <div key={i} className={`px-3 py-3 rounded-xl border text-xs ${
            r.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
          }`}>
            <div className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5">{r.isCorrect ? '✅' : '❌'}</span>
              <div className="min-w-0">
                <p className="text-slate-300 font-medium leading-snug">{r.question}</p>
                {!r.isCorrect && (
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-red-400/80">
                      Your answer: <span className="font-medium">{r.options?.[r.userAnswer] ?? '—'}</span>
                    </p>
                    <p className="text-green-400/80">
                      Correct: <span className="font-medium">{r.options?.[r.correctAnswer] ?? '—'}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={startQuiz}
        className="w-full py-2.5 rounded-xl border border-white/8 text-slate-400 text-sm hover:bg-white/4 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  return null;
}

// Small reusable header for all quiz steps
function QuizHeader({ quiz }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <h3 className="text-white font-bold text-sm">{quiz.title}</h3>
        <p className="text-slate-500 text-xs">{quiz.questions.length} questions · Pass: {quiz.passingScore}%</p>
      </div>
    </div>
  );
}

// ── Video Section with show more ──────────────────────────────────────────────
function VideoSection({ videos }) {
  const INITIAL = 3;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? videos : videos.slice(0, INITIAL);
  const hasMore = videos.length > INITIAL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="mt-12"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-white/6" />
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
            Related Videos
          </span>
          <span className="text-slate-700 text-xs">({videos.length})</span>
        </div>
        <div className="h-px flex-1 bg-white/6" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((v, i) => (
          <VideoCard key={i} video={v} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setShowAll(s => !s)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/4 text-slate-400 text-sm hover:bg-white/8 hover:text-white transition-all"
          >
            {showAll ? (
              <>Show less <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg></>
            ) : (
              <>Show {videos.length - INITIAL} more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg></>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── YouTube Video Card (full card for below-article grid) ─────────────────────
function VideoCard({ video }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="rounded-xl border border-white/8 bg-[#0a1020] overflow-hidden group hover:border-white/16 transition-all duration-200">
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
          className="w-full aspect-video"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <div className="relative cursor-pointer aspect-video overflow-hidden" onClick={() => setPlaying(true)}>
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </div>
      )}
      <div className="p-3.5">
        <p className="text-white text-sm font-semibold line-clamp-2 leading-snug mb-1">{video.title}</p>
        <p className="text-slate-500 text-xs truncate">{video.channelTitle}</p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizInfo, setQuizInfo] = useState(null);

  useEffect(() => {
    api.get(`/articles/${id}`)
      .then(res => {
        setArticle(res.data);
        if (user && res.data.hasQuiz) {
          api.get(`/articles/${id}/quiz`)
            .then(qRes => setQuizInfo(qRes.data))
            .catch(() => {});
        }
      })
      .catch(() => navigate('/articles'))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full" />
        <p className="text-slate-600 text-sm">Loading article...</p>
      </div>
    </div>
  );

  if (!article) return null;

  const accentColor = CAT_COLORS[article.category] || '#06b6d4';
  const catIcon = CAT_ICONS[article.category] || '📄';

  // Parse content into paragraphs, headings, etc.
  const contentBlocks = article.content.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (trimmed.startsWith('# ')) return (
      <h2 key={i} className="text-2xl font-black text-white mt-8 mb-3 leading-tight">{trimmed.slice(2)}</h2>
    );
    if (trimmed.startsWith('## ')) return (
      <h3 key={i} className="text-lg font-bold text-white mt-6 mb-2">{trimmed.slice(3)}</h3>
    );
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) return (
      <li key={i} className="text-slate-300 leading-relaxed ml-4 list-disc">{trimmed.slice(2)}</li>
    );
    return <p key={i} className="text-slate-300 leading-[1.85] mb-1">{trimmed}</p>;
  });

  return (
    <div className="min-h-screen bg-[#030712]">

      {/* ── Hero ── */}
      <div className="relative h-80 md:h-[420px] overflow-hidden">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{
            background: `radial-gradient(ellipse at 30% 50%, ${accentColor}25 0%, transparent 70%), linear-gradient(135deg, #080d1a 0%, #030712 100%)`
          }} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/70 to-[#030712]/10" />

        {/* Back button — top left, always visible */}
        <div className="absolute top-0 left-0 right-0 pt-20 px-6 md:px-12 max-w-5xl mx-auto">
          <motion.button
            onClick={() => navigate(-1)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-slate-300 text-sm hover:bg-white/14 hover:text-white hover:border-white/20 transition-all backdrop-blur-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </motion.button>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-10 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest mb-4"
              style={{ color: accentColor, background: `${accentColor}18`, borderColor: `${accentColor}35` }}
            >
              <span>{catIcon}</span>
              {article.category}
            </span>
            <h1 className="text-3xl md:text-[2.6rem] font-black text-white leading-tight tracking-tight max-w-3xl">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-slate-500 text-xs">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {article.author}
              </span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {new Date(article.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

        {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-10 pb-20">

        {/* Article + Sidebar grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">

          {/* Article content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {/* Divider accent */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-white/6" />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
              <div className="h-px flex-1 bg-white/6" />
            </div>

            <div className="space-y-1 text-[15px]">
              {contentBlocks}
            </div>
          </motion.article>

          {/* Sidebar — category only, sticky */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="hidden lg:block lg:sticky lg:top-24 lg:self-start space-y-5"
          >
            <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-5">
              <h3 className="text-white font-bold text-sm mb-4">About this category</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}25` }}>
                  {catIcon}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold capitalize">{article.category}</div>
                  <div className="text-slate-500 text-xs">Disaster category</div>
                </div>
              </div>
              <Link
                to={`/articles?category=${article.category}`}
                className="block text-center py-2.5 rounded-xl border border-white/8 text-xs text-slate-400 hover:text-white hover:bg-white/4 hover:border-white/15 transition-all"
              >
                View more {article.category} articles →
              </Link>
            </div>
          </motion.aside>
        </div>

        {/* ── Related Videos — full width grid below article ── */}
        {article.hasRelatedVideos && article.relatedVideos?.length > 0 && (
          <VideoSection videos={article.relatedVideos} />
        )}

        {/* ── Quiz — full width below videos ── */}
        {article.hasQuiz && article.quiz && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/6" />
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-1">Knowledge Check</span>
              <div className="h-px flex-1 bg-white/6" />
            </div>
            <div className="max-w-2xl mx-auto">
              <QuizSection
                quiz={article.quiz}
                articleId={id}
                previousAttempt={quizInfo?.lastAttempt}
              />
            </div>
          </motion.div>
        )}

        {/* Bottom back button */}
        <div className="mt-12 pt-8 border-t border-white/6">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -2 }}
            className="inline-flex items-center gap-2 text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </motion.button>
        </div>
      </div>
    </div>
  );
}
