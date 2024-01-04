import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output,
} from "@pulumi/pulumi";
import { helm } from "@pulumi/kubernetes";

interface AlbControllerArgs {
  provider: ProviderResource | undefined;
  clusterName: Output<string>;
  clusterNamespace: Output<string>;
  labels: { [key: string]: string };
  version: string;
  vpcId: Output<string>;
  region: string;
  dependsOn?: Resource[];
}

class AlbController extends ComponentResource {
  public albController: Output< string >;
  constructor(name: string, args: AlbControllerArgs) {
    super("cluster-components:AlbController", name);

    const provider = args.provider;
    const clusterName = args.clusterName;
    const labels = args.labels;
    const version = args.version;
    const dependsOn = args.dependsOn;
    const clusterNamespace = args.clusterNamespace;
    const vpcId = args.vpcId;
    const region = args.region;
    // Define our aws ingress ctlr. Helm Release
    const albController = new helm.v3.Release(
      `${name}`,
      {
        namespace: clusterNamespace,
        chart: "aws-load-balancer-controller",
        version: version,
        repositoryOpts: { repo: "https://aws.github.io/eks-charts" },
        values: {
          clusterName: clusterName,
          vpcId:  vpcId,
          region:  region,
          nodeSelector: labels,
          serviceAnnotations: {
            "service.beta.kubernetes.io/aws-load-balancer-target-node-labels": `workload=${labels.workload}`,
          },
        },
      },
      {
        provider: provider,
        dependsOn: dependsOn,
        parent: this,
      },
    );
    this.albController = albController.name;
  }
}

export { AlbController };
