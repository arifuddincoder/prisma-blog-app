import { Post, Prisma } from "../../../generated/prisma/client";
import { buildPaginationMeta } from "../../helpers/paginationAndSortingHelper";
import { prisma } from "../../lib/prisma";

const createPost = async (data: Omit<Post, "id" | "createdAt" | "updatedAt" | "authorId">, userId: string) => {
	const result = await prisma.post.create({
		data: {
			...data,
			authorId: userId,
		},
	});

	return result;
};

type GetAllPostsPayload = {
	search?: string;
	tags?: string[];
	featured?: boolean;

	// ✅ pagination
	page?: number; // default 1
	limit?: number; // default 10
};

const getAllPosts = async (payload: {
	search?: string;
	tags?: string[];
	featured?: boolean;

	// ✅ from helper
	page: number;
	limit: number;
	skip: number;
	take: number;
	sortBy: string;
	sortOrder: "asc" | "desc";
}) => {
	const s = payload.search?.trim();
	const tags = payload.tags?.filter(Boolean);
	const featured = payload.featured;

	const where: any = {
		...(s
			? {
					OR: [{ title: { contains: s, mode: "insensitive" } }, { content: { contains: s, mode: "insensitive" } }],
				}
			: {}),
		...(tags && tags.length
			? {
					tags: { hasEvery: tags },
				}
			: {}),
		...(featured !== undefined ? { isFeatured: featured } : {}),
	};

	// ✅ safe sort fields (super simple)
	const allowedSort = ["createdAt", "updatedAt", "views", "title"];
	const sortBy = allowedSort.includes(payload.sortBy) ? payload.sortBy : "createdAt";

	const [total, data] = await prisma.$transaction([
		prisma.post.count({ where }),
		prisma.post.findMany({
			where,
			orderBy: { [sortBy]: payload.sortOrder },
			skip: payload.skip,
			take: payload.take,
		}),
	]);

	return {
		meta: buildPaginationMeta(payload.page, payload.limit, total),
		data,
	};
};

export const postService = {
	createPost,
	getAllPosts,
};
