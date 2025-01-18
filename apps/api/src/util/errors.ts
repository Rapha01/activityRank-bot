import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class JSONHTTPException extends HTTPException {
  constructor(status: ContentfulStatusCode, message: string) {
    super(status, { message });
  }
  override getResponse() {
    return Response.json({ code: this.status, message: this.message }, { status: this.status });
  }
}
