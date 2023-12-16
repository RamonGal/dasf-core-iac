import {
  Config,
  getStack,
  getProject,
  StackReference,
  OutputInstance,
  Input
} from '@pulumi/pulumi';

import { vpc } from './vpc';
import { getCallerIdentity, Region, ec2 } from '@pulumi/aws';
import { ProviderDefaultTags } from '@pulumi/aws/types/input';

interface EksNodeGroupConfig {
  name: string;
  version: Input<string> | undefined;
  instanceType: Input<ec2.InstanceType>;
  desiredCapacity: number;
  minSize: Input<number>;
  maxSize: Input<number>;
  labels: { [key: string]: string };
  registrationToken: Input<string>;
  encryptRootBockDevice: boolean;
}
export interface EksClusterConfig {
  cidrBlock: string;
  version: Input<string> | undefined;
  enabledClusterLogTypes: string[];
  skipDefaultNodeGroup: boolean;
  endpointPrivateAccess: boolean;
  endpointPublicAccess: boolean;
  nodeAssociatePublicIpAddress: boolean;
  createOidcProvider: boolean;
  deployDashbaord: boolean;
}

// Get project and stack name - for naming
const projectName = getProject();
const stackName = getStack();
const clusterName = `${projectName}-${stackName}-cluster`;

// Get the caller ID
const callerId = getCallerIdentity({}).then(
  (currentAwsIdentity) => currentAwsIdentity.accountId
);

// Get AWS config
const awsConfig = new Config('aws');
const awsRegion: Region = awsConfig.require('region');
const defaultTags: Input<ProviderDefaultTags> = (awsConfig.requireObject(
  'defaultTags'
) as Input<ProviderDefaultTags>) || {
  tags: {
    Env: 'unknown'
  }
};

// Get our config from Pulumi.<stack>.yaml
const pulumiConfig = new Config();
const clusterConfig: EksClusterConfig = pulumiConfig.requireObject('cluster');
const appsNodeGroupConfig: EksNodeGroupConfig = pulumiConfig.requireObject(
  'clusterNodeGroupApps'
);
const chartVersionAlbController = pulumiConfig.require(
  'chartVersionAlbController'
);
const chartVersionClusterAutoscaler = pulumiConfig.require(
  'chartVersionClusterAutoscaler'
);
const chartVersionDaskOperator = pulumiConfig.require(
  'chartVersionDaskOperator'
);
const chartVersionArgoController = pulumiConfig.require(
  'chartVersionArgoController'
);
const imageTagClusterAutoscaler = pulumiConfig.require(
  'imageTagClusterAutoscaler'
);
const clusterNamespace = pulumiConfig.require('clusterNamespace');
const argoNodePort = pulumiConfig.requireNumber('argoNodePort');
const argoServiceName = pulumiConfig.require('argoServiceName');
const vpcCidrBlock: string = pulumiConfig.require('cidrBlockVpc');
const protectVpc: boolean = pulumiConfig.getBoolean('protectVpc') || true;

export {
  awsRegion,
  protectVpc,
  projectName,
  vpcCidrBlock,
  stackName,
  callerId,
  defaultTags,
  clusterConfig,
  appsNodeGroupConfig,
  clusterNamespace,
  chartVersionArgoController,
  chartVersionDaskOperator,
  chartVersionClusterAutoscaler,
  argoNodePort,
  argoServiceName,
  imageTagClusterAutoscaler,
  chartVersionAlbController,
  clusterName
};
