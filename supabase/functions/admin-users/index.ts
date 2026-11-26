import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" }
});

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const caller = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Not authenticated" }, 401);

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SECRET_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: admin, error: adminError } = await service
      .from("profiles").select("id,role,active").eq("id", user.id).single();

    if (adminError || admin?.role !== "admin" || admin.active !== true) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json();
    const action = body.action;

    if (action === "list") {
      const { data: profiles, error: profileError } = await service.from("profiles")
        .select("id,username,name,level,avatar,role,active,created_at")
        .order("created_at", { ascending: true });
      if (profileError) throw profileError;

      const users = await Promise.all((profiles || []).map(async profile => {
        const { data: accessRows, error: accessError } = await service
          .from("user_access").select("section,enabled").eq("user_id", profile.id);
        if (accessError) throw accessError;
        const { data: progressRows, error: progressError } = await service
          .from("user_progress").select("level,visited").eq("user_id", profile.id);
        if (progressError) throw progressError;
        return {
          ...profile,
          access: (accessRows || []).filter(x => x.enabled).map(x => x.section),
          visited: (progressRows || []).find(x => x.level === profile.level)?.visited || []
        };
      }));
      return json({ users });
    }

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || !/^[a-z0-9._-]{3,40}$/.test(username) || password.length < 8) {
        return json({ error: "Valid email, username (3-40 characters) and password (at least 8 characters) are required." }, 400);
      }

      let userId = "";
      const existing = await service.auth.admin.getUserByEmail(email);
      if (existing.data?.user) {
        userId = existing.data.user.id;
        const { data: existingProfile } = await service.from("profiles")
          .select("id,role").eq("id", userId).maybeSingle();
        if (existingProfile?.role === "admin") {
          return json({ error: "This email belongs to an admin account." }, 400);
        }
      } else {
        const { data: created, error: createError } = await service.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username }
        });
        if (createError) return json({ error: createError.message }, 400);
        userId = created.user.id;
      }

      const { error: profileError } = await service.from("profiles").upsert({
        id: userId,
        username,
        name: String(body.name || "Little Learner").slice(0, 30),
        level: ["LKG","UKG","Class 1"].includes(body.level) ? body.level : "LKG",
        avatar: ["🦊","🐼","🐯","🐰","🐸","🦁"].includes(body.avatar) ? body.avatar : "🦊",
        role: "user",
        active: true
      }, { onConflict: "id" });
      if (profileError) {
        if (!existing.data?.user) await service.auth.admin.deleteUser(userId);
        throw profileError;
      }

      const sections = Array.isArray(body.access) ? body.access : ["home"];
      const { error: accessError } = await service.from("user_access").upsert(
        ["home","learn","games","worksheets","progress"].map(section => ({
          user_id: userId, section, enabled: sections.includes(section)
        })),
        { onConflict: "user_id,section" }
      );
      if (accessError) {
        if (!existing.data?.user) await service.auth.admin.deleteUser(userId);
        throw accessError;
      }

      return json({ ok: true, id: userId });
    }

    if (action === "update") {
      const id = String(body.id || "");
      if (!id) return json({ error: "User id required" }, 400);

      const profilePatch: Record<string, unknown> = {};
      for (const key of ["name","level","avatar","active"]) {
        if (key in body) profilePatch[key] = body[key];
      }
      if (Object.keys(profilePatch).length) {
        const { error } = await service.from("profiles").update(profilePatch).eq("id", id).eq("role", "user");
        if (error) throw error;
      }

      if (Array.isArray(body.access)) {
        for (const section of ["home","learn","games","worksheets","progress"]) {
          const { error } = await service.from("user_access").upsert({
            user_id: id, section, enabled: body.access.includes(section)
          });
          if (error) throw error;
        }
      }
      return json({ ok: true });
    }

    if (action === "delete") {
      const id = String(body.id || "");
      if (!id) return json({ error: "User id required" }, 400);
      const { data: target } = await service.from("profiles").select("role").eq("id", id).single();
      if (target?.role === "admin") return json({ error: "Admin account cannot be deleted." }, 400);
      const { error } = await service.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected server error" }, 500);
  }
});
