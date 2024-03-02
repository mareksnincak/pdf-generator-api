export enum PdfGeneratorCustomAuthorizationScope {
  readTemplates = 'templates:read',
  writeTemplates = 'templates:write',
}

export enum ResourceServerIdentifier {
  pdfGenerator = 'pdf-generator',
}

export enum AuthorizationScope {
  admin = 'aws.cognito.signin.user.admin',
  pdfGeneratorReadTemplates = `${ResourceServerIdentifier.pdfGenerator}/${PdfGeneratorCustomAuthorizationScope.readTemplates}`,
  pdfGeneratorWriteTemplates = `${ResourceServerIdentifier.pdfGenerator}/${PdfGeneratorCustomAuthorizationScope.writeTemplates}`,
}
