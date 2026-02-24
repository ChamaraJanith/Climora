/**
 * UNIT TESTS — quizController.js
 * Path: tests/unit/quizController.test.js
 */

jest.mock('../../models/Quiz');
jest.mock('../../models/Article');
jest.mock('../../models/QuizAttempt');
jest.mock('../../models/User');

const Quiz        = require('../../models/Quiz');
const Article     = require('../../models/Article');
const QuizAttempt = require('../../models/QuizAttempt');
const User        = require('../../models/User');

const {
    getAllQuizzes,
    getQuizByArticleId,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getQuizForUser,
    submitQuizForUser,
} = require('../../controller/quizController');

// ── Helpers ────────────────────────────────────────────────────────────────
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
};
const mockReq = (o = {}) => ({ query: {}, params: {}, body: {}, user: { userId: 'USR-001' }, ...o });

const validQuestion = {
    question: 'What is the safest action during a flood?',
    options:  ['Stay indoors', 'Move to high ground', 'Go outside', 'Ignore it'],
    correctAnswer: 1,
};

const mockQuiz = {
    _id:         'QUZ-260219-001',
    title:       'Flood Safety Quiz',
    articleId:   'ART-260219-1234',
    questions:   [validQuestion],
    passingScore: 60,
};

const mockArticle = {
    _id:    'ART-260219-1234',
    title:  'Flood Guide',
    quizId: 'QUZ-260219-001',
};

const mockUser = {
    _id:      'USR-260219-001',
    userId:   'USR-001',
    username: 'testuser',
};

// chainable mock helpers
const populateChain = (data) => ({
    populate: jest.fn().mockReturnThis(),
    limit:    jest.fn().mockReturnThis(),
    skip:     jest.fn().mockReturnThis(),
    lean:     jest.fn().mockResolvedValue(data),
});

const populateLean = (data) => ({
    populate: jest.fn().mockReturnThis(),
    lean:     jest.fn().mockResolvedValue(data),
});

const sortLean = (data) => ({
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
});

