import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output,
  log
} from '@pulumi/pulumi';
import { core, helm } from '@pulumi/kubernetes';
import { Region } from '@pulumi/aws';

interface ClusterAutoscalerArgs {
  provider: ProviderResource | undefined;
  clusterName: Output<string>;
  clusterNamespace: string;
  serviceAccountRoleArn: Output<string>;
  serviceAccountName: string;
  region: Region;
  version: string;
  imageTag: string;
  labels: { [workload: string]: string };
  dependsOn?: Resource[];
}

class ClusterAutoscaler extends ComponentResource {
  public readonly namespace: Output<string>;
  constructor(name: string, args: ClusterAutoscalerArgs) {
    super('cluster-components:ClusterAutoscaler', name);

    const provider = args.provider;
    const clusterName = args.clusterName;
    const serviceAccountRoleArn = args.serviceAccountRoleArn;
    const serviceAccountName = args.serviceAccountName;
    const region = args.region;
    const version = args.version;
    const imageTag = args.imageTag;
    const labels = args.labels;
    const dependsOn = args.dependsOn;
    const clusterNamespace = args.clusterNamespace;

      
    const namespace = new  core.v1.Namespace(clusterNamespace, undefined, { provider, parent: this });
    this.namespace = namespace.metadata.name;
    log.info(`namespace: ${namespace.metadata.name}`);
    const clusterAutoscalerServiceAccount = new core.v1.ServiceAccount(
      `${name}`,
      {
        metadata: {
          namespace: this.namespace,
          name: serviceAccountName,
          annotations: {
            'eks.amazonaws.com/role-arn': serviceAccountRoleArn
          }
        }
      },
      { provider, deleteBeforeReplace: true, parent: this }
    );

    const clusterAutoscaler = new helm.v3.Release(
      `${name}`,
      {
        namespace: clusterNamespace,
        createNamespace: false,
        chart: 'cluster-autoscaler',
        version: version,
        repositoryOpts: { repo: 'https://kubernetes.github.io/autoscaler' },
        values: {
          autoDiscovery: {
            clusterName: clusterName
          },
          awsRegion: region,
          cloudProvider: 'aws',
          image: { tag: imageTag },
          rbac: {
            serviceAccount: {
              create: false,
              name: clusterAutoscalerServiceAccount.metadata.name
            }
          },
          extraArgs: {
            expander: 'least-waste',
            'skip-nodes-with-system-pods': 'false',
            'aws-use-static-instance-list': 'true'
          },
          nodeSelector: labels
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

export { ClusterAutoscaler };
