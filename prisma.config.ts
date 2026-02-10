// prisma.config.ts
import "dotenv/config"; // এটা অবশ্যই প্রথম লাইন — .env লোড করবে Prisma CLI-এর জন্যও

import { defineConfig, env } from "prisma/config"; // নোট: Prisma 6.19+ এ "@prisma/config" না, "prisma/config" হতে পারে — চেক করো

export default defineConfig({
	schema: "prisma/schema", // তোমার schema পাথ (prisma ফোল্ডারে আছে বলে)

	migrations: {
		path: "prisma/migrations", // ডিফল্ট ঠিক
	},

	datasource: {
		url: env("DATABASE_URL"), // env() ব্যবহার করলে missing হলে error throw করবে (ভালো প্র্যাকটিস)
		// অথবা fallback: url: process.env.DATABASE_URL || throw new Error("DATABASE_URL missing")
	},
});
