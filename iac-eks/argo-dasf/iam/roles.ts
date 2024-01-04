import { Provider as k8Provider, core } from "@pulumi/kubernetes";
import { ComponentResource, Output, all } from "@pulumi/pulumi";
import { iam } from "@pulumi/aws";

interface AutoScalerRoleArgs {
  clusterName: Output<string | undefined>;
  clusterProvider: k8Provider;
  clusterNamespace: Output<string>;
  serviceAccountName: string;
  clusterOidcProviderUrl: Output<string>;
  clusterOidcProviderArn: Output<string>;
  dependsOn?: ComponentResource[];
}

class ClusterAutoscalerRole extends ComponentResource {
  public role: iam.Role;
  public serviceAccountName: Output<string>;

  constructor(name: string, args: AutoScalerRoleArgs) {
    super("iam:roles:ClusterAutoscalerRole", name);

    const clusterName = args.clusterName;
    const k8sProvider = args.clusterProvider;
    const serviceAccountName = args.serviceAccountName;
    const clusterOidcProviderArn = args.clusterOidcProviderArn;
    const clusterOidcProviderUrl = args.clusterOidcProviderUrl;
    const clusterNamespace = args.clusterNamespace;
    const dependsOn = args.dependsOn;

    // Get our policy document for the role policy
    const clusterAutoscalerPolicyDocument = clusterName.apply((clusterName) =>
      iam.getPolicyDocument({
        statements: [
          {
            actions: [
              "autoscaling:SetDesiredCapacity",
              "autoscaling:TerminateInstanceInAutoScalingGroup",
            ],
            conditions: [
              {
                test: "StringEquals",
                values: ["owned"],
                variable: `autoscaling:ResourceTag/k8s.io/cluster-autoscaler/${clusterName}`,
              },
              {
                test: "StringEquals",
                values: ["true"],
                variable: `autoscaling:ResourceTag/k8s.io/cluster-autoscaler/enabled`,
              },
            ],
            effect: "Allow",
            resources: ["*"],
          },
          {
            actions: [
              "autoscaling:DescribeAutoScalingInstances",
              "autoscaling:DescribeAutoScalingGroups",
              "ec2:DescribeLaunchTemplateVersions",
              "autoscaling:DescribeTags",
              "autoscaling:DescribeLaunchConfigurations",
            ],
            effect: "Allow",
            resources: ["*"],
          },
        ],
      }),
    );
    // Get our policy document for the trust relationship
    const assumeRolePolicyDocument = all([
      clusterOidcProviderUrl,
      clusterOidcProviderArn,
      clusterNamespace,
    ]).apply(([url, arn, namespace]) =>
      iam.getPolicyDocument({
        statements: [
          {
            actions: ["sts:AssumeRoleWithWebIdentity"],
            conditions: [
              {
                test: "StringEquals",
                values: [
                  `system:serviceaccount:${namespace}:${serviceAccountName}`,
                ],
                variable: `${url.replace("https://", "")}:sub`,
              },
              {
                test: "StringEquals",
                values: ["sts.amazonaws.com"],
                variable: `${url.replace("https://", "")}:aud`,
              },
            ],
            effect: "Allow",
            principals: [{ identifiers: [arn], type: "Federated" }],
          },
        ],
      }),
    );

    // Create a role
    this.role = new iam.Role(
      `${name}`,
      {
        assumeRolePolicy: assumeRolePolicyDocument.apply(
          (document) => document.json,
        ),
      },
      {
        parent: this,
        dependsOn: dependsOn,
      },
    );

    const sa = new core.v1.ServiceAccount(
      serviceAccountName,
      {
        metadata: {
          namespace: clusterNamespace,
          name: serviceAccountName,
          annotations: {
            "eks.amazonaws.com/role-arn": this.role.arn,
          },
        },
      },
      { provider: k8sProvider, dependsOn: dependsOn },
    );
    this.serviceAccountName = sa.metadata.name;
    // Create policy and attach to the above role
    const clusterAutoscalerRolePolicy = new iam.RolePolicy(
      `${name}-policy`,
      {
        role: this.role,
        policy: clusterAutoscalerPolicyDocument.apply(
          (document) => document.json,
        ),
      },
      {
        parent: this,
        dependsOn: dependsOn,
      },
    );
  }
}

export { ClusterAutoscalerRole };
