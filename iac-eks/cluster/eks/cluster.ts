import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import { projectName, stackName, vpcNetworkCidr } from "../config";
import { eksWorkerRole, eksClusterRole } from "../iam";
import { clusterSecurityGroup } from "../ec2";
import { vpc } from "../vpc";

// Create the EKS cluster
const cluster = new eks.Cluster(`${projectName}-${stackName}-eks-cluster`, {
  // Put the cluster in the new VPC created earlier
  vpcId: vpc.vpcId,
  // Public subnets will be used for load balancers
  publicSubnetIds: vpc.publicSubnetIds,
  createOidcProvider: true,
  // Private subnets will be used for cluster nodes
  privateSubnetIds: vpc.privateSubnetIds,
  // Change configuration values to change any of the following settings
  skipDefaultNodeGroup: true,
  clusterSecurityGroup: clusterSecurityGroup,
  // Change these values for a private cluster (VPN access required)
  endpointPrivateAccess: false,
  endpointPublicAccess: true,
  serviceRole: eksClusterRole.role,
  instanceRole: eksWorkerRole.role,
});

export { cluster, vpcNetworkCidr };
