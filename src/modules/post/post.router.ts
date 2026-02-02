import express, { Router } from "express";
import { postController } from "./post.controller";
import { authenticate, UserRole } from "../../middleware/authenticate";

const router = express.Router();

router.post("/", authenticate(UserRole.USER), postController.createPost);

export const postRouter: Router = router;
