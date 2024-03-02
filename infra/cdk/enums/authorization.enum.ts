export enum PdfGeneratorCustomAuthorizationScope {
  templateWrite = 'template:write',
}

export enum ResourceServerIdentifier {
  pdfGenerator = 'pdf-generator',
}

export enum AuthorizationScope {
  admin = 'aws.cognito.signin.user.admin',
  pdfGeneratorTemplateWrite = `${ResourceServerIdentifier.pdfGenerator}/${PdfGeneratorCustomAuthorizationScope.templateWrite}`,
}
