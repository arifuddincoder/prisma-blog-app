import { Request, Response } from "express";
import { postService } from "./post.service";

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

	const payload: any = {};

	if (search) payload.search = search;
	if (tags?.length) payload.tags = tags;
	if (featured !== undefined) payload.featured = featured;

	const result = await postService.getAllPosts(payload);

	res.status(200).json(result);
};

export const postController = {
	createPost,
	getAllPosts,
};
