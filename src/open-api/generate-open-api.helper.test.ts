import { generateOpenApi } from './generate-open-api.helper';

beforeEach(() => {
  jest.resetAllMocks();
});

describe('generateOpenApi', () => {
  it('should generate open-api', async () => {
    const result = generateOpenApi();

    expect(typeof result).toEqual('object');
    expect(result).toHaveProperty('openapi', '3.0.0');
  });
});
