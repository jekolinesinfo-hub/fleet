// Supabase Edge Function: create-user
// Creates a new auth user (email/password), profile, role, and optional organization membership

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { email, password, full_name, role = "driver", organization_id } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PUBLISHABLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Validate caller auth & role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userResp, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Get caller role and organizations
    const { data: callerRole } = await supabaseAuth.rpc("get_current_user_role");
    const { data: callerOrgIds } = await supabaseAuth.rpc("get_user_organization_ids");

    if (callerRole !== 'admin' && callerRole !== 'fleet_manager') {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Only admins can create admins; fleet managers can create only drivers
    const requestedRole = ["admin","fleet_manager","driver"].includes(role) ? role : "driver";
    if (callerRole === 'fleet_manager' && requestedRole !== 'driver') {
      return new Response(JSON.stringify({ error: "Fleet managers can only create drivers" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Resolve target organization
    let targetOrgId = organization_id as string | undefined;
    if (callerRole === 'fleet_manager') {
      const allowed = Array.isArray(callerOrgIds) ? callerOrgIds : [];
      if (!targetOrgId) targetOrgId = allowed[0];
      if (!targetOrgId || !allowed.includes(targetOrgId)) {
        return new Response(JSON.stringify({ error: "Invalid organization" }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) Create auth user (email confirmed to allow immediate login)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError || !userData?.user) {
      const errMsg = createError?.message || "Failed to create user";
      const status = errMsg.includes("already registered") ? 409 : 400;
      return new Response(JSON.stringify({ error: errMsg }), {
        status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const userId = userData.user.id;

    // 2) Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      full_name,
    });
    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 3) Assign role
    const finalRole = requestedRole as any;
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: finalRole,
    });
    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 4) Optional: add to organization
    if (targetOrgId) {
      const { error: orgError } = await supabase.from("user_organizations").insert({
        user_id: userId,
        organization_id: targetOrgId,
      });
      if (orgError) {
        return new Response(JSON.stringify({ error: orgError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    return new Response(JSON.stringify({ user_id: userId, email }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(JSON.stringify({ 
      error: e?.message || "Unexpected error",
      details: e?.toString() || "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
