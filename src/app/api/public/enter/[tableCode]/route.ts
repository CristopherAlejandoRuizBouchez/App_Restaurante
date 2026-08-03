import { NextResponse, type NextRequest } from "next/server";
import { tableSessionService } from "@/modules/ordering";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableCode: string }> },
) {
  const { tableCode } = await params;

  try {
    const session = await tableSessionService.openGuestSessionByCode(tableCode);

    const response = NextResponse.redirect(new URL(`/m/${tableCode}`, req.url));

    response.cookies.set("smq_guest", session.guestToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/mesa-invalida", req.url));
  }
}
