import { ProviderResource, ComponentResource, Resource } from '@pulumi/pulumi';
import { helm } from '@pulumi/kubernetes';

interface DaskOperatorArgs {
  provider: ProviderResource | undefined;
  labels: { [key: string]: string };
  clusterNamespace: string;
  version: string;
  dependsOn?: Resource[];
}

class DaskOperator extends ComponentResource {
  constructor(name: string, args: DaskOperatorArgs) {
    super('cluster-components:DaskOperator', name);

    const provider = args.provider;
    const labels = args.labels;
    const version = args.version;
    const dependsOn = args.dependsOn;
    const clusterNamespace = args.clusterNamespace;

    const daskChart = new helm.v3.Release(
      `${name}`,
      {
        namespace: clusterNamespace,
        chart: 'dask-kubernetes-operator',
        repositoryOpts: {
          repo: 'https://helm.dask.org/'
        },
        version: version,
        values: {
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

export { DaskOperator };
