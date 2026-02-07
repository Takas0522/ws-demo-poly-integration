import { apiClient, TenantData } from "@/lib/api-client";
import { getSession, hasRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// バックエンド→フロントエンド: テナントデータのフィールド名変換
function transformTenantResponse(tenant: Record<string, unknown>) {
  return {
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    is_privileged: tenant.is_privileged,
    created_at: tenant.created_at,
    updated_at: tenant.updated_at,
    user_count: tenant.user_count,
    domains: tenant.domains,
  };
}

// フロントエンド→バックエンド: テナントデータのフィールド名変換
function transformTenantRequest(data: Record<string, unknown>): TenantData {
  return {
    name: data.tenant_name as string,
    ...(data.domains !== undefined && { domains: data.domains as string[] }),
  };
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }
    const data = await apiClient.getTenants(token);

    const tenants = (data.tenants || []).map(transformTenantResponse);
    return NextResponse.json({ tenants, total: data.total });
  } catch (error: unknown) {
    console.error("Get tenants error:", error);
    const err = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      { error: err.response?.data?.detail || "Failed to fetch tenants" },
      { status: err.response?.status || 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ロールチェック: 管理者以上
  if (!hasRole(session, ["global_admin", "admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const backendData = transformTenantRequest(body);
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }
    const tenant = await apiClient.createTenant(backendData, token);

    return NextResponse.json(transformTenantResponse(tenant), { status: 201 });
  } catch (error: unknown) {
    console.error("Create tenant error:", error);
    const err = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      { error: err.response?.data?.detail || "Failed to create tenant" },
      { status: err.response?.status || 500 },
    );
  }
}
