import { ManagedNodeGroup } from '@pulumi/eks';
import {
  // all,
  interpolate
} from '@pulumi/pulumi';

import { provider, eksWorkerRole } from '../iam';
import {
  clusterSecurityGroup,
  appsSecurityGroup,
  WorkerLaunchTemplate
} from '../ec2';
import { cluster, clusterName } from '../eks';
import { appsPrivateSubnetIds } from '../vpc';
import { stackName, projectName, appsNodeGroupConfig } from '../config';

const appsLaunchTemplate = new WorkerLaunchTemplate(
  `${projectName}-${stackName}-${appsNodeGroupConfig.name}`,
  {
    provider: provider,
    clusterName: cluster.eksCluster.name,
    labels: appsNodeGroupConfig.labels,
    instanceType: appsNodeGroupConfig.instanceType,
    securityGroups: [appsSecurityGroup.id]
  }
);

// Create a nodegroup for application workloads, passing in tagged subnets
const appsNodeGroup = new ManagedNodeGroup(
  `${projectName}-${stackName}-${appsNodeGroupConfig.name}-nodegroup`,
  {
    cluster: cluster,
    version: cluster.eksCluster.version,
    nodeRoleArn: eksWorkerRole.role.arn,
    scalingConfig: {
      desiredSize: appsNodeGroupConfig.desiredCapacity || 3,
      minSize: appsNodeGroupConfig.minSize || 1,
      maxSize: appsNodeGroupConfig.maxSize || 7
    },
    instanceTypes: [appsNodeGroupConfig.instanceType],

    subnetIds: appsPrivateSubnetIds,
    launchTemplate: {
      id: appsLaunchTemplate.id,
      version: interpolate`${appsLaunchTemplate.latestVersion}`
    },
    labels: appsNodeGroupConfig.labels
  },
  {
    provider: provider,
    dependsOn: [clusterSecurityGroup, eksWorkerRole]
  }
);

export { appsNodeGroup };
