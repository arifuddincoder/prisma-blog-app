import { Request, Response } from "express";
import { postService } from "./post.service";
import { paginationAndSortingHelper } from "../../helpers/paginationAndSortingHelper";
import { UserRole } from "../../middleware/authenticate";

const createPost = async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user) {
			return res.status(400).send({
				error: "Unauthorized!",
			});
		}
		const result = await postService.createPost(req.body, user.id as string);
		res.status(201).json(result);
	} catch (error) {
		res.status(400).send({
			error: "Post creation failed!",
			details: error,
		});
	}
};

const getAllPosts = async (req: Request, res: Response) => {
	const search = typeof req.query.search === "string" ? req.query.search : undefined;

	const tags =
		typeof req.query.tags === "string"
			? req.query.tags
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean)
			: undefined;

	const featured = typeof req.query.featured === "string" ? req.query.featured === "true" : undefined;

	const q = paginationAndSortingHelper(req); // ✅ pagination + sorting

	const payload: any = { ...q };
	if (search) payload.search = search;
	if (tags?.length) payload.tags = tags;
	if (featured !== undefined) payload.featured = featured;

	const result = await postService.getAllPosts(payload);
	res.status(200).json(result);
};

export const getPostById = async (req: Request, res: Response) => {
	try {
		const { postId } = req.params; // ✅ URL param

		if (!postId) {
			return res.status(400).json({ error: "Post id is required!" });
		}

		const result = await postService.getPostById(postId as string);

		if (!result) {
			return res.status(404).json({ error: "Post not found!" });
		}

		res.status(200).json(result); // ✅ 200 for GET
	} catch (error) {
		res.status(500).json({
			error: "Something went wrong!",
			details: error,
		});
	}
};

const allowedSortBy = ["createdAt", "views", "title"] as const;
type AllowedSortBy = (typeof allowedSortBy)[number];

const getMyPosts = async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ error: "Unauthorized" });

		const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;

		const tags =
			typeof req.query.tags === "string"
				? req.query.tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean)
				: undefined;

		const featured = typeof req.query.featured === "string" ? req.query.featured === "true" : undefined;

		const page = typeof req.query.page === "string" ? Number(req.query.page) : 1;
		const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;

		const sortBy: AllowedSortBy =
			typeof req.query.sortBy === "string" && (allowedSortBy as readonly string[]).includes(req.query.sortBy)
				? (req.query.sortBy as AllowedSortBy)
				: "createdAt";

		const sortOrder: "asc" | "desc" = req.query.sortOrder === "asc" ? "asc" : "desc";

		const payload: {
			search?: string;
			tags?: string[];
			featured?: boolean;
			page: number;
			limit: number;
			sortBy: AllowedSortBy;
			sortOrder: "asc" | "desc";
		} = { page, limit, sortBy, sortOrder };

		if (search) payload.search = search;
		if (tags?.length) payload.tags = tags;
		if (featured !== undefined) payload.featured = featured;

		const result = await postService.getMyPosts(user.id, payload);
		return res.status(200).json(result);
	} catch (error: any) {
		console.error("🔥 getMyPosts ERROR:", error);
		return res.status(500).json({
			error: "Failed to fetch my posts",
			details: error?.message || error,
		});
	}
};

const updatePost = async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ error: "Unauthorized" });

		const { postId } = req.params;
		if (!postId) {
			return res.status(400).json({ error: "Post id is required" });
		}

		const { title, content, tags, isFeatured } = req.body;

		if (title === undefined && content === undefined && tags === undefined && isFeatured === undefined) {
			return res.status(400).json({ error: "Nothing to update" });
		}

		const result = await postService.updatePost(postId as string, user.id as string, user.role as UserRole, {
			title,
			content,
			tags,
			isFeatured,
		});

		res.status(200).json(result);
	} catch (error: any) {
		res.status(400).json({
			error: "Failed to update post",
			details: error?.message || error,
		});
	}
};

const deletePost = async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({ error: "Unauthorized" });

		const { postId } = req.params;
		if (!postId) return res.status(400).json({ error: "Post id is required" });

		const result = await postService.deletePost(postId as string, user.id as string, user.role as UserRole);

		res.status(200).json(result);
	} catch (error: any) {
		res.status(400).json({
			error: "Failed to delete post",
			details: error?.message || error,
		});
	}
};

export const postController = {
	createPost,
	getAllPosts,
	getPostById,
	getMyPosts,
	updatePost,
	deletePost,
};
