import * as k8s from '@pulumi/kubernetes';
import { newDeployment } from './deployment';
import { newService } from './service';

interface clusterConfig {
  namespace: string;
  replicas: number;
  portScheduler: number;
  portWorker: number;
  portDasf: number;
  dasfImage: string;
  provider?: k8s.Provider;
}

export const createDaskCluster = (
  clusterConfig: clusterConfig
): k8s.apps.v1.Deployment[] => {
  // Create a scheduler
  const scheduler = newDeployment({
    name: 'dask-scheduler',
    image: 'ghcr.io/dask/dask',
    appLabels: { app: 'dask-scheduler' },
    port: clusterConfig.portScheduler,
    command: ['dask-scheduler'],
    namespace: clusterConfig.namespace,
    provider: clusterConfig.provider
  });

  // create workers
  const workers: k8s.apps.v1.Deployment[] = [];
  for (let i = 0; i < clusterConfig.replicas; i++) {
    const w = newDeployment({
      name: `dask-worker-${i}`,
      namespace: clusterConfig.namespace,
      image: 'ghcr.io/dask/dask',
      appLabels: { app: `dask-worker-${i}` },
      port: clusterConfig.portWorker,
      command: ['dask-worker', `dask-scheduler:${clusterConfig.portWorker}`]
    });
    workers.push(w);
  }

  // create dasf notebook
  const dasf = newDeployment({
    name: 'dasf-notebook',
    appLabels: { app: 'dasf-notebook' },
    namespace: clusterConfig.namespace,
    args: [
      'python3',
      '-m',
      'jupyterlab',
      '--allow-root',
      '--ServerApp.port',
      String(clusterConfig.portDasf),
      '--no-browser',
      "--ServerApp.ip='0.0.0.0'"
    ],
    port: clusterConfig.portDasf,
    env: [{ name: 'SHELL', value: '/bin/bash' }],
    image: clusterConfig.dasfImage
  });

  // create service for notebook
  const dasfService = newService({
    namespace: clusterConfig.namespace,
    labels: { app: 'dasf-notebook' },
    port: clusterConfig.portDasf,
    targetPort: clusterConfig.portDasf,
    protocol: 'TCP'
  });

  return [scheduler, ...workers, dasf];
};
