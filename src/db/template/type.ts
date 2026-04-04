import { type PrimaryKey } from '../common/types/entity.type';

import { type MalwareScanStatus, type TemplateType } from './enum';

export type Template = {
  createdAt: Date;
  id: string;
  malwareScanStatus: MalwareScanStatus;
  name: string;
  s3Key: string;
  type: TemplateType;
  userId: string;
};

export type StoredTemplate = PrimaryKey &
  Omit<Template, 'createdAt'> & {
    createdAt: number;
  };
