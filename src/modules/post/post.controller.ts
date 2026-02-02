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

export const postController = {
	createPost,
};
