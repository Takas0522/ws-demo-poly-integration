import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-key",
);

export interface JWTPayload {
  user_id: string;
  tenant_id: string;
  roles: Array<{
    service_id: string;
    service_name: string;
    role_code: string;
    role_name: string;
  }>;
}

/**
 * JWTトークンを作成する
 * @param payload - トークンに含めるペイロード
 * @returns 生成されたJWTトークン
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

/**
 * JWTトークンを検証し、ペイロードを返す
 * @param token - 検証するJWTトークン
 * @returns トークンが有効な場合はペイロード、無効な場合はnull
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * 現在のセッションを取得する
 * @returns セッション情報、ログインしていない場合はnull
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  return await verifyToken(token);
}

/**
 * ユーザーが指定されたロールを持っているか確認する
 * @param user - ユーザーのペイロード
 * @param roleCodes - 確認するロールコードの配列
 * @returns ロールを持っている場合はtrue
 */
export function hasRole(user: JWTPayload, roleCodes: string[]): boolean {
  return user.roles.some((role) => roleCodes.includes(role.role_code));
}

/**
 * トークンからユーザーIDを取得
 */
export async function getUserIdFromToken(
  token: string,
): Promise<string | null> {
  const payload = await verifyToken(token);
  return payload?.user_id || null;
}

/**
 * トークンからテナントIDを取得
 */
export async function getTenantIdFromToken(
  token: string,
): Promise<string | null> {
  const payload = await verifyToken(token);
  return payload?.tenant_id || null;
}

/**
 * トークンからロールを取得
 */
export async function getRolesFromToken(
  token: string,
): Promise<JWTPayload["roles"] | null> {
  const payload = await verifyToken(token);
  return payload?.roles || null;
}
