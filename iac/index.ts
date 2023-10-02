
import { newArgoController } from './argoController';
import { createDaskOperator } from './daskOperator';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
export const namespaceDasf = config.require('namespace');
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

const namespaceArgs: k8s.core.v1.NamespaceArgs = {};
const namespaceOpts: pulumi.CustomResourceOptions = provider
  ? { provider: provider }
  : {};

const namespace = new k8s.core.v1.Namespace(
  namespaceDasf,
  namespaceArgs,
  namespaceOpts
);

export const namespaceName = namespace.metadata.name;
createDaskOperator({
  namespace: namespace,
  releaseName: 'dask-operator',
  provider: provider
});


// Create an argo controller
newArgoController({
  namespace: namespace,
  port: 2746,
  provider: provider,
  portForward: true
});