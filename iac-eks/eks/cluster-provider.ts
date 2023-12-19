import { Provider, core } from "@pulumi/kubernetes";
import { cluster } from "../eks";
import { projectName, stackName } from "../config";

const clusterProvider = new Provider(
  `${projectName}-${stackName}-cluster-provider`,
  {
    kubeconfig: cluster.kubeconfig,
  },
  {
    dependsOn: [cluster],
  },
);

// create a namespace for the cluster
const clusterNamespace = new core.v1.Namespace(
  `${projectName}-${stackName}-cluster-namespace`,
  {
    metadata: {
      name: `${projectName}-${stackName}-cluster-namespace`,
    },
  },
  {
    provider: clusterProvider,
  },
);

const clusterNamespaceName = clusterNamespace.metadata.name;
export { clusterProvider, clusterNamespaceName };
