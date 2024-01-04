import { clusterNamespaceName } from "./eks";
import { ecrRepoUrl } from "./ecr";
import { createArgoDasfFramework, createClusterAutoscalerRole } from "./cluster-components";

const framework = createArgoDasfFramework();
createClusterAutoscalerRole();
const argoServiceName = framework.argoOperator.fullname;

export { clusterNamespaceName, ecrRepoUrl, argoServiceName };
