import * as pulumi from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';

interface gatewayConfig {
  namespace: string;
  provider?: k8s.Provider;
}

export const newGateway = (config: gatewayConfig) => {
  const namespaceArgs: k8s.core.v1.NamespaceArgs = {};
  const namespaceOpts: pulumi.CustomResourceOptions = config.provider
    ? { provider: config.provider }
    : {};

  const namespace = new k8s.core.v1.Namespace(
    config.namespace,
    namespaceArgs,
    namespaceOpts
  );

  const chartArgs = {
    chart: 'dask-gateway',
    fetchOpts: {
      repo: 'https://helm.dask.org'
    },
    namespace: namespace.metadata.name, 
  };
  const chartOpts: pulumi.ComponentResourceOptions = config.provider
    ? { provider: config.provider }
    : {};

  const daskGatewayChart = new k8s.helm.v3.Chart(
    'dask-gateway',
    chartArgs,
    chartOpts
  );
  return {
    namespace: namespace.metadata.name
  };
};
