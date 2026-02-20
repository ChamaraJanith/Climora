// controller/shelterController.js
const Shelter = require("../models/Shelter");
const ShelterCounter = require("../models/ShelterCounter");
const { getTravelMatrix } = require("../services/routingService");

// ---------- helpers ----------
const normalizeDistrict = (district) =>
  (district || "GEN").toUpperCase().replace(/\s+/g, "_");

const districtCodeMap = {
  KALUTARA: "KL",
  BADULLA: "BD",
  COLOMBO: "CB",
  GAMPAHA: "GP",
  GALLE: "GL",
  HAMBANTOTA: "HB",
  JAFFNA: "JF",
  KANDY: "KD",
  KURUNEGALA: "KR",
  MANNAR: "MR",
  MATALE: "MT",
  MONARAGALA: "MG",
  NUWARA_ELLIA: "NE",
  POLONNARUWA: "PN",
  PUTTALAM: "PT",
  RATNAPURA: "RP",
  TRINCOMALEE: "TC",
  VAVUNIYA: "VN",
  ANURADHAPURA: "AP",
};

const getDistrictShortCode = (districtName) => {
  const norm = normalizeDistrict(districtName);
  return districtCodeMap[norm] || norm.slice(0, 2);
};

const formatSequence = (n) => n.toString().padStart(4, "0");

const getNextShelterSequence = async (district) => {
  const norm = normalizeDistrict(district);
  const shortCode = getDistrictShortCode(district);
  const key = `${norm}-${shortCode}`;

  const counter = await ShelterCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();

  return { key, seq: counter.seq };
};

// ---------- controllers ----------

// GET /api/shelters - all shelters
exports.getAllShelters = async (req, res) => {
  try {
    const shelters = await Shelter.find().lean();

    console.log(
      `✅ [Shelters][GET_ALL] Success | count=${shelters.length}`
    );

    res.json(shelters);
  } catch (err) {
    console.error(
      `[Shelters][GET_ALL] Failed | error=${err.message}`
    );
    res.status(500).json({ error: "Failed to fetch shelters" });
  }
};

// GET /api/shelters/:id
exports.getShelterById = async (req, res) => {
  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id }).lean();
    if (!shelter) {
      console.log(
        `[Shelters][GET_ONE] Shelter not found | shelterId=${req.params.id}`
      );
      return res.status(404).json({ error: "❌ Shelter not found" });
    }

    console.log(
      `✅ [Shelters][GET_ONE] Success | shelterId=${shelter.shelterId}`
    );

    res.json(shelter);
  } catch (err) {
    console.error(
      `[Shelters][GET_ONE] Failed | shelterId=${req.params.id} | error=${err.message}`
    );
    res.status(400).json({ error: "Invalid shelter ID" });
  }
};

// POST /api/shelters
exports.createShelter = async (req, res) => {
  try {
    const { district } = req.body;

    if (!district) {
      console.log(
        `[Shelters][CREATE] Bad Request - district missing`
      );
      return res
        .status(400)
        .json({ error: "District is required to generate shelterId" });
    }

    const { key, seq } = await getNextShelterSequence(district);
    const shelterId = `${key}${formatSequence(seq)}`;

    const shelter = await Shelter.create({
      ...req.body,
      shelterId,
    });

    console.log(
      `✅ [Shelters][CREATE] Success | shelterId=${shelter.shelterId} | district=${district}`
    );

    res.status(201).json(shelter);
  } catch (err) {
    console.error(
      `[Shelters][CREATE] Failed | error=${err.message}`
    );
    res
      .status(400)
      .json({ error: "Failed to create shelter", details: err.message });
  }
};

// PUT /api/shelters/:id
exports.updateShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findOneAndUpdate(
      { shelterId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!shelter) {
      console.log(
        `[Shelters][UPDATE] Shelter not found | shelterId=${req.params.id}`
      );
      return res.status(404).json({ error: "Shelter not found" });
    }

    console.log(
      `✅ [Shelters][UPDATE] Success | shelterId=${shelter.shelterId}`
    );

    res.json(shelter);
  } catch (err) {
    console.error(
      `[Shelters][UPDATE] Failed | shelterId=${req.params.id} | error=${err.message}`
    );
    res
      .status(400)
      .json({ error: "Failed to update shelter", details: err.message });
  }
};

// DELETE /api/shelters/:id
exports.deleteShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findOneAndDelete({
      shelterId: req.params.id,
    }).lean();

    if (!shelter) {
      console.log(
        `[Shelters][DELETE] Shelter not found | shelterId=${req.params.id}`
      );
      return res.status(404).json({ error: "❌Shelter not found" });
    }

    console.log(
      `✅ [Shelters][DELETE] Success | shelterId=${shelter.shelterId}`
    );

    res.json({ message: "Shelter deleted successfully" });
  } catch (err) {
    console.error(
      `[Shelters][DELETE] Failed | shelterId=${req.params.id} | error=${err.message}`
    );
    res
      .status(400)
      .json({ error: "Failed to delete shelter", details: err.message });
  }
};

