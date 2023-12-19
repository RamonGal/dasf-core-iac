import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output,
} from "@pulumi/pulumi";
import { helm } from "@pulumi/kubernetes";

interface ArgoOperatorArgs {
  provider: ProviderResource | undefined;
  labels: { [key: string]: string };
  clusterNamespace: string;
  serviceAccountName: Output<string>;
  nodePort: number;
  serviceName: string;
  version: string;
  dependsOn?: Resource[];
}

class ArgoOperator extends ComponentResource {
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

    const argoChart = new helm.v3.Release(
      `${name}`,
      {
        namespace: clusterNamespace,
        chart: "argo-workflows",
        repositoryOpts: { repo: "https://argoproj.github.io/argo-helm" },
        version: version,
        values: {
          nodeSelector: labels,
          server: {
            name: serviceName,
            extraArgs: ["--auth-mode=server"],
            serviceType: "NodePort",
            serviceNodePort: nodePort,
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
  }
}

export { ArgoOperator };