// ══════════════════════════════════════════════════════════════════════════════
// getAllQuizzes
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getAllQuizzes', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns paginated quiz list', async () => {
        Quiz.find.mockReturnValue(populateChain([mockQuiz]));
        Quiz.countDocuments.mockResolvedValue(1);

        const res = mockRes();
        await getAllQuizzes(mockReq({ query: { page: '1', limit: '20' } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.quizzes).toHaveLength(1);
        expect(body.pagination.total).toBe(1);
    });

    test('returns 500 on DB error', async () => {
        Quiz.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            limit:    jest.fn().mockReturnThis(),
            skip:     jest.fn().mockReturnThis(),
            lean:     jest.fn().mockRejectedValue(new Error('DB error')),
        });

        const res = mockRes();
        await getAllQuizzes(mockReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getQuizByArticleId
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getQuizByArticleId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns quiz when article has one', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });

        const res = mockRes();
        await getQuizByArticleId(mockReq({ params: { articleId: 'ART-260219-1234' } }), res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: 'QUZ-260219-001' }));
    });

    test('returns 404 when article not found', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await getQuizByArticleId(mockReq({ params: { articleId: 'NOPE' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 404 when article has no quiz', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ ...mockArticle, quizId: null }) });

        const res = mockRes();
        await getQuizByArticleId(mockReq({ params: { articleId: 'ART-260219-1234' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getQuizById
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getQuizById', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns quiz by ID', async () => {
        Quiz.findById.mockReturnValue(populateLean(mockQuiz));

        const res = mockRes();
        await getQuizById(mockReq({ params: { id: 'QUZ-260219-001' } }), res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: 'QUZ-260219-001' }));
    });

    test('returns 404 when quiz not found', async () => {
        Quiz.findById.mockReturnValue(populateLean(null));

        const res = mockRes();
        await getQuizById(mockReq({ params: { id: 'NOPE' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// createQuiz
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] createQuiz', () => {
    beforeEach(() => jest.clearAllMocks());

    const validBody = {
        title: 'Flood Safety Quiz',
        articleId: 'ART-260219-1234',
        questions: [validQuestion],
        passingScore: 60,
    };

    test('creates quiz and links to article', async () => {
        Article.findById.mockResolvedValue({ ...mockArticle, quizId: null });
        Quiz.create.mockResolvedValue(mockQuiz);
        Article.findByIdAndUpdate.mockResolvedValue({});

        const res = mockRes();
        await createQuiz(mockReq({ body: validBody }), res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(Article.findByIdAndUpdate).toHaveBeenCalledWith('ART-260219-1234', { quizId: 'QUZ-260219-001' });
    });

    test('returns 400 when title missing', async () => {
        const res = mockRes();
        await createQuiz(mockReq({ body: { ...validBody, title: undefined } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when questions empty', async () => {
        const res = mockRes();
        await createQuiz(mockReq({ body: { ...validBody, questions: [] } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 404 when article not found', async () => {
        Article.findById.mockResolvedValue(null);

        const res = mockRes();
        await createQuiz(mockReq({ body: validBody }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 400 when article already has a quiz', async () => {
        Article.findById.mockResolvedValue(mockArticle); // has quizId

        const res = mockRes();
        await createQuiz(mockReq({ body: validBody }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 for question with wrong option count', async () => {
        Article.findById.mockResolvedValue({ ...mockArticle, quizId: null });

        const badQuestion = { question: 'Q?', options: ['A', 'B'], correctAnswer: 0 };
        const res = mockRes();
        await createQuiz(mockReq({ body: { ...validBody, questions: [validQuestion, badQuestion] } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// updateQuiz
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] updateQuiz', () => {
    beforeEach(() => jest.clearAllMocks());

    test('updates quiz successfully', async () => {
        Quiz.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ ...mockQuiz, title: 'Updated' }) });

        const res = mockRes();
        await updateQuiz(mockReq({ params: { id: 'QUZ-260219-001' }, body: { title: 'Updated' } }), res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated' }));
    });

    test('returns 400 when trying to change articleId', async () => {
        const res = mockRes();
        await updateQuiz(mockReq({ params: { id: 'QUZ-260219-001' }, body: { articleId: 'ART-OTHER' } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 404 when quiz not found', async () => {
        Quiz.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await updateQuiz(mockReq({ params: { id: 'NOPE' }, body: { title: 'X' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('validates questions in update body', async () => {
        const res = mockRes();
        await updateQuiz(mockReq({
            params: { id: 'QUZ-260219-001' },
            body:   { questions: [{ question: 'Q?', options: ['A'], correctAnswer: 0 }] },
        }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// deleteQuiz
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] deleteQuiz', () => {
    beforeEach(() => jest.clearAllMocks());

    test('deletes quiz and unlinks from article', async () => {
        Quiz.findByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        Article.findByIdAndUpdate.mockResolvedValue({});

        const res = mockRes();
        await deleteQuiz(mockReq({ params: { id: 'QUZ-260219-001' } }), res);

        expect(Article.findByIdAndUpdate).toHaveBeenCalledWith('ART-260219-1234', { quizId: null });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            deletedQuizId:       'QUZ-260219-001',
            unlinkedFromArticle: 'ART-260219-1234',
        }));
    });

    test('returns 404 when quiz not found', async () => {
        Quiz.findByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await deleteQuiz(mockReq({ params: { id: 'NOPE' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getQuizForUser
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getQuizForUser', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns quiz + attempt history for user', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        QuizAttempt.find.mockReturnValue(sortLean([]));

        const res = mockRes();
        await getQuizForUser(mockReq({ params: { articleId: 'ART-260219-1234', userId: 'USR-001' } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.quiz).toBeDefined();
        expect(body.hasAttempted).toBe(false);
        expect(body.attemptCount).toBe(0);
    });

    test('returns 404 when article not found', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await getQuizForUser(mockReq({ params: { articleId: 'NOPE', userId: 'USR-001' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 404 when user not found', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await getQuizForUser(mockReq({ params: { articleId: 'ART-260219-1234', userId: 'GHOST' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// submitQuizForUser
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] submitQuizForUser', () => {
    beforeEach(() => jest.clearAllMocks());

    const multiQ = {
        ...mockQuiz,
        questions: [
            { ...validQuestion, correctAnswer: 1 },
            { ...validQuestion, correctAnswer: 2 },
            { ...validQuestion, correctAnswer: 3 }, // NOTE: no correctAnswer:0 — avoids accidental match when submitting all zeros
            { ...validQuestion, correctAnswer: 3 },
            { ...validQuestion, correctAnswer: 1 },
        ],
        passingScore: 60,
    };

    test('scores correctly — all correct answers', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(multiQ) });
        QuizAttempt.create.mockResolvedValue({ _id: 'ATT-001' });

        const res = mockRes();
        await submitQuizForUser(mockReq({
            params: { articleId: 'ART-260219-1234', userId: 'USR-001' },
            body:   { answers: [1, 2, 3, 3, 1] }, // all correct
        }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.score).toBe(5);
        expect(body.percentage).toBe(100);
        expect(body.passed).toBe(true);
    });

    test('scores correctly — some wrong answers', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(multiQ) });
        QuizAttempt.create.mockResolvedValue({ _id: 'ATT-002' });

        const res = mockRes();
        await submitQuizForUser(mockReq({
            params: { articleId: 'ART-260219-1234', userId: 'USR-001' },
            body:   { answers: [1, 2, 3, 3, 0] }, // last one wrong — score 4/5
        }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.score).toBe(4);
        expect(body.percentage).toBe(80);
        expect(body.passed).toBe(true);
    });

    test('fails when below passing score', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(multiQ) });
        QuizAttempt.create.mockResolvedValue({ _id: 'ATT-003' });

        const res = mockRes();
        await submitQuizForUser(mockReq({
            params: { articleId: 'ART-260219-1234', userId: 'USR-001' },
            body:   { answers: [0, 0, 0, 0, 0] }, // all wrong
        }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.score).toBe(0);
        expect(body.passed).toBe(false);
    });

    test('returns 400 when answer count does not match question count', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(multiQ) });

        const res = mockRes();
        await submitQuizForUser(mockReq({
            params: { articleId: 'ART-260219-1234', userId: 'USR-001' },
            body:   { answers: [1, 2] }, // only 2 answers for 5 questions
        }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when answers missing', async () => {
        const res = mockRes();
        await submitQuizForUser(mockReq({
            params: { articleId: 'ART-260219-1234', userId: 'USR-001' },
            body:   {},
        }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 404 when user not found', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await submitQuizForUser(mockReq({
            params: { articleId: 'ART-260219-1234', userId: 'GHOST' },
            body:   { answers: [1] },
        }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});