// GET /api/shelters/counts/by-district
exports.getShelterCountsByDistrict = async (req, res) => {
  try {
    const counts = await Shelter.aggregate([
      { $group: { _id: "$district", shelterCount: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const formatted = counts.map((d) => ({
      district: d._id,
      shelterCount: d.shelterCount,
    }));

    console.log(
      `✅ [Shelters][COUNTS] Success | districts=${formatted.length}`
    );

    res.json(formatted);
  } catch (err) {
    console.error(
      `[Shelters][COUNTS] Failed | error=${err.message}`
    );
    res.status(500).json({ error: "Failed to fetch shelter counts" });
  }
};

// GET /api/shelters/nearby?lat=...&lng=...&limit=5
exports.getNearbyShelters = async (req, res) => {
  try {
    const { lat, lng, limit = 5 } = req.query;

    if (!lat || !lng) {
      console.log(
        `[Shelters][NEARBY] Bad Request - lat/lng missing`
      );
      return res
        .status(400)
        .json({ error: "lat and lng query params are required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxResults = parseInt(limit, 10) || 5;

    if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
      console.log(
        `[Shelters][NEARBY] Invalid lat/lng | lat=${lat} | lng=${lng}`
      );
      return res.status(400).json({ error: "Invalid lat or lng" });
    }

    const shelters = await Shelter.find({ isActive: true }).lean();

    if (shelters.length === 0) {
      console.log(
        `[Shelters][NEARBY] No active shelters`
      );
      return res.json([]);
    }

    const shelterPoints = shelters.map((s) => ({
      lat: s.lat,
      lng: s.lng,
    }));

    const matrix = await getTravelMatrix(
      { lat: userLat, lng: userLng },
      shelterPoints
    );

    const merged = shelters.map((shelter, idx) => {
      const { distanceKm, durationMin } = matrix[idx] || {};
      return {
        shelterId: shelter.shelterId,
        name: shelter.name,
        district: shelter.district,
        lat: shelter.lat,
        lng: shelter.lng,
        capacityTotal: shelter.capacityTotal,
        capacityCurrent: shelter.capacityCurrent,
        distanceKm: distanceKm ?? null,
        travelTimeMin:
          durationMin != null ? Number(durationMin.toFixed(1)) : null,
      };
    });

    merged.sort((a, b) => {
      if (a.travelTimeMin == null) return 1;
      if (b.travelTimeMin == null) return -1;
      return a.travelTimeMin - b.travelTimeMin;
    });

    console.log(
      `✅ [Shelters][NEARBY] Success | lat=${userLat} | lng=${userLng} | returned=${Math.min(
        merged.length,
        maxResults
      )}`
    );

    res.json(merged.slice(0, maxResults));
  } catch (err) {
    console.error(
      `[Shelters][NEARBY] Failed | error=${err.message}`
    );
    res.status(500).json({
      error: "Failed to fetch nearby shelters",
      details: err.message,
    });
  }
};

// PATCH /api/shelters/:id/status
exports.updateShelterStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["planned", "standby", "open", "closed"];
    if (!allowedStatuses.includes(status)) {
      console.log(
        `[Shelters][STATUS] Invalid status | shelterId=${req.params.id} | status=${status}`
      );
      return res.status(400).json({
        error: "Invalid status value",
        allowed: allowedStatuses,
      });
    }

    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      console.log(
        `[Shelters][STATUS] Shelter not found | shelterId=${req.params.id}`
      );
      return res.status(404).json({ error: "❌ Shelter not found" });
    }

    const prevStatus = shelter.status;
    shelter.status = status;

    const now = new Date();

    if (prevStatus !== "open" && status === "open") {
      if (!shelter.openSince) {
        shelter.openSince = now;
      }
      shelter.closedAt = undefined;
    } else if (prevStatus === "open" && status === "closed") {
      shelter.closedAt = now;
    }

    await shelter.save();

    console.log(
      `✅ [Shelters][STATUS] Success | shelterId=${shelter.shelterId} | from=${prevStatus} | to=${status}`
    );

    res.json({
      shelterId: shelter.shelterId,
      status: shelter.status,
      openSince: shelter.openSince,
      closedAt: shelter.closedAt,
    });
  } catch (err) {
    console.error(
      `[Shelters][STATUS] Failed | shelterId=${req.params.id} | error=${err.message}`
    );
    res.status(400).json({
      error: "Failed to update shelter status",
      details: err.message,
    });
  }
};
