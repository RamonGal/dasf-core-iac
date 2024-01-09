import { ComponentResource } from "@pulumi/pulumi";
import { iam } from "@pulumi/aws";
import { Role } from "@pulumi/aws/iam";
import { core } from "@pulumi/kubernetes";

class EksClusterRole extends ComponentResource {
  public role: Role;

  constructor(name: string) {
    super("iam:roles:EksClusterRole", name);

    this.role = new iam.Role(
      `${name}-eks`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "eks.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
      },
      { parent: this },
    );

    const amazonEKSClusterPolicyAttach = new iam.RolePolicyAttachment(
      "AmazonEKSClusterPolicy",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
        role: this.role.name,
      },
      { parent: this },
    );

    const amazonEKSCNIPolicyAttach = new iam.RolePolicyAttachment(
      "AmazonEKS_CNI_Policy",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
        role: this.role.name,
      },
      { parent: this },
    );

    const amazonEKSVPCResourceControllerAttach = new iam.RolePolicyAttachment(
      "AmazonEKSVPCResourceController",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController",
        role: this.role.name,
      },
      { parent: this },
    );
  }
}

class EksWorkerRole extends ComponentResource {
  public role: iam.Role;

  constructor(name: string) {
    super("iam:roles:EksWorkerRole", name);

    this.role = new iam.Role(
      `${name}-eksWorkerRole`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "ec2.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
      },
      { parent: this },
    );

