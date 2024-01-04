import { appsNodeGroup } from "./nodegroups";
import { cluster } from "./cluster";

const clusterName = cluster.eksCluster.name;
const kubeconfig = cluster.kubeconfig;
export { appsNodeGroup, cluster, kubeconfig, clusterName };
