export enum PdfGeneratorCustomAuthorizationScope {
  writeTemplates = 'templates:write',
}

export enum ResourceServerIdentifier {
  pdfGenerator = 'pdf-generator',
}

export enum AuthorizationScope {
  admin = 'aws.cognito.signin.user.admin',
  pdfGeneratorWriteTemplates = `${ResourceServerIdentifier.pdfGenerator}/${PdfGeneratorCustomAuthorizationScope.writeTemplates}`,
}
