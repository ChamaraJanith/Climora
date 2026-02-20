// utils/getNextSequence.js
const Counter = require("../models/Counter");

async function getNextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  if (!doc) throw new Error(`Counter doc is null for name: ${name}`);
  return doc.seq;
}

module.exports = getNextSequence;