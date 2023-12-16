import { runtime } from '@pulumi/pulumi';
import { Provider } from '@pulumi/aws';
import { PulumiRole } from './roles';

import { projectName, stackName, awsRegion, defaultTags } from '../config';

const pulumiRole = new PulumiRole(`${projectName}-${stackName}-role`);

// Create a provider for this region and assume pulumi role
const provider = new Provider(`${projectName}-${stackName}-provider`, {
  region: awsRegion,
  assumeRole: {
    roleArn: pulumiRole.role.arn.apply(async (arn) => {
      if (!runtime.isDryRun()) {
        await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
      }
      return arn;
    }),
    sessionName: 'PulumiSession',
    externalId: 'PulumiApplication'
  },
  defaultTags: defaultTags
});

export { pulumiRole, provider };
