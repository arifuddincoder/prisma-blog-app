import express, { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";

const router = express.Router();

export enum UserRole {
	USER = "USER",
	ADMIN = "ADMIN",
}

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				name: string;
				email: string;
				role: string;
				emailVerified: boolean;
			};
		}
	}
}

export const authenticate = (...roles: UserRole[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// get user session
			const session = await auth.api.getSession({
				headers: req.headers as any,
			});
			if (!session) {
				return res.status(401).json({
					success: false,
					message: "You are not authorized!",
				});
			}

			if (!session.user.emailVerified) {
				return res.status(403).json({
					success: false,
					message: "Email verification required!",
				});
			}

			req.user = {
				id: session.user.id,
				name: session.user.name,
				email: session.user.email,
				role: session.user.role as string,
				emailVerified: session.user.emailVerified,
			};

			if (roles.length && !roles.includes(req.user?.role as UserRole)) {
				return res.status(403).json({
					success: false,
					message: "forbidden! you don't have permission to access",
				});
			}

			next();
		} catch (err) {
			next(err);
		}
	};
};
