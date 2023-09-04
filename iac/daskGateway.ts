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
    chart: config.namespace,
    fetchOpts: {
      repo: 'https://helm.dask.org'
    },
    namespace: config.namespace
  };
  const chartOpts: pulumi.ComponentResourceOptions = config.provider
    ? { provider: config.provider }
    : {};

  const daskGatewayChart = new k8s.helm.v3.Chart(
    'dask-gateway',
    chartArgs,
    chartOpts
  );
  const serviceName = pulumi.interpolate`traefik-${config.namespace}-${config.namespace}`;
  const gatewayService = k8s.core.v1.Service.get(
    'dask-gateway-service',
    pulumi.interpolate`${config.namespace}/${serviceName}`
  );
  return {
    loadBalancerIp: gatewayService.status.apply(
      (status) =>
        status.loadBalancer.ingress[0].ip ||
        status.loadBalancer.ingress[0].hostname
    ),
    ...daskGatewayChart
  };
};
