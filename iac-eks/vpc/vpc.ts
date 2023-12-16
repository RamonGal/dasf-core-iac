import { ec2 } from '@pulumi/awsx';
import { Provider } from '@pulumi/aws';

import {
  projectName,
  stackName,
  vpcCidrBlock,
  awsRegion,
  protectVpc,
  defaultTags
} from '../config';

const vpc = new ec2.Vpc(
  `${projectName}-${stackName}-vpc`,
  {
    cidrBlock: vpcCidrBlock,
    numberOfAvailabilityZones: 4,
    subnets: [
      {
        type: 'public',
        name: 'apps',
        cidrMask: 26,
        tags: {
          'kubernetes.io/role/elb': '1'
        }
      },
      {
        type: 'private',
        name: 'apps',
        cidrMask: 25,
        tags: {
          'kubernetes.io/role/internal-elb': '1'
        }
      }
    ],
    tags: {
      Name: `${projectName}-${stackName}-vpc`
    }
  },
  {
    provider: new Provider(`${projectName}-${stackName}-vpc-provider`, {
      region: awsRegion,
      defaultTags: defaultTags
    }),
    protect: protectVpc
  }
);

export { vpc };
