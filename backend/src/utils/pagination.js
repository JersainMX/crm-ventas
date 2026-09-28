export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const buildPaginatedResponse = (rows, count, page, limit) => ({
  data: rows,
  meta: {
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit),
    hasNext: page * limit < count,
    hasPrev: page > 1,
  },
});