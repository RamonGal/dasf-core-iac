import { secret,log } from '@pulumi/pulumi';
import { accessLogsBucket } from './s3';
import { appsNodeGroup, cluster } from './eks';
import { awsRegion, projectName, stackName, clusterNamespace } from './config';
import { pulumiRole, ClusterAutoscalerRole, provider, clusterProvider } from './iam';  

// Outputs to use in components stack - and to connect to the cluster locally
const appsNodeGroupLabels = appsNodeGroup.nodeGroup.labels;
const clusterKubeconfig = secret(cluster.kubeconfig);
const region = awsRegion;
const roleArn = pulumiRole.role.arn;
const albLogsBucketName = accessLogsBucket.bucket;
const clusterName = cluster.eksCluster.name;

if (!cluster.core.oidcProvider) {
  throw new Error('no cluster oidc provider');
}
else{
   cluster.core.oidcProvider.arn.apply(arn => {
    log.info(`cluster.core.oidcProvider.arn: ${arn}`);
  });
}

const clusterAutoscalerRole = new ClusterAutoscalerRole(
  `${projectName}-${stackName}-ca-role`,
  {
    provider: provider,
    clusterName: clusterName,
    clusterNamespace: clusterNamespace,
    serviceAccountName: 'cluster-autoscaler-sa',
    clusterOidcProviderArn: cluster.core.oidcProvider.arn,
    clusterOidcProviderUrl: cluster.core.oidcProvider.url
  }
);

const clusterAutoScalerRoleArn = clusterAutoscalerRole.role.arn;

// Export all above outputs
export {
  appsNodeGroupLabels,
  clusterKubeconfig,
  region,
  roleArn,
  albLogsBucketName,
  clusterName,
  clusterAutoScalerRoleArn,
   
};
