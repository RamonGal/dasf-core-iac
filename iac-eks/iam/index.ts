import { EksWorkerRole, EksClusterRole, ClusterAutoscalerRole } from './roles';
import { provider, pulumiRole } from './provider';
import { clusterProvider } from './cluster-provider';
import { stackName, projectName } from '../config';

const eksClusterRole = new EksClusterRole(
  `${projectName}-${stackName}-cluster-role`,
  {
    provider: provider
  }
);

const eksWorkerRole = new EksWorkerRole(
  `${projectName}-${stackName}-worker-role`,
  {
    provider: provider
  }
);

export {
  provider,
  ClusterAutoscalerRole,
  clusterProvider,
  pulumiRole,
  eksWorkerRole,
  eksClusterRole
};
