import { AccessLogsBucket } from './access-logs-bucket';
import { stackName, projectName } from '../config';
import { provider } from '../iam';

// Create an S3 bucket for ALB access logs
const accessLogsBucket = new AccessLogsBucket(
  `${projectName}-${stackName}-access-logs`,
  { provider: provider }
);

export { accessLogsBucket };
