import { Config, getStack, getProject, Input } from "@pulumi/pulumi";
import { ec2, Region } from "@pulumi/aws";

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

const projectName = getProject();
const stackName = getStack();
const awsConfig = new Config("aws");
const awsRegion: Region = awsConfig.require("region");
const config = new Config();
const minClusterSize = config.getNumber("minClusterSize") || 3;
const maxClusterSize = config.getNumber("maxClusterSize") || 6;
const desiredClusterSize = config.getNumber("desiredClusterSize") || 3;
const eksNodeInstanceType = config.get("eksNodeInstanceType") || "t3.medium";
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";
const appsNodeGroupConfig: EksNodeGroupConfig = config.requireObject(
  "clusterNodeGroupApps",
);
const chartVersionAlbController = config.require("chartVersionAlbController");
const chartVersionClusterAutoscaler = config.require(
  "chartVersionClusterAutoscaler",
);
const chartVersionDaskOperator = config.require("chartVersionDaskOperator");
const chartVersionArgoController = config.require("chartVersionArgoController");
const imageTagClusterAutoscaler = config.require("imageTagClusterAutoscaler");
const clusterNamespace = config.require("clusterNamespace");
const argoNodePort = config.requireNumber("argoNodePort");
const argoServiceName = config.require("argoServiceName");
export {
  minClusterSize,
  maxClusterSize,
  projectName,
  stackName,
  desiredClusterSize,
  eksNodeInstanceType,
  vpcNetworkCidr,
  appsNodeGroupConfig,
  chartVersionAlbController,
  chartVersionClusterAutoscaler,
  chartVersionDaskOperator,
  chartVersionArgoController,
  imageTagClusterAutoscaler,
  clusterNamespace,
  argoNodePort,
  argoServiceName,
  awsRegion,
};
