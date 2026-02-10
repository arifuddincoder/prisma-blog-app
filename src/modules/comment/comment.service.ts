import { CommentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../middleware/authenticate";

type CreateCommentPayload = {
	content: string;
	postId: string;
	authorId: string;
	parentId?: string; // reply হলে
};

const createComment = async (payload: CreateCommentPayload) => {
	// post must exist
	await prisma.post.findUniqueOrThrow({
		where: { id: payload.postId },
	});

	// reply হলে parent comment must exist
	if (payload.parentId) {
		await prisma.comment.findUniqueOrThrow({
			where: { id: payload.parentId },
		});
	}

	return prisma.comment.create({
		data: payload,
	});
};

const getCommentById = async (commentId: string) => {
	return prisma.comment.findUniqueOrThrow({
		where: {
			id: commentId,
		},
		include: {
			post: {
				select: {
					id: true,
					title: true,
				},
			},
		},
	});
};

const getCommentsByAuthor = async (authorId: string) => {
	return prisma.comment.findMany({
		where: {
			authorId,
		},
		orderBy: {
			createdAt: "desc",
		},
		include: {
			post: {
				select: {
					id: true,
					title: true,
				},
			},
			parent: {
				select: {
					id: true,
					content: true,
				},
			},
		},
	});
};
type UpdateCommentPayload = {
	content: string;
};
const updateComment = async (commentId: string, userId: string, userRole: UserRole, payload: UpdateCommentPayload) => {
	// 🔹 comment আছে কিনা
	const comment = await prisma.comment.findUniqueOrThrow({
		where: { id: commentId },
		select: { id: true, authorId: true },
	});

	// 🔹 USER হলে শুধু নিজের comment
	if (userRole === UserRole.USER && comment.authorId !== userId) {
		throw new Error("Forbidden");
	}

	// 🔹 update
	const result = await prisma.comment.update({
		where: { id: commentId },
		data: {
			content: payload.content,
		},
	});

	return result;
};

const deleteComment = async (commentId: string, userId: string, userRole: UserRole) => {
	// 🔹 comment আছে কিনা
	const comment = await prisma.comment.findUniqueOrThrow({
		where: { id: commentId },
	});

	// 🔹 USER হলে শুধু নিজের comment
	if (userRole === UserRole.USER && comment.authorId !== userId) {
		throw new Error("Forbidden");
	}

	// 🔥 recursive delete (helper)
	await prisma.comment.delete({
		where: { id: commentId },
	});

	return { message: "Comment deleted successfully" };
};

export const commentService = {
	createComment,
	getCommentById,
	getCommentsByAuthor,
	deleteComment,
	updateComment,
};
