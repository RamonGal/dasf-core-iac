import { appsNodeGroup } from "./nodegroups";
import { cluster } from "./cluster";
import { clusterProvider, clusterNamespaceName } from "./cluster-provider";

const clusterKubeconfig = cluster.kubeconfig.apply(JSON.stringify);
const clusterName = cluster.eksCluster.name;
export {
  appsNodeGroup,
  cluster,
  clusterKubeconfig,
  clusterName,
  clusterProvider,
  clusterNamespaceName,
};
