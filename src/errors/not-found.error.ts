import { HttpError } from './http.error';
import { type HttpErrorResponse } from './http.error';

export class NotFoundError extends HttpError {
  constructor(response: HttpErrorResponse) {
    super(404, response);
  }
}
