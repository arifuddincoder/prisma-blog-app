import express, { Router } from "express";
import { postController } from "./post.controller";
import { authenticate, UserRole } from "../../middleware/authenticate";

const router = express.Router();

router.get("/", postController.getAllPosts);

router.get("/:postId", postController.getPostById);

router.post("/", authenticate(UserRole.USER, UserRole.ADMIN), postController.createPost);

export const postRouter: Router = router;
