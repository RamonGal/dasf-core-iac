import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output,
} from "@pulumi/pulumi";
import { core, rbac } from "@pulumi/kubernetes";

interface DaskServiceAccountArgs {
  provider: ProviderResource | undefined;
  clusterNamespace: string;
  dependsOn?: Resource[];
}

class DaskServiceAccount extends ComponentResource {
  public readonly saName: Output<string>;
  constructor(name: string, args: DaskServiceAccountArgs) {
    super("cluster-components:DaskOperator", name);
    const provider = args.provider;
    const dependsOn = args.dependsOn;
    const clusterNamespace = args.clusterNamespace;

    const daskRole = new rbac.v1.Role(
      "dask-role",
      {
        metadata: {
          namespace: clusterNamespace,
        },
        rules: [
          {
            apiGroups: ["kubernetes.dask.org"],
            resources: [
              "daskclusters",
              "daskworkergroups",
              "daskworkergroups/scale",
              "daskjobs",
              "daskautoscalers",
            ],
            verbs: ["get", "list", "watch", "patch", "create", "delete"],
          },
          {
            apiGroups: [""], // indicates the core API group
            resources: [
              "pods",
              "pods/status",
              "pods/log",
              "services",
              "poddisruptionbudgets",
            ],
            verbs: ["get", "list", "watch", "create", "delete"],
          },
        ],
      },
      { provider, dependsOn, parent: this },
    );

    // Create the ServiceAccount
    const daskCreatorServiceAccount = new core.v1.ServiceAccount(
      "dask-creator",
      {
        metadata: {
          namespace: clusterNamespace,
        },
      },
      {
        provider,
        dependsOn,
        parent: this,
      },
    );

    // Create the RoleBinding
    const daskRoleBinding = new rbac.v1.RoleBinding(
      "dask-role-binding",
      {
        metadata: {
          namespace: clusterNamespace,
        },
        roleRef: {
          apiGroup: "rbac.authorization.k8s.io",
          kind: "Role",
          name: daskRole.metadata.name,
        },
        subjects: [
          {
            kind: "ServiceAccount",
            name: daskCreatorServiceAccount.metadata.name,
            namespace: clusterNamespace,
          },
        ],
      },
      {
        provider,
        dependsOn,
        parent: this,
      },
    );
    this.saName = daskCreatorServiceAccount.metadata.name;
  }
}

export { DaskServiceAccount };
