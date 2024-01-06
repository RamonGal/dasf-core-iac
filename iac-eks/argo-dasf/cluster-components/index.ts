import { DaskOperator } from "./dask-operator";
import { ArgoOperator } from "./argo-operator";
import { DaskServiceAccount } from "./dask-rbac-role";
import {createNFSVolume} from "./nfs-volume";
import {
  chartVersionDaskOperator,
  chartVersionArgoController,
  appsNodeGroupConfig,
  argoNodePort,
  argoServiceName,clusterNamespaceName
} from "../config";
import { clusterProvider } from "../eks"; 
import { Output } from "@pulumi/pulumi";

const createArgoDasfFramework = () => {
  const daskServiceAccount = new DaskServiceAccount("dask-service-account", {
    provider: clusterProvider,
    clusterNamespace: clusterNamespaceName as Output<string>,
  });

  const daskServiceAccountName = daskServiceAccount.saName;

  const daskOperator = new DaskOperator("dask-operator", {
    provider: clusterProvider,
    clusterNamespace: clusterNamespaceName as Output<string>,
    labels: appsNodeGroupConfig.labels,
    version: chartVersionDaskOperator,
    dependsOn: [daskServiceAccount],
  });

  const argoOperator = new ArgoOperator("argo-operator", {
    serviceName: argoServiceName,
    serviceAccountName: daskServiceAccountName,
    provider: clusterProvider,
    nodePort: argoNodePort,
    clusterNamespace: clusterNamespaceName as Output<string>,
    labels: appsNodeGroupConfig.labels,
    version: chartVersionArgoController,
    dependsOn: [daskServiceAccount, daskOperator],
  });

  createNFSVolume({
    namespace: clusterNamespaceName as Output<string>,
    port: 2049, 
    provider: clusterProvider,
  });

  return {
    daskOperator,
    argoOperator,
    daskServiceAccount,
    daskServiceAccountName,
  };
};

export { createArgoDasfFramework, createNFSVolume  };
