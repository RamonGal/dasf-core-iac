import { Provider } from '@pulumi/kubernetes';
import { clusterKubeconfig } from '../index';
import { projectName, stackName } from '../config';
import { provider } from '../iam';

const clusterProvider = new Provider(
  `${projectName}-${stackName}-cluster-provider`,
  {
    kubeconfig: clusterKubeconfig
  },
  { provider: provider }
);

export { clusterProvider };
