import { type PrimaryKey } from '../common/types/entity.type';
import { type TemplateType } from './template.enum';

export type Template = { id: string; name: string; type: TemplateType };

export type StoredTemplate = Template & PrimaryKey;
