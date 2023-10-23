import * as k8s from '@pulumi/kubernetes';

interface NewArgoControllerArgs {
  namespace: k8s.core.v1.Namespace;
  port: number;
  serviceAccount: k8s.core.v1.ServiceAccount;
  daskOperator: k8s.helm.v3.Chart;
}

export const newArgoController = (args: NewArgoControllerArgs) => {
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
        },
        serviceAccount: {
          name: args.serviceAccount.metadata.name
        }
      }
    },
    { dependsOn: [args.namespace, args.serviceAccount, args.daskOperator] }
  );
};
