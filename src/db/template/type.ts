import { type PrimaryKey } from '../common/types/entity.type';

import { type TemplateType } from './enum';

export type Template = {
  id: string;
  name: string;
  type: TemplateType;
  s3Key: string;
  userId: string;
  createdAt: Date;
};

export type StoredTemplate = PrimaryKey &
  Omit<Template, 'createdAt'> & {
    createdAt: number;
  };
