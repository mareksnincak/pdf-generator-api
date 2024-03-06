enum ScopeName {
  admin = 'aws.cognito.signin.user.admin',
  readTemplates = 'templates:read',
  writeTemplates = 'templates:write',
  generateDocuments = 'documents:generate',
}

export enum ResourceServerIdentifier {
  pdfGenerator = 'pdf-generator',
}

export const customOAuthScopes = {
  readTemplates: {
    name: ScopeName.readTemplates,
    pdfGeneratorName: `${ResourceServerIdentifier.pdfGenerator}/${ScopeName.readTemplates}`,
    description: 'Read templates',
  },
  writeTemplates: {
    name: ScopeName.writeTemplates,
    pdfGeneratorName: `${ResourceServerIdentifier.pdfGenerator}/${ScopeName.writeTemplates}`,
    description: 'Modify templates',
  },
  generateDocuments: {
    name: ScopeName.generateDocuments,
    pdfGeneratorName: `${ResourceServerIdentifier.pdfGenerator}/${ScopeName.generateDocuments}`,
    description: 'Generate documents',
  },
} as const;

export const oAuthScopes = {
  ...customOAuthScopes,
  admin: {
    scope: ScopeName.admin,
    pdfGeneratorScope: ScopeName.admin,
  },
} as const;
