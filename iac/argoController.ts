import * as k8s from '@pulumi/kubernetes';

interface NewArgoControllerArgs {
  namespace: string;
  provider?: k8s.Provider;
}

export const newArgoController = (args: NewArgoControllerArgs) => {
  const opts = args.provider ? { provider: args.provider } : {};
  const argoCdChart = new k8s.helm.v3.Chart(
    'argo-cd',
    {
      repo: 'argo',
      chart: 'argo-cd',
      version: '2.4.9',
      transformations: [
        (obj: any) => {
          if (obj.metadata) {
            obj.metadata.namespace = args.namespace; // set the namespace
          }
        }
      ]
    },
    opts
  );

  return argoCdChart
    .getResourceProperty('v1/Service', 'argo-cd-argo-cd-server', 'status')
    .apply((status) => status.loadBalancer.ingress[0].ip);
};
