import { newArgoController } from './argoController';
import { createDaskOperator } from './daskOperator';
import { createDaskServiceAccount } from './daskRole';
import { createDasfPod } from './dasfPod';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
export const namespaceDasf = config.require('namespace');
export const operator = config.requireBoolean('operator');

// define the k8s provider

const namespaceArgs: k8s.core.v1.NamespaceArgs = {};

const namespace = new k8s.core.v1.Namespace(namespaceDasf, namespaceArgs);

export const namespaceName = namespace.metadata.name;

const serviceAccount = createDaskServiceAccount(namespace);

const daskOperator = createDaskOperator({
  namespace: namespace,
  releaseName: 'dask-operator'
});

if (!operator) {
  newArgoController({
    namespace: namespace,
    port: 2746,
    serviceAccount: serviceAccount,
    daskOperator: daskOperator
  });
} else {
  createDasfPod({
    namespace: namespace,
    releaseName: 'dasf',
    serviceAccount: serviceAccount,
    daskOperator: daskOperator,
    command: ['sleep', '3000']
  });
}
// Create an argo controller
