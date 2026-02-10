import express, { Router } from "express";

import { authenticate, UserRole } from "../../middleware/authenticate";
import { commentController } from "./comment.controller";

const router = express.Router();

router.get("/:commentId", commentController.getCommentById);
router.get("/author/:authorId", commentController.getCommentsByAuthor);

router.post("/", authenticate(UserRole.USER, UserRole.ADMIN), commentController.createComment);
router.patch("/:commentId", authenticate(UserRole.USER, UserRole.ADMIN), commentController.updateComment);
router.delete("/:commentId", authenticate(UserRole.USER, UserRole.ADMIN), commentController.deleteComment);
export const commentRouter: Router = router;
