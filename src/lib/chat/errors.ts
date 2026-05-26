export function chatErrorResponse(error: unknown): Response {
  console.error("Chat API error:", error);

  if (error instanceof Error && error.message.includes("503")) {
    return new Response(
      JSON.stringify({
        error: "AI service temporarily unavailable",
        message:
          "Sorry lah, Ah Mah's cooking brain is taking a break! Try again in a few minutes.",
        retryable: true,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      error: "Something went wrong",
      message: "Aiyah, something went wrong! Please try again later.",
      retryable: false,
    }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}
