import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AppError, ErrorCode, RateLimitError } from "@/lib/errors";
import { fail } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { isProduction } from "@/lib/env";

export interface ApiContext<TParams = Record<string, string>> {
  req: NextRequest;
  params: TParams;
  requestId: string;
}

type RouteHandler<TParams> = (
  ctx: ApiContext<TParams>,
) => Promise<NextResponse>;

export function withApiHandler<TParams = Record<string, string>>(
  handler: RouteHandler<TParams>,
) {
  return async (
    req: NextRequest,
    segment: { params: Promise<TParams> },
  ): Promise<NextResponse> => {
    const requestId = `req_${randomUUID()}`;
    const startedAt = Date.now();

    try {
      const params = await segment.params;
      const response = await handler({ req, params, requestId });
      response.headers.set("X-Request-Id", requestId);

      logger.info("request.completed", {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return response;
    } catch (error) {
      return handleError(error, requestId, req, startedAt);
    }
  };
}

function handleError(
  error: unknown,
  requestId: string,
  req: NextRequest,
  startedAt: number,
): NextResponse {
  const base = {
    requestId,
    method: req.method,
    path: req.nextUrl.pathname,
    durationMs: Date.now() - startedAt,
  };

  if (error instanceof ZodError) {
    logger.warn("request.validation_failed", { ...base, issues: error.issues });
    return fail(
      {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Los datos enviados no son validos",
        status: 400,
        details: error.issues.map((i) => ({
          field: i.path.join("."),
          issue: i.message,
        })),
      },
      requestId,
    );
  }

  if (error instanceof AppError) {
    logger.warn("request.app_error", { ...base, code: error.code });
    const headers =
      error instanceof RateLimitError
        ? { "Retry-After": String(error.retryAfterSeconds) }
        : undefined;

    return fail(
      {
        code: error.code,
        message: error.message,
        status: error.statusCode,
        details: error.details,
      },
      requestId,
      headers,
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta as { target?: string[] } | undefined)?.target;
      const fields = Array.isArray(target) ? target.join(", ") : "desconocido";

      logger.warn("request.unique_violation", { ...base, target });

      return fail(
        {
          code: ErrorCode.CONFLICT,
          message: isProduction
            ? "Ya existe un registro con esos datos"
            : `Restricción única violada en: ${fields}`,
          status: 409,
        },
        requestId,
      );
    }
  }

  logger.error("request.unhandled_error", {
    ...base,
    error: error instanceof Error ? error.stack : String(error),
  });

  return fail(
    {
      code: ErrorCode.INTERNAL_ERROR,
      message: isProduction
        ? "Ocurrio un error inesperado"
        : error instanceof Error
          ? error.message
          : "Error desconocido",
      status: 500,
    },
    requestId,
  );
}
