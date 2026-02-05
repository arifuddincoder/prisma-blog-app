import { prisma } from "../lib/prisma";

const seedAdmin = async () => {
	try {
		console.log("🚀 Seeding admin...");

		const adminData = {
			name: "Admin 3 Saheb",
			email: "admin3@admin.com",
			password: "admin1234",
			role: "ADMIN",
		};

		const baseUrl = "http://localhost:3000";

		const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: baseUrl,
				Host: "localhost:3000",
			},
			body: JSON.stringify(adminData),
		});

		console.log("📡 Response status:", res.status);

		const data = await res.json().catch(() => ({}));
		console.log("📦 Response data:", data);

		if (!res.ok) {
			console.log("❌ Admin already exists or signup failed");
			return;
		}

		// ✅ signup সফল হলে emailVerified true করে দাও
		await prisma.user.update({
			where: { email: adminData.email },
			data: { emailVerified: true },
		});

		console.log("✅ Admin seeded successfully");
	} catch (error) {
		console.error("❌ Admin seeding failed:", error);
	} finally {
		await prisma.$disconnect();
	}
};

seedAdmin();
