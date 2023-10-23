import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

interface ClusterConfig {
  namespace: k8s.core.v1.Namespace;
  releaseName: string; 
}

export const createDaskOperator = (args: ClusterConfig):k8s.helm.v3.Chart => {
  
  const argoChart = new k8s.helm.v3.Chart(
    'dask',
    {
      chart: 'dask-kubernetes-operator',
      version: '2023.10.0', // replace with the chart version you want to use
      fetchOpts: {
        repo: 'https://helm.dask.org/'
      },
      namespace: args.namespace.metadata.name,
      
    },
    {dependsOn: [args.namespace]}
  );
  return argoChart;
};
