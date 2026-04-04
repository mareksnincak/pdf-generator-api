import { HttpError } from './http.error';
import { type HttpErrorResponse } from './http.error';

export class UnprocessableEntityError extends HttpError {
  constructor(response: HttpErrorResponse) {
    super(422, response);
  }
}
