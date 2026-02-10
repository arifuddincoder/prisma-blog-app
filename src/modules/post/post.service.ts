import { CommentStatus, Post, Prisma } from "../../../generated/prisma/client";
import { buildCommentTree } from "../../helpers/comments/buildCommentTree";
import { buildPaginationMeta } from "../../helpers/paginationAndSortingHelper";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../middleware/authenticate";

const createPost = async (data: Omit<Post, "id" | "createdAt" | "updatedAt" | "authorId">, userId: string) => {
	const result = await prisma.post.create({
		data: {
			...data,
			authorId: userId,
		},
	});

	return result;
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
			include: {
				_count: {
					select: {
						comments: true,
					},
				},
			},
		}),
	]);

	return {
		meta: buildPaginationMeta(payload.page, payload.limit, total),
		data,
	};
};

const getPostById = async (postId: string) => {
	return await prisma.$transaction(async (tx) => {
		await tx.post.update({
			where: { id: postId },
			data: { views: { increment: 1 } },
		});

		const postData = await tx.post.findUnique({
			where: { id: postId },
		});
		const comments = await tx.comment.findMany({
			where: { postId, status: CommentStatus.APPROVED },
			orderBy: { createdAt: "desc" },
		});
		const commentsCount = await tx.comment.count({
			where: { postId, status: CommentStatus.APPROVED },
		});
		return {
			...postData,
			commentsCount,
			comments: buildCommentTree(comments), // ✅ post এর ভিতরে tree
		};
	});
};

type GetMyPostsQuery = {
	search?: string;
	tags?: string[];
	featured?: boolean;
	page: number;
	limit: number;
	sortBy: "createdAt" | "views" | "title";
	sortOrder: "asc" | "desc";
};

const getMyPosts = async (userId: string, query: GetMyPostsQuery) => {
	const page = query.page > 0 ? query.page : 1;
	const limit = query.limit > 0 ? query.limit : 10;
	const skip = (page - 1) * limit;

	const and: Prisma.PostWhereInput[] = [{ authorId: userId }];

	if (query.search) {
		and.push({
			OR: [
				{ title: { contains: query.search, mode: "insensitive" } },
				{ content: { contains: query.search, mode: "insensitive" } },
			],
		});
	}

	if (query.tags?.length) {
		and.push({ tags: { hasSome: query.tags } });
	}

	if (typeof query.featured === "boolean") {
		and.push({ isFeatured: query.featured });
	}

	const where: Prisma.PostWhereInput = { AND: and };

	const orderBy: Prisma.PostOrderByWithRelationInput =
		query.sortBy === "title"
			? { title: query.sortOrder }
			: query.sortBy === "views"
				? { views: query.sortOrder }
				: { createdAt: query.sortOrder };

	const [total, posts] = await prisma.$transaction([
		prisma.post.count({ where }),
		prisma.post.findMany({
			where,
			orderBy,
			skip,
			take: limit,
			select: {
				id: true,
				title: true,
				content: true,
				tags: true,
				isFeatured: true,
				views: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
	]);

	// ✅ commentsCount per post (simple + safe)
	const postIds = posts.map((p) => p.id);

	const counts = await prisma.comment.groupBy({
		by: ["postId"],
		where: { postId: { in: postIds } },
		_count: { _all: true },
	});

	const countMap = new Map(counts.map((c) => [c.postId, c._count._all]));

	const data = posts.map((p) => ({
		...p,
		commentsCount: countMap.get(p.id) ?? 0,
	}));

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data,
	};
};

type UpdatePostPayload = {
	title?: string;
	content?: string;
	tags?: string[];
	isFeatured?: boolean;
};

const updatePost = async (postId: string, userId: string, userRole: UserRole, payload: UpdatePostPayload) => {
	const post = await prisma.post.findUniqueOrThrow({
		where: { id: postId },
	});

	// USER হলে শুধু নিজের পোস্ট
	if (userRole === UserRole.USER && post.authorId !== userId) {
		throw new Error("Forbidden");
	}

	const data: Prisma.PostUpdateInput = {};

	if (payload.title !== undefined) data.title = payload.title;
	if (payload.content !== undefined) data.content = payload.content;
	if (payload.tags !== undefined) data.tags = payload.tags;
	if (payload.isFeatured !== undefined) data.isFeatured = payload.isFeatured;

	return prisma.post.update({
		where: { id: postId },
		data,
	});
};

const deletePost = async (postId: string, userId: string, userRole: UserRole) => {
	// post আছে কিনা
	const post = await prisma.post.findUniqueOrThrow({
		where: { id: postId },
	});

	// USER হলে শুধু নিজের post
	if (userRole === UserRole.USER && post.authorId !== userId) {
		throw new Error("Forbidden");
	}

	// ✅ Delete post (এখানে cascade না থাকলে আগে comments delete করতে হতে পারে)
	await prisma.post.delete({
		where: { id: postId },
	});

	return { message: "Post deleted successfully" };
};

export const postService = {
	createPost,
	getAllPosts,
	getPostById,
	getMyPosts,
	updatePost,
	deletePost,
};
