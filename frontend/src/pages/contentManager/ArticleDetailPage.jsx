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

// ── Quiz Component ─────────────────────────────────────────────────────────────
function QuizSection({ quiz, articleId, previousAttempt }) {
  const { user } = useAuth();
  const [step, setStep] = useState('start'); // start | taking | result
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const startQuiz = () => {
    setAnswers(new Array(quiz.questions.length).fill(null));
    setCurrentQ(0);
    setStep('taking');
  };

  const selectAnswer = (optionIndex) => {
    const updated = [...answers];
    updated[currentQ] = optionIndex;
    setAnswers(updated);
  };

  const next = () => {
    if (currentQ < quiz.questions.length - 1) setCurrentQ(q => q + 1);
  };

  const prev = () => {
    if (currentQ > 0) setCurrentQ(q => q - 1);
  };

  const submit = async () => {
    if (answers.some(a => a === null)) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/articles/${articleId}/quiz/submit`, { answers });
      setResult(res.data);
      setStep('result');
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const q = quiz.questions[currentQ];
  const answered = answers.filter(a => a !== null).length;

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">{quiz.title}</h3>
          <p className="text-slate-500 text-xs">{quiz.questions.length} questions · Pass: {quiz.passingScore}%</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* START */}
        {step === 'start' && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {previousAttempt && (
              <div className={`mb-4 px-4 py-3 rounded-xl border text-sm ${previousAttempt.passed ? 'border-green-500/30 bg-green-500/8 text-green-400' : 'border-orange-500/30 bg-orange-500/8 text-orange-400'}`}>
                Last attempt: {previousAttempt.percentage}% — {previousAttempt.passed ? '✅ Passed' : '❌ Not passed'}
              </div>
            )}
            {!user ? (
              <p className="text-slate-500 text-sm mb-4">
                <Link to="/login" className="text-cyan-400 hover:underline">Log in</Link> to take this quiz and track your progress.
              </p>
            ) : (
              <motion.button
                onClick={startQuiz}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-yellow-500/20"
              >
                {previousAttempt ? 'Retake Quiz' : 'Start Quiz'} →
              </motion.button>
            )}
          </motion.div>
        )}

        {/* TAKING */}
        {step === 'taking' && (
          <motion.div key="taking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs">Question {currentQ + 1} of {quiz.questions.length}</span>
              <span className="text-slate-500 text-xs">{answered}/{quiz.questions.length} answered</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 mb-5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <p className="text-white font-semibold text-sm mb-4">{q.question}</p>

            {/* Options */}
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
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold mr-3 ${
                    answers[currentQ] === i ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-white/20'
                  }`}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between">
              <button onClick={prev} disabled={currentQ === 0} className="px-4 py-2 rounded-xl border border-white/8 text-slate-400 text-sm disabled:opacity-30 hover:bg-white/4">
                ← Prev
              </button>
              {currentQ < quiz.questions.length - 1 ? (
                <button onClick={next} disabled={answers[currentQ] === null} className="px-4 py-2 rounded-xl bg-white/8 text-white text-sm disabled:opacity-40 hover:bg-white/12">
                  Next →
                </button>
              ) : (
                <motion.button
                  onClick={submit}
                  disabled={answers.some(a => a === null) || submitting}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold disabled:opacity-40"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* RESULT */}
        {step === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center mb-5">
              <div className={`text-5xl font-black mb-2 ${result.passed ? 'text-green-400' : 'text-orange-400'}`}>
                {result.percentage}%
              </div>
              <div className={`text-sm font-bold mb-1 ${result.passed ? 'text-green-400' : 'text-orange-400'}`}>
                {result.passed ? '🎉 Passed!' : '📚 Keep Learning'}
              </div>
              <div className="text-slate-500 text-xs">{result.score} / {result.total} correct</div>
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.results?.map((r, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg border text-xs ${r.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <div className="flex items-start gap-2">
                    <span>{r.isCorrect ? '✅' : '❌'}</span>
                    <div>
                      <p className="text-slate-300 font-medium">{r.question}</p>
                      {!r.isCorrect && <p className="text-slate-500 mt-0.5">{r.explanation}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep('start')} className="mt-4 w-full py-2 rounded-xl border border-white/8 text-slate-400 text-sm hover:bg-white/4">
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── YouTube Videos ─────────────────────────────────────────────────────────────
function VideoCard({ video }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
          className="w-full aspect-video"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <div className="relative cursor-pointer group" onClick={() => setPlaying(true)}>
          <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </div>
      )}
      <div className="p-3">
        <p className="text-white text-xs font-semibold line-clamp-2">{video.title}</p>
        <p className="text-slate-600 text-[10px] mt-1">{video.channelTitle}</p>
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
        // If user logged in, fetch quiz attempt info
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
    <div className="min-h-screen bg-[#030712] pt-24 px-6 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full" />
    </div>
  );

  if (!article) return null;

  const accentColor = CAT_COLORS[article.category] || '#06b6d4';

  return (
    <div className="min-h-screen bg-[#030712] pt-20 pb-16">

      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${accentColor}20, transparent)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-8 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/articles" className="inline-flex items-center gap-2 text-slate-500 text-xs hover:text-slate-300 mb-4 transition-colors">
              ← Back to articles
            </Link>
            <span
              className="inline-block px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest mb-3"
              style={{ color: accentColor, background: `${accentColor}18`, borderColor: `${accentColor}30` }}
            >
              {article.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{article.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-slate-500 text-xs">
              <span>By {article.author}</span>
              <span>·</span>
              <span>{new Date(article.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

          {/* Article content */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="prose prose-invert prose-sm max-w-none">
              {/* Render content as paragraphs */}
              {article.content.split('\n').map((para, i) => (
                para.trim() ? <p key={i} className="text-slate-300 leading-relaxed mb-4">{para}</p> : <br key={i} />
              ))}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            {/* Quiz */}
            {article.hasQuiz && article.quiz && (
              <QuizSection
                quiz={article.quiz}
                articleId={id}
                previousAttempt={quizInfo?.lastAttempt}
              />
            )}

            {/* Related Videos */}
            {article.hasRelatedVideos && article.relatedVideos?.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-5">
                <h3 className="text-white font-bold text-sm mb-4">Related Videos</h3>
                <div className="space-y-3">
                  {article.relatedVideos.slice(0, 3).map((v, i) => (
                    <VideoCard key={i} video={v} />
                  ))}
                </div>
              </div>
            )}

            {/* Category info */}
            <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-5">
              <h3 className="text-white font-bold text-sm mb-3">About this category</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${accentColor}18` }}>
                  {{ flood: '🌊', drought: '☀️', cyclone: '🌀', landslide: '⛰️', wildfire: '🔥', tsunami: '🌊', earthquake: '🏚️', general: '📄' }[article.category] || '📄'}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold capitalize">{article.category}</div>
                  <div className="text-slate-500 text-xs">Disaster category</div>
                </div>
              </div>
              <Link
                to={`/articles?category=${article.category}`}
                className="mt-4 block text-center py-2 rounded-xl border border-white/8 text-xs text-slate-400 hover:text-white hover:bg-white/4 transition-colors"
              >
                View more {article.category} articles →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}