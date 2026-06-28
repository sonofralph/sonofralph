import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "register", { limit: 5, windowSecs: 900 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Check for existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const slug = slugify(data.orgName);
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    const finalSlug = existingOrg ? `${slug}-${Date.now()}` : slug;
    const passwordHash = await bcrypt.hash(data.password, 10);

    const org = await prisma.organization.create({
      data: {
        name: data.orgName,
        slug: finalSlug,
        plan: "FREE",
        deploymentMode: "SAAS",
        users: {
          create: {
            email: data.email,
            name: data.name,
            passwordHash,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({ organizationId: org.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? err.message },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
