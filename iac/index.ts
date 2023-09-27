import { newGateway } from './daskGateway';
import { createDaskCluster } from './daskCluster';
import { newArgoController } from './argoController';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const namespaceArgo = config.require('namespaceArgo');
const namespaceGateway = config.require('namespaceGateway');
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

// export const gateway = newGateway({
//   namespace: namespaceGateway,
//   provider: provider
// });

// Create an argo controller
export const argoController = newArgoController({
  namespace: namespaceArgo,
  port: 2746,
  provider: provider,
  portForward: true
});

// export const cluster = createDaskCluster({
//   namespace: 'dask-cluster',
//   replicas: 2,
//   releaseName: 'dask-cluster',
//   provider: provider
// });
