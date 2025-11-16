// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions, SessionStrategy } from "next-auth"; 
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";
import { Adapter } from "next-auth/adapters";

// Helper function to connect and get the DB
async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}

export const authOptions: AuthOptions = { 
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }) as Adapter,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing credentials");
        }

        const db = await getDb();
        const user = await db.collection("users").findOne({
          email: credentials.email,
        });

        if (!user) {
          throw new Error("No user found.");
        }

        // Use 'as string' to satisfy bcrypt
        const isValid = await bcrypt.compare(credentials.password, user.password as string);

        if (!isValid) {
          throw new Error("Invalid password.");
        }

        // CRITICAL FIX: DO NOT return the large profilePicture field here.
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role, 
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy, 
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/", 
  },
  // CRITICAL FIX: Do NOT include the large data in the JWT or session object.
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // The token is now kept small and fits in the cookie.
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        // The session only contains basic, small data.
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };