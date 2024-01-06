import { Provider, core } from "@pulumi/kubernetes";
import { projectName, stackName, kubeconfig } from "../config";

const clusterProvider = new Provider(
  `${projectName}-${stackName}-cluster-provider`,
  {
    kubeconfig: kubeconfig,
  },
);

// create a namespace for the cluster
const clusterNamespace = new core.v1.Namespace(
  `dasf-cluster-namespace`,
  {
    metadata: {
      name: `dasf-cluster-namespace`,
    },
  },
  {
    provider: clusterProvider,
  },
);

const clusterNamespaceName = clusterNamespace.metadata.name;
export { clusterProvider, clusterNamespaceName };
