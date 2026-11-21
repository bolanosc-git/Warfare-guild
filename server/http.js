export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function respond(action, cache = "no-store") {
  try {
    return Response.json(await action(), { headers: { "Cache-Control": cache } });
  } catch (error) {
    if (!(error instanceof HttpError)) console.error(error.name);
    return Response.json({ error: error instanceof HttpError ? error.message : "The guild service is temporarily unavailable." }, {
      status: error instanceof HttpError ? error.status : 502,
      headers: { "Cache-Control": "no-store" }
    });
  }
}

export async function readJson(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is missing");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("Response exceeds the size limit");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
