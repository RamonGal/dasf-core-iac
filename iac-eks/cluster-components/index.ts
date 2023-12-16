import { ClusterAutoscaler } from './cluster-autoscaler';
import { DaskOperator } from './dask-operator';
import { ArgoOperator } from './argo-operator';
import { DaskServiceAccount } from './dask-rbac-role';
import { Output } from '@pulumi/pulumi';
import { ClusterAutoscalerRole, clusterProvider, provider } from '../iam';
import {
  stackName,
  projectName,
  awsRegion,
  imageTagClusterAutoscaler,
  chartVersionClusterAutoscaler,
  clusterNamespace,
  chartVersionDaskOperator,
  chartVersionArgoController,
  appsNodeGroupConfig,
  argoNodePort,
  argoServiceName
} from '../config';
import { clusterName, clusterAutoScalerRoleArn } from '../index';

const clusterAutoScaler = new ClusterAutoscaler('cluster-autoscaler', {
  provider: clusterProvider,
  clusterName: clusterName as Output<string>,
  serviceAccountRoleArn: clusterAutoScalerRoleArn as Output<string>,
  serviceAccountName: 'cluster-autoscaler-sa',
  region: awsRegion,
  version: chartVersionClusterAutoscaler,
  imageTag: imageTagClusterAutoscaler,
  clusterNamespace: clusterNamespace,
  labels: appsNodeGroupConfig.labels
});   

const daskServiceAccount = new DaskServiceAccount('dask-service-account', {
  provider: clusterProvider,
  clusterNamespace: clusterNamespace
});

const daskServiceAccountName = daskServiceAccount.saName;

const daskOperator = new DaskOperator('dask-operator', {
  provider: clusterProvider,
  clusterNamespace: clusterNamespace,
  labels: appsNodeGroupConfig.labels,
  version: chartVersionDaskOperator,
  dependsOn: [daskServiceAccount, clusterAutoScaler]
});

const argoOperator = new ArgoOperator('argo-operator', {
  serviceName: argoServiceName,
  serviceAccountName: daskServiceAccountName,
  provider: clusterProvider,
  nodePort: argoNodePort,
  clusterNamespace: clusterNamespace,
  labels: appsNodeGroupConfig.labels,
  version: chartVersionArgoController,
  dependsOn: [daskServiceAccount, daskOperator]
});

export {
  ClusterAutoscaler,
  DaskOperator,
  ArgoOperator,
  DaskServiceAccount,
  daskServiceAccountName,
   
};
