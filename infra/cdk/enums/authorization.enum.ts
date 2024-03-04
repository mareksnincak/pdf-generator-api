export enum PdfGeneratorCustomAuthorizationScope {
  readTemplates = 'templates:read',
  writeTemplates = 'templates:write',
  generateDocuments = 'documents:generate',
}

export enum ResourceServerIdentifier {
  pdfGenerator = 'pdf-generator',
}

export enum AuthorizationScope {
  admin = 'aws.cognito.signin.user.admin',
  pdfGeneratorReadTemplates = `${ResourceServerIdentifier.pdfGenerator}/${PdfGeneratorCustomAuthorizationScope.readTemplates}`,
  pdfGeneratorWriteTemplates = `${ResourceServerIdentifier.pdfGenerator}/${PdfGeneratorCustomAuthorizationScope.writeTemplates}`,
  pdfGeneratorGenerateDocuments = `${ResourceServerIdentifier.pdfGenerator}/${PdfGeneratorCustomAuthorizationScope.generateDocuments}`,
}
