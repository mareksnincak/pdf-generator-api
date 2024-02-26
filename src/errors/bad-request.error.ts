import { HttpError } from './http.error';
import { type HttpErrorResponse } from './http.error';

export class BadRequestError extends HttpError {
  constructor(response: HttpErrorResponse) {
    super(400, response);
  }
}
