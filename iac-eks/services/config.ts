import { Config, getStack, getProject, StackReference } from "@pulumi/pulumi";
import { Region } from "@pulumi/aws";
interface EksNodeGroupConfig {
  labels: { [key: string]: string };
}

const projectName = getProject();
const stackName = getStack();

// get this stack's config
const awsConfig = new Config("aws");
const awsRegion: Region = awsConfig.require("region");
const config = new Config();
const orgName = config.get("org") || "";
const chartVersionAlbController = config.require("chartVersionAlbController");
const argoNodePort = config.requireNumber("argoNodePort");
const appsNodeGroupConfig: EksNodeGroupConfig = config.requireObject(
  "clusterNodeGroupApps",
);

// Reference our other stacks for outputs
const clusterStackName = config.require("clusterStackName");
const clusterRef = new StackReference(
  `${orgName === "" ? "/" : orgName + "/"}${clusterStackName}/${stackName}`,
);
const argoDasfStackName = config.require("argoDasfStackName");
const argoDasfStackRef = new StackReference(
  `${orgName === "" ? "/" : orgName + "/"}${argoDasfStackName}/${stackName}`,
);
const autoscalerStackName = config.require("autoscalerStackName");
const autoscalerStackRef = new StackReference(
  `${orgName === "" ? "/" : orgName + "/"}${autoscalerStackName}/${stackName}`,
);
// And the following information about the stacks
const albSecurityGroupId = clusterRef.requireOutput("albSecurityGroupId");
const kubeconfig = clusterRef.requireOutput("kubeconfig");
const clusterName = clusterRef.requireOutput("clusterName");
const subnetIds = clusterRef.requireOutput("subnetIds");
const vpcId = clusterRef.requireOutput("vpcId");

const clusterNamespaceName = autoscalerStackRef.requireOutput(
  "clusterNamespaceName",
);

const argoServiceName = argoDasfStackRef.requireOutput("argoServiceName");

export {
  projectName,
  stackName,
  albSecurityGroupId,
  chartVersionAlbController,
  kubeconfig,
  clusterNamespaceName,
  clusterName,
  argoNodePort,
  argoServiceName,
  awsRegion,
  vpcId,
  appsNodeGroupConfig,
  subnetIds,
};
