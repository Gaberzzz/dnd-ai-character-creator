import type { LoaderFunction, ActionFunction } from "react-router";
import { addSharedRoll, getSharedRolls } from "../utils/rollStore.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader: LoaderFunction = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  const url = new URL(request.url);
  const since = url.searchParams.get("since") || undefined;
  const rolls = getSharedRolls(since);
  return Response.json({ rolls }, { headers: CORS_HEADERS });
};

export const action: ActionFunction = async ({ request }) => {
  const roll = await request.json();
  if (!roll.id || !roll.timestamp || roll.total === undefined) {
    return Response.json({ error: "Invalid roll data" }, { status: 400 });
  }
  roll.characterName = roll.characterName || "Unknown";
  addSharedRoll(roll);
  return Response.json({ success: true });
};
