import { newGateway } from './daskGateway';
import { newArgoController } from './argoController';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const namespace = config.require('namespace');
const kubeconfig = config.require('kubeconfig');

// define the k8s provider
let provider: k8s.Provider | undefined;
if (kubeconfig !== 'false') {
  provider = new k8s.Provider('k8s', {
    kubeconfig: kubeconfig
  });
} else {
  provider = undefined;
}

// Create a dask gateway
const gateway = newGateway({ namespace: namespace, provider: provider });
export const gatewayLoadBalancerIp = gateway.loadBalancerIp;

// Create an argo controller
const argoController = newArgoController({
  namespace: namespace,
  provider: provider
});
export const argoControllerLoadBalancerIp = argoController;
