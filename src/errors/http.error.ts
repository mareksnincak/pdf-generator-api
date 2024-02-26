export type HttpErrorResponse = {
  message: string;
};

export class HttpError extends Error {
  private readonly statusCode: number;

  private readonly response: HttpErrorResponse;

  constructor(statusCode: number, response: HttpErrorResponse) {
    super(response.message);

    this.statusCode = statusCode;
    this.response = response;
  }

  public getData() {
    return {
      statusCode: this.statusCode,
      response: this.response,
    };
  }
}
