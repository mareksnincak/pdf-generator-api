import { compile } from 'handlebars';

import { type TemplateEntity } from '../../../db/template/template.entity';
import { getByIdOrFail } from '../../../db/template/template.repository';
import { logger } from '../../../helpers/logger.helper';

import { createPdfFromHtml } from './pdf.service';

async function renderHtmlTemplate(template: TemplateEntity, data: Record<string, unknown>) {
  logger.info('generateDocument.renderHtmlTemplate.start');

  const templateData = await template.getData();
  const compiledTemplate = compile(templateData.toString());
  const renderedTemplate = compiledTemplate(data);

  logger.info('generateDocument.renderHtmlTemplate.success');
  return renderedTemplate;
}

export async function generateDocument({
  userId,
  templateId,
  data,
}: {
  userId: string;
  templateId: string;
  data: Record<string, unknown>;
}) {
  const template = await getByIdOrFail({ id: templateId, userId });

  const renderedTemplate = await renderHtmlTemplate(template, data);

  const pdf = await createPdfFromHtml(renderedTemplate);

  return pdf;
}
