import { AlbResource } from './alb';
import { AlbController } from './aws-load-balancer-controller';
import { clusterProvider } from '../iam';
import { Output } from '@pulumi/pulumi';
import { clusterName } from '@/index';
import {
  chartVersionAlbController,
  appsNodeGroupConfig,
  clusterNamespace
} from '../config';
import { argoServiceName, argoNodePort } from '../config';

const albController = new AlbController('amazon-lb-controller', {
  provider: clusterProvider,
  labels: appsNodeGroupConfig.labels,
  clusterName: clusterName as Output<string>,
  clusterNamespace: clusterNamespace,
  version: chartVersionAlbController
});

const albResource = new AlbResource('alb-resource', {
  provider: clusterProvider,
  labels: appsNodeGroupConfig.labels,
  services: [
    {
      name: argoServiceName,
      port: argoNodePort
    }
  ]
});

export { albResource, albController };
