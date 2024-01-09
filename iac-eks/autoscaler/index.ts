import { clusterNamespaceName } from "./eks";
import { createClusterAutoscalerRole } from "./cluster-components";
import {
    chartVersionClusterAutoscaler
} from './config';

const serviceAccountName = createClusterAutoscalerRole();

export { clusterNamespaceName ,chartVersionClusterAutoscaler,  serviceAccountName};
