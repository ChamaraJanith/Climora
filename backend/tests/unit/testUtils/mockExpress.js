function mockRequest(body = {}, params = {}, query = {}) {
  return { body, params, query };
}

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

module.exports = { mockRequest, mockResponse };
