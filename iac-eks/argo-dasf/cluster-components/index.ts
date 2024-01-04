import { DaskOperator } from "./dask-operator";
import { ArgoOperator } from "./argo-operator";
import { DaskServiceAccount } from "./dask-rbac-role";
import {
  chartVersionDaskOperator,
  chartVersionArgoController,
  appsNodeGroupConfig,
  argoNodePort,
  argoServiceName,
} from "../config";
import { clusterProvider, clusterNamespaceName } from "../eks";
import { createClusterAutoscalerRole } from "./cluster-autoscaler";

const createArgoDasfFramework = () => {
  const daskServiceAccount = new DaskServiceAccount("dask-service-account", {
    provider: clusterProvider,
    clusterNamespace: clusterNamespaceName,
  });

  const daskServiceAccountName = daskServiceAccount.saName;

  const daskOperator = new DaskOperator("dask-operator", {
    provider: clusterProvider,
    clusterNamespace: clusterNamespaceName,
    labels: appsNodeGroupConfig.labels,
    version: chartVersionDaskOperator,
    dependsOn: [daskServiceAccount],
  });

  const argoOperator = new ArgoOperator("argo-operator", {
    serviceName: argoServiceName,
    serviceAccountName: daskServiceAccountName,
    provider: clusterProvider,
    nodePort: argoNodePort,
    clusterNamespace: clusterNamespaceName,
    labels: appsNodeGroupConfig.labels,
    version: chartVersionArgoController,
    dependsOn: [daskServiceAccount, daskOperator],
  });

  return {
    daskOperator,
    argoOperator,
    daskServiceAccount,
    daskServiceAccountName,
  };
};

export { createArgoDasfFramework, createClusterAutoscalerRole };
