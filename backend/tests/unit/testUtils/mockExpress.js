// tests/unit/testUtils/mockExpress.js

exports.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * mockRequest(body, params, query, overrides)
 * overrides can include: { user, headers, originalUrl, method, files, file }
 */
exports.mockRequest = (body = {}, params = {}, query = {}, overrides = {}) => {
  return {
    body,
    params,
    query,
    headers: overrides.headers || {},
    user: overrides.user,
    method: overrides.method || "GET",
    originalUrl: overrides.originalUrl || "/test",

    // ✅ IMPORTANT for multer-style uploads (fix reportController test)
    files: overrides.files,
    file: overrides.file,
  };
};