const normalizeDistrict = (district = "") => {
  return district
    .toLowerCase()
    .replace(" district", "")
    .trim();
};

module.exports = normalizeDistrict;
