import { NextResponse } from "next/server";
import type { ErrorDetail } from "@/lib/errors";

export function ok<T>(data: T, requestId: string, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data, meta: { requestId } },
    { status },
  );
}

export function created<T>(data: T, requestId: string): NextResponse {
  return ok(data, requestId, 201);
}

export function paginated<T>(
  data: readonly T[],
  pagination: { page: number; pageSize: number; total: number },
  requestId: string,
): NextResponse {
  const { page, pageSize, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    success: true,
    data,
    meta: {
      requestId,
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}

export function fail(
  params: {
    code: string;
    message: string;
    status: number;
    details?: ErrorDetail[];
  },
  requestId: string,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: params.code,
        message: params.message,
        ...(params.details ? { details: params.details } : {}),
      },
      meta: { requestId },
    },
    { status: params.status, headers },
  );
}
