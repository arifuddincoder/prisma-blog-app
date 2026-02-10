import { Prisma } from "../../../generated/prisma/client";

export type CommentRow = Prisma.CommentGetPayload<{}>;

export type CommentNode = CommentRow & { replies: CommentNode[] };

export const buildCommentTree = (comments: CommentRow[]): CommentNode[] => {
	const map = new Map<string, CommentNode>();
	const roots: CommentNode[] = [];

	// 1) node বানাই
	for (const c of comments) {
		map.set(c.id, { ...c, replies: [] });
	}

	// 2) parent-child link করি
	for (const c of comments) {
		const node = map.get(c.id)!;

		if (c.parentId) {
			const parent = map.get(c.parentId);
			if (parent) parent.replies.push(node);
			else roots.push(node); // parent missing হলে root
		} else {
			roots.push(node);
		}
	}

	return roots;
};
