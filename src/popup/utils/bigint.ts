import JsonBig from 'json-bigint';

const jsonBig = JsonBig({ storeAsString: true });

export function parseBigIntJson(response: any): any {
  return jsonBig.parse(jsonBig.stringify(response));
}
