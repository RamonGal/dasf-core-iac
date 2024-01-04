import { ManagedNodeGroup } from "@pulumi/eks";
import {
  // all,
  interpolate,
} from "@pulumi/pulumi";

import { eksWorkerRole } from "../iam";
import {
  clusterSecurityGroup,
  appsSecurityGroup,
  WorkerLaunchTemplate,
} from "../ec2";
import { cluster } from "./cluster";
import { vpc } from "../vpc";
import { stackName, projectName, appsNodeGroupConfig } from "../config";

const appsLaunchTemplate = new WorkerLaunchTemplate(
  `${projectName}-${stackName}-${appsNodeGroupConfig.name}`,
  {
    labels: appsNodeGroupConfig.labels,
    instanceType: appsNodeGroupConfig.instanceType,
    securityGroups: [appsSecurityGroup.id],
  },
);

// Create a nodegroup for application workloads, passing in tagged subnets
const appsNodeGroup = new ManagedNodeGroup(
  `${projectName}-${stackName}-${appsNodeGroupConfig.name}-nodegroup`,
  {
    cluster: cluster,
    nodeRoleArn: eksWorkerRole.role.arn,
    scalingConfig: {
      desiredSize: appsNodeGroupConfig.desiredCapacity || 3,
      minSize: appsNodeGroupConfig.minSize || 1,
      maxSize: appsNodeGroupConfig.maxSize || 7,
    },
    instanceTypes: [appsNodeGroupConfig.instanceType],

    subnetIds: vpc.privateSubnetIds,
    launchTemplate: {
      id: appsLaunchTemplate.id,
      version: interpolate`${appsLaunchTemplate.latestVersion}`,
    },
    labels: appsNodeGroupConfig.labels,
  },
  {
    dependsOn: [clusterSecurityGroup, eksWorkerRole, cluster],
  },
);
const appsNodeGroupLabels = appsNodeGroup.nodeGroup.labels;
export { appsNodeGroup, appsNodeGroupLabels };
