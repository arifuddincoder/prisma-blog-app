import { Post, Prisma } from "../../../generated/prisma/client";
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

const getAllPosts = async (payload: { search?: string; tags?: string[]; featured?: boolean }) => {
	const s = payload.search?.trim();
	const tags = payload.tags?.filter(Boolean);
	const featured = payload.featured;

	// 🔹 কোনো filter নাই → সব পোস্ট
	if (!s && (!tags || !tags.length) && featured === undefined) {
		return prisma.post.findMany();
	}

	return prisma.post.findMany({
		where: {
			...(s
				? {
						OR: [{ title: { contains: s, mode: "insensitive" } }, { content: { contains: s, mode: "insensitive" } }],
					}
				: {}),

			...(tags && tags.length
				? {
						tags: {
							hasEvery: tags,
						},
					}
				: {}),

			...(featured !== undefined
				? {
						isFeatured: featured, // ✅ boolean filter
					}
				: {}),
		},
	});
};

export const postService = {
	createPost,
	getAllPosts,
};
