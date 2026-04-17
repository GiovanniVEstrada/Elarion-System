/**
 * Parses page/limit from query params and returns mongoose pagination options
 * plus a buildResponse helper that wraps results with metadata.
 *
 * Usage:
 *   const { skip, limit, buildResponse } = paginate(req.query);
 *   const data = await Model.find(filter).sort(sort).skip(skip).limit(limit);
 *   const total = await Model.countDocuments(filter);
 *   res.json(buildResponse(data, total));
 */
const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;

  const buildResponse = (data, total) => ({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });

  return { page, limit, skip, buildResponse };
};

module.exports = paginate;
