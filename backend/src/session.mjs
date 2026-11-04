const unauthenticated = {
  status: 401,
  body: { error: { code: "UNAUTHENTICATED", message: "Please sign in." } },
};

const internalError = {
  status: 500,
  body: { error: { code: "INTERNAL_ERROR", message: "We couldn't load your session. Try again." } },
};

/** Verifies the bearer token with Supabase Auth; returns the user, or the error response to send. */
async function verify(authorization, env, request) {
  const token = /^Bearer ([^\s]+)$/.exec(authorization ?? "")?.[1];
  if (!token) return { failure: unauthenticated };

  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { failure: internalError };

  const headers = { apikey: key, Authorization: `Bearer ${token}` };
  const userResponse = await request(new URL("/auth/v1/user", url), { headers });
  if (userResponse.status === 401 || userResponse.status === 403) return { failure: unauthenticated };
  if (!userResponse.ok) return { failure: internalError };

  const user = await userResponse.json();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id) || typeof user.email !== "string") {
    return { failure: unauthenticated };
  }
  const profileUrl = new URL("/rest/v1/profiles", url);
  profileUrl.searchParams.set("select", "shop_name");
  profileUrl.searchParams.set("owner_id", `eq.${user.id}`);
  return { user, headers, profileUrl };
}

const sessionFrom = (user, profiles) =>
  Array.isArray(profiles) && profiles.length === 1 && typeof profiles[0].shop_name === "string"
    ? { status: 200, body: { email: user.email, shop_name: profiles[0].shop_name } }
    : internalError;

export async function getSession(authorization, env, request = fetch) {
  try {
    const { failure, user, headers, profileUrl } = await verify(authorization, env, request);
    if (failure) return failure;
    const profileResponse = await request(profileUrl, { headers });
    if (!profileResponse.ok) return internalError;
    return sessionFrom(user, await profileResponse.json());
  } catch {
    return internalError;
  }
}

/** PATCH /api/session — body `{shop_name}`; returns the updated session. */
export async function updateShopName(authorization, body, env, request = fetch) {
  const shopName = typeof body?.shop_name === "string" ? body.shop_name.trim() : "";
  if (!shopName || shopName.length > 80) {
    return { status: 400, body: { error: { code: "VALIDATION_ERROR", message: "Enter a shop name up to 80 characters.", fields: { shop_name: "Enter a shop name." } } } };
  }
  try {
    const { failure, user, headers, profileUrl } = await verify(authorization, env, request);
    if (failure) return failure;
    const profileResponse = await request(profileUrl, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ shop_name: shopName }),
    });
    if (!profileResponse.ok) return internalError;
    return sessionFrom(user, await profileResponse.json());
  } catch {
    return internalError;
  }
}
