"use client";
import { getSupabase } from "./supabase-browser";
import type { Session } from "./types";

export type BoardRow = { id: string; title: string; updated_at: string };

export async function saveBoard(s: Session) {
  const db = getSupabase();
  if (!db) return;
  const { error } = await db
    .from("boards")
    .upsert({ id: s.id, title: s.topic, data: s, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function listBoards(): Promise<BoardRow[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.from("boards").select("id,title,updated_at").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function loadBoard(id: string): Promise<Session | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.from("boards").select("data").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data?.data as Session) ?? null;
}

export async function deleteBoard(id: string) {
  const { error } = (await getSupabase()?.from("boards").delete().eq("id", id)) ?? {};
  if (error) throw error;
}
