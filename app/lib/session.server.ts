import { createCookie, redirect } from "react-router";
import { getDb } from "./db.server";
import type { Member } from "./types";

export const sessionCookie = createCookie("ph_member", {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30,
  secrets: [process.env.SESSION_SECRET ?? "projecthub-dev-secret"],
});

export async function getCurrentMember(
  request: Request,
): Promise<Member | null> {
  const id = await sessionCookie.parse(request.headers.get("Cookie"));
  if (typeof id !== "string" || !id) return null;
  return getDb().members.find((m) => m.id === id) ?? null;
}

/** ログイン必須の loader/action で使う。未ログインなら /login へリダイレクト */
export async function requireMember(request: Request): Promise<Member> {
  const member = await getCurrentMember(request);
  if (!member) throw redirect("/login");
  return member;
}

export async function loginHeaders(memberId: string): Promise<HeadersInit> {
  return { "Set-Cookie": await sessionCookie.serialize(memberId) };
}

export async function logoutHeaders(): Promise<HeadersInit> {
  return { "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }) };
}
