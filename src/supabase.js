import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && publishableKey);
export const supabase = supabaseConfigured ? createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

export const usernameToEmail = username => `${String(username || "").trim().toLowerCase()}@login.alphabetflipper.app`;

export const normalizeAccount = row => ({
  id: String(row.id),
  username: String(row.username || ""),
  name: typeof row.name === "string" ? row.name : "Little Learner",
  level: ["LKG","UKG","Class 1"].includes(row.level) ? row.level : "LKG",
  avatar: ["🦊","🐼","🐯","🐰","🐸","🦁"].includes(row.avatar) ? row.avatar : "🦊",
  role: row.role === "admin" ? "admin" : "user",
  active: row.active !== false,
  access: Array.isArray(row.access) ? row.access : ["home"],
  visited: Array.isArray(row.visited) ? row.visited.filter(Number.isInteger).filter(i => i >= 0 && i < 26) : []
});

export async function signIn(username, password) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username), password
  });
  if (error) throw error;
  return getAccount(data.user.id);
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export async function getAccount(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase.from("profiles")
    .select("id,username,name,level,avatar,role,active").eq("id", userId).single();
  if (error) throw error;

  const { data: accessRows, error: accessError } = await supabase
    .from("user_access").select("section,enabled").eq("user_id", userId);
  if (accessError) throw accessError;

  const { data: progressRows, error: progressError } = await supabase
    .from("user_progress").select("level,visited").eq("user_id", userId);
  if (progressError) throw progressError;

  const progress = progressRows?.find(x => x.level === data.level);
  return normalizeAccount({
    ...data,
    access: accessRows?.filter(x => x.enabled).map(x => x.section) || ["home"],
    visited: progress?.visited || []
  });
}

export async function saveProfile(userId, profile) {
  if (!supabase) return;
  const { error } = await supabase.from("profiles").update({
    name: profile.name, level: profile.level, avatar: profile.avatar
  }).eq("id", userId);
  if (error) throw error;
}

export async function saveProgress(userId, level, visited) {
  if (!supabase) return;
  const { error } = await supabase.from("user_progress").upsert({
    user_id: userId, level, visited: [...visited], updated_at: new Date().toISOString()
  }, { onConflict: "user_id,level" });
  if (error) throw error;
}

export async function listUsers() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("profiles")
    .select("id,username,name,level,avatar,role,active,created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return Promise.all((data || []).map(async row => {
    const { data: accessRows, error: accessError } = await supabase
      .from("user_access").select("section,enabled").eq("user_id", row.id);
    if (accessError) throw accessError;
    const { data: progressRows, error: progressError } = await supabase
      .from("user_progress").select("level,visited").eq("user_id", row.id);
    if (progressError) throw progressError;
    return normalizeAccount({
      ...row,
      access: accessRows?.filter(x => x.enabled).map(x => x.section) || ["home"],
      visited: progressRows?.find(x => x.level === row.level)?.visited || []
    });
  }));
}

export async function adminUserAction(action, payload) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("admin-users", { body: { action, ...payload } });
  if (error) {
    let message = error.message;
    try {
      const details = await error.context?.json();
      if (details?.error) message = details.error;
    } catch {}
    throw new Error(message);
  }
  return data;
}
