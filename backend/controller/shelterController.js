const Shelter = require("../models/Shelter");
const ShelterCounter = require("../models/ShelterCounter");
const { getTravelMatrix } = require("../services/routingService");

// ---------- helpers ----------

// "Kalutara" -> "KALUTARA", "Nuwara Elliya" -> "NUWARA_ELLIYA"
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
};

const getDistrictShortCode = (districtName) => {
  const norm = normalizeDistrict(districtName);
  return districtCodeMap[norm] || norm.slice(0, 2);
};

const formatSequence = (n) => n.toString().padStart(4, "0");

// per-district counter increment
const getNextShelterSequence = async (district) => {
  const norm = normalizeDistrict(district);
  const shortCode = getDistrictShortCode(district);
  const key = `${norm}-${shortCode}`; // e.g. KALUTARA-KL

  const counter = await ShelterCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();

  return { key, seq: counter.seq }; // e.g. { key: 'KALUTARA-KL', seq: 1 }
};

// ---------- controllers ----------

// GET /api/shelters - Get all shelters
exports.getAllShelters = async (req, res) => {
  try {
    const shelters = await Shelter.find().lean();
    console.log("✅ Fetched shelters count:", shelters.length);
    res.json(shelters);
  } catch (err) {
    console.error("Error fetching shelters:", err.message);
    res.status(500).json({ error: "Failed to fetch shelters" });
  }
};

// GET /api/shelters/:id - Select One Shelter (id = shelterId)
exports.getShelterById = async (req, res) => {
  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id }).lean();
    if (!shelter) {
      return res.status(404).json({ error: "❌ Shelter not found" });
    }
    console.log("✅ Fetched shelter:", shelter._id);
    res.json(shelter);
  } catch (err) {
    console.error("❌ Error fetching shelter:", err.message);
    res.status(400).json({ error: "Invalid shelter ID" });
  }
};

// POST /api/shelters - Create a new shelter (auto shelterId)
exports.createShelter = async (req, res) => {
  try {
    const { district } = req.body;

    if (!district) {
      return res
        .status(400)
        .json({ error: "District is required to generate shelterId" });
    }

    const { key, seq } = await getNextShelterSequence(district);
    // Final ID format: KALUTARA-KL0001
    const shelterId = `${key}${formatSequence(seq)}`;

    const shelter = await Shelter.create({
      ...req.body,
      shelterId,
    });

    console.log("✅ Shelter created:", shelter.shelterId);
    res.status(201).json(shelter);
  } catch (err) {
    console.error("❌Error creating shelter:", err.message);
    res
      .status(400)
      .json({ error: "Failed to create shelter", details: err.message });
  }
};

// PUT /api/shelters/:id - Update a shelter (id = shelterId)
exports.updateShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findOneAndUpdate(
      { shelterId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }
    console.log("✅ Shelter updated:", shelter.shelterId);
    res.json(shelter);
  } catch (err) {
    console.error("❌Error updating shelter:", err.message);
    res
      .status(400)
      .json({ error: "Failed to update shelter", details: err.message });
  }
};

// DELETE /api/shelters/:id - Delete a shelter (id = shelterId)
exports.deleteShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findOneAndDelete({
      shelterId: req.params.id,
    }).lean();

    if (!shelter) {
      return res.status(404).json({ error: "❌Shelter not found" });
    }
    console.log("✅ Shelter deleted:", shelter.shelterId);
    res.json({ message: "Shelter deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting shelter:", err.message);
    res
      .status(400)
      .json({ error: "Failed to delete shelter", details: err.message });
  }
};


// GET /api/shelters/counts/by-district - Get all unique districts

exports.getShelterCountsByDistrict = async (req, res) => {
  try {
    const counts = await Shelter.aggregate([
      {
        $group: {
          _id: "$district",
          shelterCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const formatted = counts.map((d) => ({
      district: d._id,
      shelterCount: d.shelterCount,
    }));
    
    console.log("✅ Fetched shelter counts by district:", formatted);
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching shelter counts by district:", err.message);
    res.status(500).json({ error: "Failed to fetch shelter counts" });
  }
};


// GET /api/shelters/nearby?lat=...&lng=...&limit=5
exports.getNearbyShelters = async (req, res) => {
  try {
    const { lat, lng, limit = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng query params are required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxResults = parseInt(limit, 10) || 5;

    if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
      return res.status(400).json({ error: "Invalid lat or lng" });
    }

    // 1) get active shelters with coordinates
    const shelters = await Shelter.find({ isActive: true }).lean();

    if (shelters.length === 0) {
      return res.json([]);
    }

    const shelterPoints = shelters.map((s) => ({
      lat: s.lat,
      lng: s.lng,
    }));

    // 2) call ORS matrix API
    const matrix = await getTravelMatrix(
      { lat: userLat, lng: userLng },
      shelterPoints
    );

    // 3) merge distances with shelters + sort
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
        travelTimeMin: durationMin != null ? Number(durationMin.toFixed(1)) : null,
      };
    });

    merged.sort((a, b) => {
      if (a.travelTimeMin == null) return 1;
      if (b.travelTimeMin == null) return -1;
      return a.travelTimeMin - b.travelTimeMin;
    });

    res.json(merged.slice(0, maxResults));
  } catch (err) {
    console.error("❌ Error fetching nearby shelters:", err.message);
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
      return res.status(400).json({
        error: "Invalid status value",
        allowed: allowedStatuses,
      });
    }

    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
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

      console.log(
        `🚨 Shelter OPENED: ${shelter.shelterId} (${shelter.name}) at ${now.toISOString()}`
      );
    } else if (prevStatus === "open" && status === "closed") {
      shelter.closedAt = now;

      console.log(
        `✅ Shelter CLOSED: ${shelter.shelterId} (${shelter.name}) at ${now.toISOString()}`
      );
    } else {
      console.log(
        `ℹ️ Shelter STATUS CHANGED: ${shelter.shelterId} (${shelter.name}) ${prevStatus} -> ${status}`
      );
    }

    await shelter.save();

    res.json({
      shelterId: shelter.shelterId,
      status: shelter.status,
      openSince: shelter.openSince,
      closedAt: shelter.closedAt,
    });
  } catch (err) {
    console.error("❌ Error updating shelter status:", err.message);
    res.status(400).json({
      error: "Failed to update shelter status",
      details: err.message,
    });
  }
};
