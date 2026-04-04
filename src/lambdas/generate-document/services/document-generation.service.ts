import { compile } from 'handlebars';

import { type TemplateEntity } from '../../../db/template/entity';
import { MalwareScanStatus } from '../../../db/template/enum';
import * as templateRepository from '../../../db/template/repository';
import { ErrorMessage } from '../../../enums/error.enum';
import { ConflictError } from '../../../errors/conflict.error';
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
  data,
  templateId,
  userId,
}: {
  data: Record<string, unknown>;
  templateId: string;
  userId: string;
}) {
  const template = await templateRepository.getByIdOrFail({ id: templateId, userId });

  if (template.malwareScanStatus !== MalwareScanStatus.clean) {
    throw new ConflictError({ message: ErrorMessage.templateInfected });
  }

  const renderedTemplate = await renderHtmlTemplate(template, data);

  const pdf = await createPdfFromHtml(renderedTemplate);

  return pdf;
}
