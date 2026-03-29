import { type Lambda } from '../../infra/cdk/enums/lambda.enum';

export type EnvVars = Map<'global' | Lambda, Record<string, string>>;
