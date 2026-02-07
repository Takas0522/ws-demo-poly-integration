import { apiClient, TenantData } from "@/lib/api-client";
import { getSession } from "@/lib/auth";
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
function transformTenantRequest(
  data: Record<string, unknown>,
): Partial<TenantData> {
  const result: Partial<TenantData> = {};
  if (data.tenant_name !== undefined) {
    result.name = data.tenant_name as string;
  }
  if (data.domains !== undefined) {
    result.domains = data.domains as string[];
  }
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }
    const tenant = await apiClient.getTenant(id, token);

    return NextResponse.json(transformTenantResponse(tenant));
  } catch (error: unknown) {
    console.error("Get tenant error:", error);
    const err = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      { error: err.response?.data?.detail || "Failed to fetch tenant" },
      { status: err.response?.status || 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const backendData = transformTenantRequest(body);
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }
    const tenant = await apiClient.updateTenant(id, backendData, token);

    return NextResponse.json(transformTenantResponse(tenant));
  } catch (error: unknown) {
    console.error("Update tenant error:", error);
    const err = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      { error: err.response?.data?.detail || "Failed to update tenant" },
      { status: err.response?.status || 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }
    await apiClient.deleteTenant(id, token);

    return NextResponse.json({ message: "Tenant deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete tenant error:", error);
    const err = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      { error: err.response?.data?.detail || "Failed to delete tenant" },
      { status: err.response?.status || 500 },
    );
  }
}
