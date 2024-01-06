import { clusterNamespaceName } from "./eks";
import { createClusterAutoscalerRole } from "./cluster-components";

const serviceAccountName = createClusterAutoscalerRole();

export { clusterNamespaceName , serviceAccountName};
