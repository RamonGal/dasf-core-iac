import { clusterName, kubeconfig, cluster } from "./eks";
import { albSecurityGroup, appsSecurityGroup,  } from "./ec2";
import { vpc } from "./vpc";

const albSecurityGroupId = albSecurityGroup.id;
const appsSecurityGroupId = appsSecurityGroup.id;
const oidcProviderUrl = cluster.core.oidcProvider?.url;
const oidcProviderArn = cluster.core.oidcProvider?.arn;
const vpcId = vpc.vpcId;
const subnetIds = cluster.core.publicSubnetIds; 

export {
  clusterName,
  kubeconfig,
  albSecurityGroupId,
  appsSecurityGroupId,
  oidcProviderUrl,
  oidcProviderArn,
  subnetIds,
  vpcId,
};
