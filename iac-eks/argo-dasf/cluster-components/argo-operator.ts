import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output,
} from "@pulumi/pulumi";
import { helm } from "@pulumi/kubernetes";
import {
  appsSecurityGroupId,
} from "../config";

interface ArgoOperatorArgs {
  provider: ProviderResource | undefined;
  labels: { [key: string]: string };
  clusterNamespace: Output<string>;
  serviceAccountName: Output<string>;
  nodePort: number;
  serviceName: string;
  version: string;
  dependsOn?: Resource[];
}

class ArgoOperator extends ComponentResource {
  public fullname: Output<string>;

  constructor(name: string, args: ArgoOperatorArgs) {
    super("cluster-components:ArgoOperator", name);

    const provider = args.provider;
    const labels = args.labels;
    const version = args.version;
    const dependsOn = args.dependsOn;
    const clusterNamespace = args.clusterNamespace;
    const serviceAccountName = args.serviceAccountName;
    const nodePort = args.nodePort;
    const serviceName = args.serviceName;
    const chartName = "argo-workflows";
    const argoChart = new helm.v3.Release(
      `${name}`,
      {
        namespace: clusterNamespace,
        chart: chartName,
        repositoryOpts: { repo: "https://argoproj.github.io/argo-helm" },
        version: version,
        values: {
          
          nodeSelector: labels,
          server: {
            deploymentAnnotations: {
            "service.beta.kubernetes.io/aws-load-balancer-security-groups": appsSecurityGroupId
          },
            name: serviceName,
            extraArgs: ["--auth-mode=server"],
          },
          serviceAccount: {
            name: serviceAccountName,
          },
        },
      },
      {
        provider: provider,
        dependsOn: dependsOn,
        parent: this,
      },
    );
    this.fullname = argoChart.name.apply(
      (name) => `${name}-${chartName}-${serviceName}`,
    );
  }
}

export { ArgoOperator };