    const albControllerPolicy = new iam.Policy(
      "AmazonLoadBalancerControllerPolicy",
      {
        policy: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["iam:CreateServiceLinkedRole"],
              Resource: "*",
              Condition: {
                StringEquals: {
                  "iam:AWSServiceName": "elasticloadbalancing.amazonaws.com",
                },
              },
            },
            {
              Effect: "Allow",
              Action: [
                "elasticloadbalancing:DescribeLoadBalancers",
                "elasticloadbalancing:DescribeLoadBalancerAttributes",
                "elasticloadbalancing:DescribeListeners",
                "elasticloadbalancing:DescribeListenerCertificates",
                "elasticloadbalancing:DescribeSSLPolicies",
                "elasticloadbalancing:DescribeRules",
                "elasticloadbalancing:DescribeTargetGroups",
                "elasticloadbalancing:DescribeTargetGroupAttributes",
                "elasticloadbalancing:DescribeTargetHealth",
                "elasticloadbalancing:DescribeTags",
                "elasticloadbalancing:AddTags",
                "elasticloadbalancing:RemoveTags",
                "elasticloadbalancing:CreateLoadBalancer",
                "elasticloadbalancing:CreateTargetGroup",
                "elasticloadbalancing:SetWebAcl",
                "elasticloadbalancing:ModifyListener",
                "elasticloadbalancing:AddListenerCertificates",
                "elasticloadbalancing:RemoveListenerCertificates",
                "elasticloadbalancing:ModifyRule",
                "elasticloadbalancing:CreateListener",
                "elasticloadbalancing:DeleteListener",
                "elasticloadbalancing:CreateRule",
                "elasticloadbalancing:DeleteRule",
                "elasticloadbalancing:ModifyLoadBalancerAttributes",
                "elasticloadbalancing:SetIpAddressType",
                "elasticloadbalancing:SetSecurityGroups",
                "elasticloadbalancing:SetSubnets",
                "elasticloadbalancing:DeleteLoadBalancer",
                "elasticloadbalancing:ModifyTargetGroup",
                "elasticloadbalancing:ModifyTargetGroupAttributes",
                "elasticloadbalancing:DeleteTargetGroup",
                "elasticloadbalancing:RegisterTargets",
                "elasticloadbalancing:DeregisterTargets",
              ],
              Resource: "*",
            },
            {
              Effect: "Allow",
              Action: [
                "cognito-idp:DescribeUserPoolClient",
                "acm:ListCertificates",
                "acm:DescribeCertificate",
                "iam:ListServerCertificates",
                "iam:GetServerCertificate",
                "waf-regional:GetWebACL",
                "waf-regional:GetWebACLForResource",
                "waf-regional:AssociateWebACL",
                "waf-regional:DisassociateWebACL",
                "wafv2:GetWebACL",
                "wafv2:GetWebACLForResource",
                "wafv2:AssociateWebACL",
                "wafv2:DisassociateWebACL",
                "shield:GetSubscriptionState",
                "shield:DescribeProtection",
                "shield:CreateProtection",
                "shield:DeleteProtection",
              ],
              Resource: "*",
            },
            {
              Effect: "Allow",
              Action: [
                "ec2:DescribeAccountAttributes",
                "ec2:DescribeAddresses",
                "ec2:DescribeAvailabilityZones",
                "ec2:DescribeInternetGateways",
                "ec2:DescribeVpcs",
                "ec2:DescribeVpcPeeringConnections",
                "ec2:DescribeSubnets",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeInstances",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DescribeTags",
                "ec2:GetCoipPoolUsage",
                "ec2:DescribeCoipPools",
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:RevokeSecurityGroupIngress",
                "ec2:DeleteSecurityGroup",
                "ec2:RevokeSecurityGroupIngress",
                "ec2:CreateSecurityGroup",
              ],
              Resource: "*",
            },
            {
              Effect: "Allow",
              Action: ["ec2:CreateTags"],
              Resource: "arn:aws:ec2:*:*:security-group/*",
              Condition: {
                StringEquals: {
                  "ec2:CreateAction": "CreateSecurityGroup",
                },
                Null: {
                  "aws:RequestTag/elbv2.k8s.aws/cluster": "false",
                },
              },
            },
            {
              Effect: "Allow",
              Action: ["ec2:CreateTags", "ec2:DeleteTags"],
              Resource: "arn:aws:ec2:*:*:security-group/*",
              Condition: {
                Null: {
                  "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                  "aws:ResourceTag/elbv2.k8s.aws/cluster": "false",
                },
              },
            },
          ],
        },
      },
      {
        parent: this,
      },
    );

    const amazonEKSClusterAutoscalerPolicy = new iam.Policy(
      "AmazonEKSClusterAutoscalerPolicy",
      {
        policy: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "autoscaling:DescribeAutoScalingGroups",
                "autoscaling:DescribeAutoScalingInstances",
                "autoscaling:DescribeLaunchConfigurations",
                "autoscaling:DescribeScalingActivities",
                "autoscaling:DescribeTags",
                "ec2:DescribeInstanceTypes",
                "autoscaling:SetDesiredCapacity",
                "autoscaling:TerminateInstanceInAutoScalingGroup",
                "ec2:DescribeImages",
                "ec2:GetInstanceTypesFromInstanceRequirements",
                "eks:DescribeNodegroup",
                "ec2:DescribeLaunchTemplateVersions",
                "sts:AssumeRoleWithWebIdentity"
              ],
              Resource: "*",
            },
          ],
        },
      },
      {
        parent: this,
      },
    );

    const albControllerPolicyAttach = new iam.RolePolicyAttachment(
      "AlbControllerPolicy",
      {
        policyArn: albControllerPolicy.arn,
        role: this.role.name,
      },
      { parent: this },
    );

    const amazonEKSClusterAutoscalerPolicyAttach = new iam.RolePolicyAttachment(
      "AmazonEKSClusterAutoscalerPolicy",
      {
        policyArn: amazonEKSClusterAutoscalerPolicy.arn,
        role: this.role.name,
      },
      { parent: this },
    );

    const amazonEKSWorkerNodePolicyAttach = new iam.RolePolicyAttachment(
      "AmazonEKSWorkerNodePolicy",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
        role: this.role.name,
      },
      { parent: this },
    );

    const amazonEKSCNIPolicyAttach = new iam.RolePolicyAttachment(
      "AmazonEKS_CNI_Policy",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
        role: this.role.name,
      },
      { parent: this },
    );
    const amazonEC2ContainerRegistryReadOnlyAttach =
      new iam.RolePolicyAttachment(
        "AmazonEC2ContainerRegistryReadOnly",
        {
          policyArn:
            "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
          role: this.role.name,
        },
        { parent: this },
      );

    const amazonSSMManagedInstanceCoreAttach = new iam.RolePolicyAttachment(
      "AmazonSSMManagedInstanceCore",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
        role: this.role,
      },
      { parent: this },
    );

    const amazonSSMPatchAssociationAttach = new iam.RolePolicyAttachment(
      "AmazonSSMPatchAssociation",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonSSMPatchAssociation",
        role: this.role,
      },
      { parent: this },
    );

    const cloudWatchAgentServerPolicyAttach = new iam.RolePolicyAttachment(
      "CloudWatchAgentServerPolicy",
      {
        policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
        role: this.role,
      },
      {
        parent: this,
      },
    );
    
    // Adding a policy for AWS STS
    const awsStsPolicy = new iam.Policy(
      "AWSSTSPolicy",
      {
        policy: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "sts:AssumeRole",
                "sts:AssumeRoleWithWebIdentity",
                "sts:GetCallerIdentity"
              ],
              Resource: "*",
            },
          ],
        },
      },
      {
        parent: this,
      },
    );

    // Attach the AWS STS policy to the role
    new iam.RolePolicyAttachment(
      "AWSSTSPolicyAttachment",
      {
        policyArn: awsStsPolicy.arn,
        role: this.role.name,
      },
      { parent: this },
    );
  }
}

export { EksClusterRole, EksWorkerRole };
