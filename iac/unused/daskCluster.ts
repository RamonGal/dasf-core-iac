import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

interface clusterConfig {
  namespace: k8s.core.v1.Namespace;
  replicas: number;
  releaseName: string;
  provider?: k8s.Provider;
}

export const createDaskCluster = (config: clusterConfig) => {
  // Create a scheduler
  const chartArgs = {
    chart: 'dask',
    fetchOpts: {
      repo: 'https://helm.dask.org'
    },
    values: {
      worker: {
        replicaCount: config.replicas
      }
    },
    namespace: config.namespace.metadata.name
  };
  const chartOpts: pulumi.ComponentResourceOptions = config.provider
    ? { provider: config.provider }
    : {};

  const daskClusterChart = new k8s.helm.v3.Chart(
    config.releaseName,
    chartArgs,
    chartOpts
  );
  return {
    namespace: config.namespace.metadata.name
  };
};
