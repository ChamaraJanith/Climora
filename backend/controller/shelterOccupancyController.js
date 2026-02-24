const Shelter = require("../models/Shelter");
const ShelterOccupancy = require("../models/ShelterOccupancy");

/**
 * Helper: calculate isOverCapacity flag + warnings
 */
function applyOccupancySafetyFlags(doc) {
  if (!doc.capacityTotal || doc.capacityTotal <= 0) {
    doc.isOverCapacity = false;
    return doc;
  }

  const occupancyPercent =
    (doc.currentOccupancy / doc.capacityTotal) * 100;

  const threshold = doc.safeThresholdPercent || 90;

  const isNowOver = occupancyPercent >= threshold;
  doc.isOverCapacity = isNowOver;

  // 80%+ warning
  if (occupancyPercent >= 80 && occupancyPercent < 100) {
    console.warn(
      `⚠️  capacityWarning | shelterId=${doc.shelterId} | ` +
        `occupancy=${doc.currentOccupancy}/${doc.capacityTotal} ` +
        `(${occupancyPercent.toFixed(1)}%)`
    );
  }

  // 100%+ critical
  if (occupancyPercent >= 100) {
    console.error(
      `🚨 capacityCritical | shelterId=${doc.shelterId} | ` +
        `occupancy=${doc.currentOccupancy}/${doc.capacityTotal} ` +
        `(${occupancyPercent.toFixed(1)}%)`
    );
  }

  return doc;
}

/**
 * POST /api/shelters/:id/occupancy
 * Create new occupancy snapshot for shelter
 */
exports.createShelterOccupancy = async (req, res) => {
  try {
    const { id } = req.params;

    const shelter = await Shelter.findOne({ shelterId: id }).lean();
    if (!shelter) {
      console.error(
        `❌ createShelterOccupancy | status=error | message=Shelter not found | shelterId=${id}`
      );
      return res.status(404).json({ error: "Shelter not found" });
    }

    const {
      capacityTotal,
      currentOccupancy,
      safeThresholdPercent,
      childrenCount,
      elderlyCount,
      specialNeedsCount,
      recordedBy,
    } = req.body;

    let occupancy = new ShelterOccupancy({
      shelterId: id,
      capacityTotal,
      currentOccupancy,
      safeThresholdPercent,
      childrenCount,
      elderlyCount,
      specialNeedsCount,
      recordedBy,
    });

    occupancy = applyOccupancySafetyFlags(occupancy);

    await occupancy.save();

    console.log(
      `✅ createShelterOccupancy | status=success | shelterId=${id} | ` +
        `currentOccupancy=${occupancy.currentOccupancy} | ` +
        `isOverCapacity=${occupancy.isOverCapacity}`
    );

    res.status(201).json({
      message: "Shelter occupancy snapshot created",
      occupancy,
    });
  } catch (err) {
    console.error(
      `❌ createShelterOccupancy | status=error | message=${err.message}`
    );
    res.status(400).json({
      error: "Failed to create shelter occupancy",
      details: err.message,
    });
  }
};

/**
 * GET /api/shelters/:id/occupancy
 * Get latest occupancy snapshot for shelter
 */
exports.getLatestShelterOccupancy = async (req, res) => {
  try {
    const { id } = req.params;

    const occupancy = await ShelterOccupancy.findOne({ shelterId: id })
      .sort({ recordedAt: -1, createdAt: -1 })
      .lean();

    if (!occupancy) {
      console.error(
        `❌ getLatestShelterOccupancy | status=error | message=No occupancy data | shelterId=${id}`
      );
      return res.status(404).json({
        error: "No occupancy data for this shelter",
      });
    }

    console.log(
      `✅ getLatestShelterOccupancy | status=success | shelterId=${id} | ` +
        `currentOccupancy=${occupancy.currentOccupancy} | ` +
        `isOverCapacity=${occupancy.isOverCapacity}`
    );

    res.json(occupancy);
  } catch (err) {
    console.error(
      `❌ getLatestShelterOccupancy | status=error | message=${err.message} | shelterId=${req.params.id}`
    );
    res.status(400).json({
      error: "Failed to fetch latest shelter occupancy",
      details: err.message,
    });
  }
};

/**
 * GET /api/shelters/:id/occupancy/history
 * Optional: history with date filters
 * query: from, to (ISO date strings)
 */
exports.getShelterOccupancyHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const filter = { shelterId: id };

    if (from || to) {
      filter.recordedAt = {};
      if (from) {
        filter.recordedAt.$gte = new Date(from);
      }
      if (to) {
        filter.recordedAt.$lte = new Date(to);
      }
    }

    const history = await ShelterOccupancy.find(filter)
      .sort({ recordedAt: -1 })
      .lean();

    console.log(
      `✅ getShelterOccupancyHistory | status=success | shelterId=${id} | count=${history.length}`
    );

    res.json(history);
  } catch (err) {
    console.error(
      `❌ getShelterOccupancyHistory | status=error | message=${err.message} | shelterId=${req.params.id}`
    );
    res.status(400).json({
      error: "Failed to fetch shelter occupancy history",
      details: err.message,
    });
  }
};

/**
 * PATCH /api/shelters/:id/occupancy/current
 * Body: { currentOccupancy: Number }
 */
exports.updateCurrentOccupancy = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentOccupancy } = req.body;

    if (currentOccupancy === undefined) {
      return res.status(400).json({
        error: "currentOccupancy is required",
      });
    }

    const shelter = await Shelter.findOne({ shelterId: id }).lean();
    if (!shelter) {
      console.error(
        `❌ updateCurrentOccupancy | status=error | message=Shelter not found | shelterId=${id}`
      );
      return res.status(404).json({ error: "Shelter not found" });
    }

    // Last snapshot (or create new from shelter baseline)
    let last = await ShelterOccupancy.findOne({ shelterId: id }).sort({
      recordedAt: -1,
      createdAt: -1,
    });

    if (!last) {
      last = new ShelterOccupancy({
        shelterId: id,
        capacityTotal: shelter.capacityTotal || 0,
        safeThresholdPercent: 90,
        childrenCount: 0,
        elderlyCount: 0,
        specialNeedsCount: 0,
        recordedBy: "system",
      });
    }

    last.currentOccupancy = currentOccupancy;
    last.capacityTotal = last.capacityTotal || shelter.capacityTotal || 0;

    applyOccupancySafetyFlags(last);

    last.recordedAt = new Date();
    await last.save();

    console.log(
      `✅ updateCurrentOccupancy | status=success | shelterId=${id} | ` +
        `occupancy=${last.currentOccupancy}/${last.capacityTotal} ` +
        `(${(
          (last.currentOccupancy / (last.capacityTotal || 1)) *
          100
        ).toFixed(1)}%)`
    );

    res.json({
      message: "Current occupancy updated successfully",
      shelterId: last.shelterId,
      currentOccupancy: last.currentOccupancy,
      capacityTotal: last.capacityTotal,
      occupancyPercent:
        last.capacityTotal > 0
          ? Number(
              (
                (last.currentOccupancy / last.capacityTotal) *
                100
              ).toFixed(1)
            )
          : 0,
      isOverCapacity: last.isOverCapacity,
    });
  } catch (err) {
    console.error(
      `❌ updateCurrentOccupancy | status=error | message=${err.message} | shelterId=${req.params.id}`
    );
    res.status(400).json({
      error: "Failed to update current occupancy",
      details: err.message,
    });
  }
};
