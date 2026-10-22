import {
  fetchJson,
  isNotFoundError,
  postJson,
} from '@/utils';

const URL = 'https://api.example.com/v1/item?apikey=SECRET';

function respond(body: BodyInit | null, status: number) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status })));
}

describe('fetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves the body of a 200 response', async () => {
    respond(JSON.stringify({ value: 1 }), 200);
    expect(await fetchJson(URL)).toEqual({ value: 1 });
  });

  it('resolves null for a 204 response', async () => {
    respond(null, 204);
    expect(await fetchJson(URL)).toBeNull();
  });

  it('rejects a 404 with the status and the JSON body', async () => {
    respond(JSON.stringify({ error: 'not found' }), 404);

    const error = await fetchJson(URL).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    // The URL can carry an API key, and the message reaches logs and dapps
    expect(error.message).toBe('HTTP 404 from api.example.com');
    expect(error).toMatchObject({
      statusCode: 404,
      response: { data: { error: 'not found' } },
    });
    // The saved error log spreads the error, it must not copy the body
    expect({ ...error }).toEqual({ statusCode: 404 });
    expect(isNotFoundError(error)).toBe(true);
  });

  it('rejects a 502 with a text body', async () => {
    respond('<html>Bad Gateway</html>', 502);

    await expect(fetchJson(URL)).rejects.toMatchObject({
      statusCode: 502,
      response: { data: '<html>Bad Gateway</html>' },
    });
  });

  it('rejects a 503 with an empty body', async () => {
    respond(null, 503);

    const error = await fetchJson(URL).catch((e) => e);

    expect(error.statusCode).toBe(503);
    expect(error.response.data).toBeUndefined();
    expect(isNotFoundError(error)).toBe(false);
  });

  it('rejects a 429 of a POST request', async () => {
    respond(JSON.stringify({ error: 'MORE_ORACLES_NEEDED' }), 429);

    await expect(postJson(URL, { body: { a: 1 } })).rejects.toMatchObject({
      statusCode: 429,
      response: { data: { error: 'MORE_ORACLES_NEEDED' } },
    });
  });
});
