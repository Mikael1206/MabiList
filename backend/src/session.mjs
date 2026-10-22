const unauthenticated = {
  status: 401,
  body: { error: { code: "UNAUTHENTICATED", message: "Please sign in." } },
};

const internalError = {
  status: 500,
  body: { error: { code: "INTERNAL_ERROR", message: "We couldn't load your session. Try again." } },
};

export async function getSession(authorization, env, request = fetch) {
  const token = /^Bearer ([^\s]+)$/.exec(authorization ?? "")?.[1];
  if (!token) return unauthenticated;

  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return internalError;

  try {
    const headers = { apikey: key, Authorization: `Bearer ${token}` };
    const userResponse = await request(new URL("/auth/v1/user", url), { headers });
    if (userResponse.status === 401 || userResponse.status === 403) return unauthenticated;
    if (!userResponse.ok) return internalError;

    const user = await userResponse.json();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id) || typeof user.email !== "string") {
      return unauthenticated;
    }

    const profileUrl = new URL("/rest/v1/profiles", url);
    profileUrl.searchParams.set("select", "shop_name");
    profileUrl.searchParams.set("owner_id", `eq.${user.id}`);
    const profileResponse = await request(profileUrl, { headers });
    if (!profileResponse.ok) return internalError;

    const profiles = await profileResponse.json();
    if (!Array.isArray(profiles) || profiles.length !== 1 || typeof profiles[0].shop_name !== "string") {
      return internalError;
    }

    return { status: 200, body: { email: user.email, shop_name: profiles[0].shop_name } };
  } catch {
    return internalError;
  }
}
