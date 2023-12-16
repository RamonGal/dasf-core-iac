import { provider } from '../iam';
import { projectName, stackName } from '../config';
import { KmsKey } from './key';

const wafLogsKmsKey = new KmsKey(`${projectName}-${stackName}-waf-logs`, {
  provider: provider
});

const clusterKmsKey = new KmsKey(`${projectName}-${stackName}-cluster`, {
  provider: provider
});

export { wafLogsKmsKey, clusterKmsKey };
