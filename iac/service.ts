import * as k8s from '@pulumi/kubernetes';
import { Service } from '@pulumi/kubernetes/core/v1';

interface ServiceArgs {
  labels: { [key: string]: string };
  port: number;
  targetPort: number;
  namespace: string;
  name?: string;
  protocol?: string;
  type?: string;
}

export const newService = (args: ServiceArgs) => {
  return new k8s.core.v1.Service('my-app-svc', {
    metadata: { labels: args.labels, namespace: args.namespace },
    spec: {
      type: args.type || 'NodePort',
      ports: [
        {
          port: args.port,
          targetPort: args.targetPort,
          protocol: args.protocol || 'TCP',
          name: args.name || 'http'
        }
      ],
      selector: args.labels
    }
  });
};
