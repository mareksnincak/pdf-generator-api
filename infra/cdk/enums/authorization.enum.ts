export enum PdfGeneratorAuthorizationScope {
  templateWrite = 'template:write',
}

export enum ResourceServerIdentifier {
  pdfGenerator = 'pdf-generator',
}

export enum AuthorizationScope {
  templateWrite = `${ResourceServerIdentifier.pdfGenerator}/${PdfGeneratorAuthorizationScope.templateWrite}`,
}
