import { Provider, core } from "@pulumi/kubernetes";
import { projectName, stackName, kubeconfig } from "../config";

const clusterProvider = new Provider(
  `${projectName}-${stackName}-cluster-provider`,
  {
    kubeconfig: kubeconfig,
  },
);

export { clusterProvider };
