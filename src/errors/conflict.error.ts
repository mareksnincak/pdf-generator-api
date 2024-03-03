import { HttpError } from './http.error';
import { type HttpErrorResponse } from './http.error';

export class ConflictError extends HttpError {
  constructor(response: HttpErrorResponse) {
    super(409, response);
  }
}
