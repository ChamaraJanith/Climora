const Quiz = require("../models/Quiz");

// Get all quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate("articleId", "title").lean();
    res.json(quizzes);
  } catch (err) {
    console.error("Error fetching quizzes:", err.message);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};

// Get quiz by article
exports.getQuizByArticleId = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ articleId: req.params.articleId }).lean();
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found for this article" });
    }
    res.json(quiz);
  } catch (err) {
    console.error("Error fetching quiz:", err.message);
    res.status(400).json({ error: "Invalid article ID" });
  }
};

// Create new quiz
exports.createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json(quiz);
  } catch (err) {
    console.error("Error creating quiz:", err.message);
    res.status(400).json({ error: "Failed to create quiz", details: err.message });
  }
};

// Update quiz
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.json(quiz);
  } catch (err) {
    console.error("Error updating quiz:", err.message);
    res.status(400).json({ error: "Failed to update quiz", details: err.message });
  }
};

// Delete quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id).lean();
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Error deleting quiz:", err.message);
    res.status(400).json({ error: "Failed to delete quiz", details: err.message });
  }
};

// Submit quiz answers
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // answers: [0, 2, 1, 3]
    
    const quiz = await Quiz.findById(req.params.id).lean();
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    let score = 0;
    const results = quiz.questions.map((q, index) => {
      const isCorrect = q.correctAnswer === answers[index];
      if (isCorrect) score++;
      return {
        question: q.question,
        userAnswer: answers[index],
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    res.json({
      score,
      total: quiz.questions.length,
      percentage: ((score / quiz.questions.length) * 100).toFixed(2),
      results,
    });
  } catch (err) {
    console.error("Error submitting quiz:", err.message);
    res.status(400).json({ error: "Failed to submit quiz", details: err.message });
  }
};