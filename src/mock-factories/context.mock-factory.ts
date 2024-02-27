import { type Context } from 'aws-lambda';

export class ContextMockFactory {
  create(overrides: Partial<Context> = {}): Context {
    return {
      ...overrides,
    } satisfies Partial<Context> as Context;
  }
}
