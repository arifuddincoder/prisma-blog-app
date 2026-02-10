import { Request, Response } from "express";
import { commentService } from "./comment.service";
import { UserRole } from "../../middleware/authenticate";

const createComment = async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const { content, postId, parentId } = req.body;

		if (!content || !postId) {
			return res.status(400).json({
				error: "content and postId are required",
			});
		}

		const result = await commentService.createComment({
			content,
			postId,
			authorId: user.id,
			parentId,
		});

		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({
			error: "Comment creation failed",
			details: error,
		});
	}
};

const getCommentById = async (req: Request, res: Response) => {
	try {
		const { commentId } = req.params;

		const result = await commentService.getCommentById(commentId as string);

		res.status(200).json(result);
	} catch (error) {
		res.status(404).json({
			error: "Comment not found",
			details: error,
		});
	}
};

const getCommentsByAuthor = async (req: Request, res: Response) => {
	try {
		const { authorId } = req.params;

		if (!authorId) {
			return res.status(400).json({
				error: "authorId is required",
			});
		}

		const result = await commentService.getCommentsByAuthor(authorId as string);

		res.status(200).json(result);
	} catch (error) {
		res.status(400).json({
			error: "Failed to fetch comments",
			details: error,
		});
	}
};

const updateComment = async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const { commentId } = req.params;
		const { content } = req.body;

		if (!content || typeof content !== "string" || !content.trim()) {
			return res.status(400).json({
				error: "content is required",
			});
		}

		const result = await commentService.updateComment(commentId as string, user.id as string, user.role as UserRole, {
			content: content.trim(),
		});

		res.status(200).json(result);
	} catch (error: any) {
		if (error.message === "Forbidden") {
			return res.status(403).json({
				error: "You are not allowed to update this comment",
			});
		}

		res.status(400).json({
			error: "Failed to update comment",
			details: error,
		});
	}
};
const deleteComment = async (req: Request, res: Response) => {
	try {
		const user = req.user;
		const { commentId } = req.params;

		if (!user) {
			return res.status(401).json({
				error: "Unauthorized",
			});
		}

		const result = await commentService.deleteComment(commentId as string, user.id as string, user.role as UserRole);

		res.status(200).json(result);
	} catch (error: any) {
		if (error.message === "Forbidden") {
			return res.status(403).json({
				error: "You are not allowed to delete this comment",
			});
		}

		res.status(400).json({
			error: "Failed to delete comment",
			details: error,
		});
	}
};

export const commentController = {
	createComment,
	getCommentById,
	getCommentsByAuthor,
	deleteComment,
	updateComment,
};
