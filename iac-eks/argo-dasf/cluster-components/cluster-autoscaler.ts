import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output,
} from "@pulumi/pulumi";
import { helm } from "@pulumi/kubernetes";
import { Region } from "@pulumi/aws";
import {
  stackName,
  projectName,
  appsNodeGroupConfig,
  oidcProviderUrl,
  oidcProviderArn,
  chartVersionClusterAutoscaler,
  imageTagClusterAutoscaler,
  awsRegion,
  clusterName,
} from "../config";
import { clusterProvider, clusterNamespaceName } from "../eks";
import { ClusterAutoscalerRole } from "../iam";

interface ClusterAutoscalerArgs {
  provider: ProviderResource | undefined;
  clusterName: Output<string>;
  clusterNamespace: Output<string>;
  serviceAccountRoleArn: Output<string>;
  serviceAccountName: Output<string>;
  region: Region;
  version: string;
  imageTag: string;
  labels: { [workload: string]: string };
  dependsOn?: Resource[];
}

class ClusterAutoscaler extends ComponentResource {
  constructor(name: string, args: ClusterAutoscalerArgs) {
    super("cluster-components:ClusterAutoscaler", name);

    const provider = args.provider;
    const clusterName = args.clusterName;
    const serviceAccountName = args.serviceAccountName;
    const region = args.region;
    const version = args.version;
    const imageTag = args.imageTag;
    const labels = args.labels;
    const dependsOn = args.dependsOn;
    const clusterNamespace = args.clusterNamespace;

    const clusterAutoscaler = new helm.v3.Release(
      `${name}`,
      {
        namespace: clusterNamespace,
        chart: "cluster-autoscaler",
        version: version,
        repositoryOpts: { repo: "https://kubernetes.github.io/autoscaler" },
        values: {
          autoDiscovery: {
            clusterName: clusterName,
          },
          awsRegion: region,
          cloudProvider: "aws",
          image: { tag: imageTag },
          rbac: {
            serviceAccount: {
              create: false,
              name: serviceAccountName,
            },
          },
          extraArgs: {
            expander: "least-waste",
            "skip-nodes-with-system-pods": "false",
            "aws-use-static-instance-list": "true",
          },
          nodeSelector: labels,
        },
      },
      {
        provider: provider,
        dependsOn: dependsOn,
        parent: this,
      },
    );
  }
}

const createClusterAutoscalerRole = () => {
  if (!oidcProviderArn || !oidcProviderUrl) {
    throw new Error("no cluster oidc provider");
  }

  const clusterAutoscalerRole = new ClusterAutoscalerRole(
    `${projectName}-${stackName}-ca-role`,
    {
      clusterName: clusterName,
      clusterProvider: clusterProvider,
      clusterNamespace: clusterNamespaceName,
      serviceAccountName: "cluster-autoscaler-sa",
      clusterOidcProviderArn: oidcProviderArn as Output<string>,
      clusterOidcProviderUrl: oidcProviderUrl as Output<string>,
    },
  );

  new ClusterAutoscaler("cluster-autoscaler", {
    provider: clusterProvider,
    clusterName: clusterName as Output<string>,
    clusterNamespace: clusterNamespaceName,
    serviceAccountRoleArn: clusterAutoscalerRole.role.arn,
    serviceAccountName: clusterAutoscalerRole.serviceAccountName,
    region: awsRegion,
    version: chartVersionClusterAutoscaler,
    imageTag: imageTagClusterAutoscaler,
    labels: appsNodeGroupConfig.labels,
    dependsOn: [clusterAutoscalerRole],
  });
};

export { createClusterAutoscalerRole };
