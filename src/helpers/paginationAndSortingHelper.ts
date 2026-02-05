import { Request } from "express";

// 🔹 query থেকে page, limit, sort বের করবে
export const paginationAndSortingHelper = (req: Request) => {
	const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
	const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1), 50);

	const skip = (page - 1) * limit;

	const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
	const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

	return { page, limit, skip, take: limit, sortBy, sortOrder };
};

// 🔹 response এর meta বানাবে
export const buildPaginationMeta = (page: number, limit: number, total: number) => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit),
});
