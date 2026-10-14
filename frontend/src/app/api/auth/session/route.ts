import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Token manquant",
        },
        {
          status: 400,
        }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Session créée",
    });

    response.cookies.set("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error(
      "Erreur de création de session :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de créer la session",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Session supprimée",
  });

  response.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}