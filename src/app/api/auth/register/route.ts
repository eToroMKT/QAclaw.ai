export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIP,
  sanitizeInput,
  SECURITY_HEADERS,
} from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 registrations per hour per IP
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(`register:${clientIP}`, {
      maxRequests: 5,
      windowMs: 3600000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            "Retry-After": Math.ceil(
              (rateLimit.resetAt - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const sanitizedEmail = sanitizeInput(email, 255).toLowerCase();
    const sanitizedName = sanitizeInput(name, 100);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409, headers: SECURITY_HEADERS }
      );
    }

    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        name: sanitizedName,
        passwordHash: hashedPassword,
        role: "tester",
      },
    });

    console.log("[Email Registration] User created:", {
      id: newUser.id,
      email: sanitizedEmail,
      name: sanitizedName,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        userId: newUser.id,
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
