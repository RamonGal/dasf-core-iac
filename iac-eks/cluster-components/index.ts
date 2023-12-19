import { DaskOperator } from "./dask-operator";
import { ArgoOperator } from "./argo-operator";
import { DaskServiceAccount } from "./dask-rbac-role";
import {
  chartVersionAlbController,
  clusterNamespace,
  chartVersionDaskOperator,
  chartVersionArgoController,
  appsNodeGroupConfig,
  argoNodePort,
  argoServiceName,
} from "../config";
import { clusterName, clusterProvider, clusterNamespaceName } from "../eks";
import { AlbResource, AlbController } from "../alb";
import { clusterAutoscalerRole } from "./cluster-autoscaler";

const daskServiceAccount = new DaskServiceAccount("dask-service-account", {
  provider: clusterProvider,
  clusterNamespace: clusterNamespace,
});

const daskServiceAccountName = daskServiceAccount.saName;

const daskOperator = new DaskOperator("dask-operator", {
  provider: clusterProvider,
  clusterNamespace: clusterNamespace,
  labels: appsNodeGroupConfig.labels,
  version: chartVersionDaskOperator,
  dependsOn: [daskServiceAccount],
});

const argoOperator = new ArgoOperator("argo-operator", {
  serviceName: argoServiceName,
  serviceAccountName: daskServiceAccountName,
  provider: clusterProvider,
  nodePort: argoNodePort,
  clusterNamespace: clusterNamespace,
  labels: appsNodeGroupConfig.labels,
  version: chartVersionArgoController,
  dependsOn: [daskServiceAccount, daskOperator],
});

const albController = new AlbController("amazon-lb-controller", {
  provider: clusterProvider,
  labels: appsNodeGroupConfig.labels,
  clusterName: clusterName,
  clusterNamespace: clusterNamespaceName,
  version: chartVersionAlbController,
  dependsOn: [
    daskOperator,
    argoOperator,
    daskServiceAccount,
  ],
});

const albResource = new AlbResource("alb-resource", {
  provider: clusterProvider,
  labels: appsNodeGroupConfig.labels,
  services: [
    {
      name: 'argo-workflows-argo-server',
      port: argoNodePort,
    },
  ],
  dependsOn: [
    daskOperator,
    argoOperator,
    daskServiceAccount,
  ],
});

export {
  daskOperator,
  argoOperator,
  daskServiceAccount,
  daskServiceAccountName,
  clusterAutoscalerRole,
};
