import { clusterName, kubeconfig, cluster } from "./eks";
import { albSecurityGroup } from "./ec2"; 
import { vpc } from "./vpc";

const albSecurityGroupId = albSecurityGroup.id;
const oidcProviderUrl = cluster.core.oidcProvider?.url;
const oidcProviderArn = cluster.core.oidcProvider?.arn;
const vpcId = vpc.vpcId;
const subnetIds = cluster.core.publicSubnetIds;

export {
  clusterName,
  kubeconfig,
  albSecurityGroupId,
  oidcProviderUrl,
  oidcProviderArn,
  subnetIds,
  vpcId,
};
