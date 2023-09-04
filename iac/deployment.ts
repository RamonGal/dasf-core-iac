import * as k8s from '@pulumi/kubernetes';

export interface EnvVar {
  name: string;
  value: string;
}

interface DeploymentArgs {
  name: string;
  image: string;
  appLabels: { [key: string]: string };
  port: number;
  namespace: string;
  env?: EnvVar[];
  replicas?: number;
  protocol?: string;
  command?: string[];
  args?: string[];
  provider?: k8s.Provider;
}

export const newDeployment = (args: DeploymentArgs) => {
  const opts = args.provider ? { provider: args.provider } : {};
  return new k8s.apps.v1.Deployment(
    args.name,
    {
      metadata: {
        namespace: args.namespace,
        labels: args.appLabels
      },
      spec: {
        selector: { matchLabels: args.appLabels },
        replicas: args.replicas || 1,
        template: {
          metadata: { labels: args.appLabels },
          spec: {
            containers: [
              {
                name: args.name,
                image: args.image,
                ports: [
                  { containerPort: args.port, protocol: args.protocol || 'TCP' }
                ],
                command: args.command,
                env: args.env || [],
                args: args.args || []
              }
            ]
          }
        }
      }
    },
    opts
  );
};
