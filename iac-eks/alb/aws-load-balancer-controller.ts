import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output
} from '@pulumi/pulumi';
import { helm } from '@pulumi/kubernetes';

interface AlbControllerArgs {
  provider: ProviderResource | undefined;
  clusterName: Output<string>;
  clusterNamespace: string;
  labels: { [key: string]: string };
  version: string;
  dependsOn?: Resource[];
}

class AlbController extends ComponentResource {
  constructor(name: string, args: AlbControllerArgs) {
    super('cluster-components:AlbController', name);

    const provider = args.provider;
    const clusterName = args.clusterName;
    const labels = args.labels;
    const version = args.version;
    const dependsOn = args.dependsOn;
    const clusterNamespace = args.clusterNamespace;
    // Define our aws ingress ctlr. Helm Release
    const albController = new helm.v3.Release(
      `${name}`,
      {
        namespace: clusterNamespace,
        chart: 'aws-load-balancer-controller',
        version: version,
        repositoryOpts: { repo: 'https://aws.github.io/eks-charts' },
        values: {
          clusterName: clusterName,
          autoDiscoverAwsRegion: 'true',
          autoDiscoverAwsVpcID: 'true',
          nodeSelector: labels,
          serviceAnnotations: {
            'service.beta.kubernetes.io/aws-load-balancer-target-node-labels': `workload=${labels.workload}`
          }
        }
      },
      {
        provider: provider,
        dependsOn: dependsOn,
        parent: this
      }
    );
  }
}

export { AlbController };
