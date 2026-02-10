import express, { Router } from "express";
import { postController } from "./post.controller";
import { authenticate, UserRole } from "../../middleware/authenticate";

const router = express.Router();

router.get("/", postController.getAllPosts);

router.post("/", authenticate(UserRole.USER, UserRole.ADMIN), postController.createPost);

router.get("/my-posts", authenticate(UserRole.USER, UserRole.ADMIN), postController.getMyPosts);
router.get("/:postId", postController.getPostById);

router.patch("/:postId", authenticate(UserRole.USER, UserRole.ADMIN), postController.updatePost);
router.delete("/:postId", authenticate(UserRole.USER, UserRole.ADMIN), postController.deletePost);
export const postRouter: Router = router;
