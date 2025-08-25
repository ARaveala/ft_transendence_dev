// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("http://localhost:3000/register", async ({ request }) => {
    const data = await request.json();

    return HttpResponse.json(
      { message: "Mock registration successful!", user: data },
      { status: 200 }
    );
  }),
];
