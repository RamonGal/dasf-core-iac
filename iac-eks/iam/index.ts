import { EksWorkerRole, EksClusterRole, ClusterAutoscalerRole } from "./roles";
import { stackName, projectName } from "../config";

const eksClusterRole = new EksClusterRole(
  `${projectName}-${stackName}-cluster-role`,
);

const eksWorkerRole = new EksWorkerRole(
  `${projectName}-${stackName}-worker-role`,
);

export { ClusterAutoscalerRole, eksWorkerRole, eksClusterRole };
