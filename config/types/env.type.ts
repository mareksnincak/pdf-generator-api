import { type Lambda } from '../../infra/cdk/enums/lambda.enum';

export type EnvVars = Map<Lambda, Record<string, string>>;
