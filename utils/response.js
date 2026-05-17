/**
 * Send a consistent JSON success response.
 */
const sendResponse = (res, statusCode, message, data = null, meta = null) => {
  const payload = { success: true, message };
  if (data !== null)  payload.data = data;
  if (meta !== null)  payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/**
 * Build a pagination meta object and skip value.
 * @returns {{ skip, limit, meta }}
 */
const getPagination = (query, defaultLimit = 10) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || defaultLimit);
  const skip  = (page - 1) * limit;
  return { page, skip, limit };
};

/**
 * Build a pagination meta object after we know total count.
 */
const buildMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = { sendResponse, getPagination, buildMeta };
