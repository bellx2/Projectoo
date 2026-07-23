import { redirect } from "react-router";
import { logoutHeaders } from "~/lib/session.server";

export async function action() {
  return redirect("/login", { headers: await logoutHeaders() });
}

export async function loader() {
  return redirect("/");
}
