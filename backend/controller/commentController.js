const ReportComment = require("../models/ReportComment");

exports.addComment = async (req, res) => {
  try {
    const comment = await ReportComment.create({
      reportId: req.params.id,
      userId: req.user._id,
      text: req.body.text,
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await ReportComment.find({ reportId: req.params.id }).sort({
      createdAt: -1,
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
