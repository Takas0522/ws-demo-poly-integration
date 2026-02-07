import { apiClient } from "@/lib/api-client";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// バックエンド→フロントエンド: サービスデータのフィールド名変換
function transformServiceResponse(service: Record<string, unknown>) {
  return {
    service_id: service.id,
    service_name: service.name,
    description: service.description,
    api_url: service.api_url,
    is_active: service.is_active,
    is_mock: service.is_mock,
    created_at: service.created_at,
    updated_at: service.updated_at,
    available_roles: service.roles || [],
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
    const data = await apiClient.getServices(token);

    // バックエンドは { data: [...] } を返す
    const services = (data.data || data.services || []).map(
      transformServiceResponse,
    );
    return NextResponse.json({ services });
  } catch (error: unknown) {
    console.error("Get services error:", error);
    const err = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      { error: err.response?.data?.detail || "Failed to fetch services" },
      { status: err.response?.status || 500 },
    );
  }
}
