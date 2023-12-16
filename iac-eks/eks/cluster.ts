import { Cluster } from '@pulumi/eks';
import { all } from '@pulumi/pulumi';
import { eksClusterRole, eksWorkerRole, provider, pulumiRole } from '../iam';
import { clusterKmsKey } from '../kms';
import { vpc, appsPublicSubnetIds, appsPrivateSubnetIds } from '../vpc';
import { clusterSecurityGroup } from '../ec2';
import { stackName, projectName, clusterConfig, clusterName } from '../config';

const cluster = new Cluster(
  clusterName,
  {
    endpointPrivateAccess: clusterConfig.endpointPrivateAccess || true,
    endpointPublicAccess: clusterConfig.endpointPublicAccess || true,
    createOidcProvider: true,
    enabledClusterLogTypes: clusterConfig.enabledClusterLogTypes || [
      'api',
      'audit'
    ],
    skipDefaultNodeGroup: clusterConfig.skipDefaultNodeGroup || true,
    version: clusterConfig.version || '1.22',
    nodeAssociatePublicIpAddress:
      clusterConfig.nodeAssociatePublicIpAddress || false,
    publicSubnetIds: appsPublicSubnetIds,
    privateSubnetIds: appsPrivateSubnetIds,
    encryptionConfigKeyArn: clusterKmsKey.arn,
    clusterSecurityGroup: clusterSecurityGroup.securityGroup,
    providerCredentialOpts: { roleArn: pulumiRole.role.arn },
    serviceRole: eksClusterRole.role,
    instanceRole: eksWorkerRole.role,
    vpcId: vpc.id
  },
  { provider: provider, dependsOn: [eksClusterRole, eksWorkerRole] }
);

export { cluster, clusterName };
