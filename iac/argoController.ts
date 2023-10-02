import * as k8s from '@pulumi/kubernetes';

interface NewArgoControllerArgs {
  namespace: k8s.core.v1.Namespace;
  port: number;
  portForward: boolean;
  provider?: k8s.Provider;
}

export const newArgoController = (args: NewArgoControllerArgs) => { 
  const opts = args.provider
      ? { provider: args.provider }
      : { }
  // Install the Argo Workflows Helm chart
  const argoChart = new k8s.helm.v3.Chart(
    'argo',
    {
      chart: 'argo-workflows',
      fetchOpts: { repo: 'https://argoproj.github.io/argo-helm' },
      namespace: args.namespace.metadata.name,
      values: {
        server: {
          extraArgs: ['--auth-mode=server']
        }
      }, 
    },
    {dependsOn: [args.namespace], ...opts}
    
  );
 
};
