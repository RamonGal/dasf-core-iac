import {
  clusterName,
  cluster,
  clusterProvider,
  clusterNamespaceName,
} from "./eks";
import { ecrRepo } from "./ecr";
import {
  daskServiceAccountName,
  daskOperator,
  argoOperator,
  clusterAutoscalerRole,
} from "./cluster-components";

export {
  clusterName,
  clusterNamespaceName,
  ecrRepo,
  clusterProvider,
  daskOperator,
  argoOperator,
  daskServiceAccountName,
};
