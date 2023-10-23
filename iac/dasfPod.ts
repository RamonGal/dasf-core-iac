import * as pulumi from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';

interface NewDasfPodArgs {
  namespace: k8s.core.v1.Namespace;
  releaseName: string;
  serviceAccount: k8s.core.v1.ServiceAccount;
  daskOperator: k8s.helm.v3.Chart;
  command: string[];
}

export const createDasfPod = (args: NewDasfPodArgs) => {
  const pod = new k8s.core.v1.Pod(
    args.releaseName,
    {
      metadata: {
        name: args.releaseName,
        namespace: args.namespace.metadata.name
      },
      spec: {
        serviceAccountName: args.serviceAccount.metadata.name,
        containers: [
          {
            name: 'dasf',
            image: 'dasf:cpu',
            resources: {
              requests: {
                memory: '2Gi',
                cpu: '1'
              },
              limits: {
                memory: '4Gi',
                cpu: '2'
              }
            },
            command: args.command,
            env: [  // Adding the environment variable here
              {
                name: 'NAMESPACE',
                value: args.namespace.metadata.name,
              },
              {
                name: 'IMAGE_DASK',
                value: 'dasf:cpu',
              },
            ],
          }
        ]
      }
    },
    { dependsOn: [args.namespace, args.serviceAccount, args.daskOperator] }
  );
};
