// tests/unit/testUtils/mockExpress.js
function mockRequest(body = {}, params = {}, query = {}, extra = {}) {
  return {
    body,
    params,
    query,
    user: extra.user || undefined,
    files: extra.files || undefined,
    method: extra.method || "GET",
    originalUrl: extra.originalUrl || "/test",
  };
}

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

module.exports = { mockRequest, mockResponse };