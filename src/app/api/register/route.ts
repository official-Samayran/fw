// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    // --- CRITICAL CHANGE: Manually read and parse JSON body ---
    const rawBody = await request.text();
    const { fullName, email, password, role, profilePicture } = JSON.parse(rawBody);
    // --------------------------------------------------------

    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const result = await db.collection("users").insertOne({
      name: fullName,
      email: email,
      password: hashedPassword,
      role: role, // 'bidder', 'celebrity', 'ngo'
      profilePicture: profilePicture || null, 
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "User created successfully", userId: result.insertedId },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    // Log the actual error to your terminal
    console.error("Manual Body Parsing or MongoDB Insert Failed:", e); 
    
    return NextResponse.json(
      { error: "Failed to create user (Check console for API error)" },
      { status: 500 }
    );
  }
}