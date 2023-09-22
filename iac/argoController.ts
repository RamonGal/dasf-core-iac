import * as k8s from '@pulumi/kubernetes';
import { spawn } from 'child_process';
import * as pulumi from '@pulumi/pulumi';

interface NewArgoControllerArgs {
  namespace: string;
  port: number;
  portForward: boolean;
  provider?: k8s.Provider;
}

export const newArgoController = (args: NewArgoControllerArgs) => {
  // Create a namespace
  const namespace = new k8s.core.v1.Namespace('argo', {
    metadata: { name: args.namespace }
  });

  // Install the Argo Workflows Helm chart
  const argoChart = new k8s.helm.v3.Chart(
    'argo',
    {
      chart: 'argo-workflows',
      fetchOpts: { repo: 'https://argoproj.github.io/argo-helm' },
      namespace: namespace.metadata.name,
      values: {
        server: {
          extraArgs: ['--auth-mode=server']
        }
      }
    },
    { dependsOn: [namespace] }
  );

  // Output the namespace name
  return {
    namespace: namespace.metadata.name
  };
};
