enum ScopeName {
  admin = 'aws.cognito.signin.user.admin',
  generateDocuments = 'documents:generate',
  readTemplates = 'templates:read',
  writeTemplates = 'templates:write',
}

export enum ResourceServerIdentifier {
  pdfGenerator = 'pdf-generator',
}

export const customOAuthScopes = {
  generateDocuments: {
    description: 'Generate documents',
    name: ScopeName.generateDocuments,
    pdfGeneratorName: `${ResourceServerIdentifier.pdfGenerator}/${ScopeName.generateDocuments}`,
  },
  readTemplates: {
    description: 'Read templates',
    name: ScopeName.readTemplates,
    pdfGeneratorName: `${ResourceServerIdentifier.pdfGenerator}/${ScopeName.readTemplates}`,
  },
  writeTemplates: {
    description: 'Modify templates',
    name: ScopeName.writeTemplates,
    pdfGeneratorName: `${ResourceServerIdentifier.pdfGenerator}/${ScopeName.writeTemplates}`,
  },
} as const;

export const oAuthScopes = {
  ...customOAuthScopes,
  admin: {
    pdfGeneratorScope: ScopeName.admin,
    scope: ScopeName.admin,
  },
} as const;
