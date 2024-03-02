import { generateOpenApi } from './generate-open-api.schema';

describe('generateOpenApi', () => {
  it('should generate open-api', async () => {
    const result = generateOpenApi();

    expect(result.openapi).toEqual('3.0.0');
    expect(result.servers).toEqual([{ url: '/' }]);
  });

  it('should use apiUrl when it is provided', async () => {
    const apiUrl = 'https://api.example.com';
    const result = generateOpenApi({ apiUrl });

    expect(result.servers).toEqual([{ url: apiUrl }]);
  });

  it('should use authUrl when it is provided', async () => {
    const authUrl = 'https://auth.example.com';
    const result = generateOpenApi({ authUrl });

    expect(result.components?.securitySchemes).toHaveProperty(
      'oauth2Auth.flows.implicit.authorizationUrl',
      authUrl,
    );
  });
});
