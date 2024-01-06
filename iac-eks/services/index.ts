import { Output } from "@pulumi/pulumi";
import { AlbController, AlbResource } from "./alb";
import { clusterProvider } from "./eks";
import {
  clusterName,
  clusterNamespaceName,
  chartVersionAlbController,
  appsNodeGroupConfig,
  argoServiceName,
  argoNodePort, 
  subnetIds,
  vpcId,
  awsRegion
} from "./config";

const albController = new AlbController("alb-controller", {
  provider: clusterProvider,
  clusterName: clusterName as Output<string>,
  clusterNamespace: clusterNamespaceName as Output<string>,
  labels: appsNodeGroupConfig.labels,
  version: chartVersionAlbController, 
  vpcId: vpcId as Output<string>,
  region:  awsRegion,
});

const albUrl = argoServiceName.apply((name) => {
  const alb = new AlbResource("alb", {
    provider: clusterProvider,
    clusterNamespace: clusterNamespaceName as Output<string>,
    subnetIds: subnetIds as Output<string[]>,
    services: [
      {
        name: name,
        port: argoNodePort,
        path: "/",
      },
    ],
    labels: appsNodeGroupConfig.labels, 
    dependsOn: [albController],
  });
  return alb.url;
});

export { albUrl };
