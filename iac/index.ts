import { newArgoController } from './argoController';
import { createDaskOperator } from './daskOperator';
import { createDaskServiceAccount } from './daskRole';
import { createDasfPod } from './dasfPod';
import { createNFSVolume } from './nfsVolume';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
export const namespaceDasf = config.require('namespace');
export const operator = config.requireBoolean('operator');
export const nfsVolume = config.requireBoolean('nfsVolume');
export const argo = config.requireBoolean('argo');

// define the k8s provider

const namespaceArgs: k8s.core.v1.NamespaceArgs = {};

const namespace = new k8s.core.v1.Namespace(namespaceDasf, namespaceArgs);

export const namespaceName = namespace.metadata.name;

const serviceAccount = createDaskServiceAccount(namespace);

export const serviceAccountName = serviceAccount.metadata.name;

if (operator) {
  createDaskOperator({
    namespace: namespace,
    releaseName: 'dask-operator'
  });
} 

if (argo) {
  newArgoController({
    namespace: namespace,
    port: 2746,
    serviceAccount: serviceAccount, 
  });
}

// } else {
//   createDasfPod({
//     namespace: namespace,
//     releaseName: 'dasf',
//     serviceAccount: serviceAccount,
//     daskOperator: daskOperator,
//     command: ['sleep', '3000']
//   });
// }

if (nfsVolume) {
  createNFSVolume({
    namespace: namespace,
    port: 2049,
    serviceAccount: serviceAccount, 
  });
}
