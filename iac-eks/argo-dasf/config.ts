import { Config, getStack, getProject, StackReference } from "@pulumi/pulumi";
import { Region, iam } from "@pulumi/aws";
interface EksNodeGroupConfig {
  labels: { [key: string]: string };
}

const projectName = getProject();
const stackName = getStack();
const awsConfig = new Config("aws");
const awsRegion: Region = awsConfig.require("region");
const config = new Config();
const orgName = config.get("org") || "";
const appsNodeGroupConfig: EksNodeGroupConfig = config.requireObject(
  "clusterNodeGroupApps",
);
const chartVersionClusterAutoscaler = config.require(
  "chartVersionClusterAutoscaler",
);
const chartVersionDaskOperator = config.require("chartVersionDaskOperator");
const chartVersionArgoController = config.require("chartVersionArgoController");
const imageTagClusterAutoscaler = config.require("imageTagClusterAutoscaler");
const clusterNamespace = config.require("clusterNamespace");
const argoServiceName = config.require("argoServiceName");
const argoNodePort = config.requireNumber("argoNodePort");

// Reference our other stacks for outputs
const clusterStackName = config.require("clusterStackName");
const clusterRef = new StackReference(
  `${orgName === "" ? "/" : orgName + "/"}${clusterStackName}/${stackName}`,
);
// And the following information about the stacks
const kubeconfig = clusterRef.requireOutput("kubeconfig");
const clusterName = clusterRef.requireOutput("clusterName");
const oidcProviderUrl = clusterRef.requireOutput("oidcProviderUrl");
const oidcProviderArn = clusterRef.requireOutput("oidcProviderArn");

export {
  projectName,
  stackName,
  chartVersionClusterAutoscaler,
  chartVersionDaskOperator,
  chartVersionArgoController,
  oidcProviderUrl,
  oidcProviderArn,
  imageTagClusterAutoscaler,
  appsNodeGroupConfig,
  clusterNamespace,
  awsRegion,
  argoNodePort,
  argoServiceName,
  kubeconfig,
  clusterName,
};
