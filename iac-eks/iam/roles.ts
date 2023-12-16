import { Output, ComponentResource, all, log } from '@pulumi/pulumi';
import { Provider, iam } from '@pulumi/aws';
import { Role } from '@pulumi/aws/iam';

import { callerId } from '../config';

interface AutoScalerRoleArgs {
  provider: Provider;
  clusterName: Output<string | undefined>;
  clusterNamespace: string;
  serviceAccountName: string;
  clusterOidcProviderUrl: Output<string>;
  clusterOidcProviderArn: Output<string>;
  dependsOn?: ComponentResource[];
}

interface EksClusterRoleArgs {
  provider: Provider;
  dependsOn?: ComponentResource[];
}

interface EksWorkerRoleArgs {
  provider: Provider;
  dependsOn?: ComponentResource[];
}

class PulumiRole extends ComponentResource {
  public role: iam.Role;

  constructor(name: string) {
    super('iam:roles:PulumiRole', name);

    // Create a role we can assume when standing up stack or running via CICD
    //
    // When standing up the stack for the first time, we need an account with iam:*
    // policy attached.
    // When this is ran via CI/CD, the principal account ID is updated by the below.
    this.role = new iam.Role(
      `${name}`,
      {
        description: 'Allow management of EC2, EKS, IAM and RDS',
        assumeRolePolicy: callerId.then((id: any) =>
          iam.assumeRolePolicyForPrincipal({ AWS: id })
        )
      },
      {
        parent: this
      }
    );

    // Create role policy to allow management of EC2, EKS, IAM, autoscaling and cloudformation
    const pulumiRolePolicy = new iam.RolePolicy(`${name}-policy`, {
      role: this.role,
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter'],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'iam:GetRole',
              'iam:GetRolePolicy',
              'iam:GetPolicy',
              'iam:GetPolicyVersion',
              'iam:GetOpenIDConnectProvider',
              'iam:TagRole',
              'iam:ListRoles',
              'iam:ListRolePolicies',
              'iam:ListPolicyVersions',
              'iam:ListAttachedRolePolicies',
              'iam:ListInstanceProfilesForRole',
              'iam:CreateRole',
              'iam:CreatePolicy',
              'iam:CreatePolicyVersion',
              'iam:CreateServiceLinkedRole',
              'iam:CreateOpenIDConnectProvider',
              'iam:UpdateAssumeRolePolicy',
              'iam:DeletePolicy',
              'iam:DeleteRolePolicy',
              'iam:DeletePolicyVersion',
              'iam:DeleteRole',
              'iam:DeleteOpenIDConnectProvider',
              'iam:AttachRolePolicy',
              'iam:DetachRolePolicy',
              'iam:PutRolePolicy'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: ['iam:PassRole'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'iam:PassedToService': [
                  'ec2.amazonaws.com',
                  'eks.amazonaws.com'
                ]
              }
            }
          },
          {
            Effect: 'Allow',
            Action: ['ec2:*', 'eks:*'],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'autoscaling:Describe*',
              'autoscaling:DeleteLaunchConfiguration',
              'autoscaling:DeleteAutoScalingGroup',
              'autoscaling:DeleteTags',
              'autoscaling:CreateLaunchConfiguration',
              'autoscaling:CreateAutoScalingGroup',
              'autoscaling:CreateOrUpdateTags',
              'autoscaling:UpdateAutoScalingGroup',
              'autoscaling:SetDesiredCapacity',
              'autoscaling:TerminateInstanceInAutoScalingGroup'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudformation:Describe*',
              'cloudformation:CreateStack',
              'cloudformation:UpdateStack',
              'cloudformation:DeleteStack',
              'cloudformation:GetTemplate'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'kms:CreateKey',
              'kms:CreateGrant',
              'kms:DescribeKey',
              'kms:GetKeyPolicy',
              'kms:GetKeyRotationStatus',
              'kms:EnableKeyRotation',
              'kms:TagResource',
              'kms:ListResourceTags',
              'kms:PutKeyPolicy',
              'kms:ScheduleKeyDeletion'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:DescribeLogGroups',
              'logs:DescribeResourcePolicies',
              'logs:ListTagsLogGroup',
              'logs:CreateLogGroup',
              'logs:CreateLogDelivery',
              'logs:PutRetentionPolicy',
              'logs:PutResourcePolicy',
              'logs:TagLogGroup',
              'logs:DeleteLogGroup',
              'logs:DeleteLogDelivery'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'wafv2:CreateWebACL',
              'wafv2:TagResource',
              'wafv2:GetWebACL',
              'wafv2:GetLoggingConfiguration',
              'wafv2:UpdateWebACL',
              'wafv2:ListTagsForResource',
              'wafv2:PutLoggingConfiguration',
              'wafv2:DeleteLoggingConfiguration',
              'wafv2:DeleteWebACL'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              's3:List*',
              's3:Describe*',
              's3:Get*',
              's3:CreateBucket',
              's3:PutBucketTagging',
              's3:PutBucketPolicy',
              's3:PutBucketAcl',
              's3:PutLifecycleConfiguration',
              's3:PutBucketPublicAccessBlock',
              's3:PutEncryptionConfiguration',
              's3:DeleteBucket',
              's3:DeleteBucketPolicy'
            ],
            Resource: '*'
          }
        ]
      }
    });
  }
}

class ClusterAutoscalerRole extends ComponentResource {
  public role: iam.Role;

  constructor(name: string, args: AutoScalerRoleArgs) {
    super('iam:roles:ClusterAutoscalerRole', name);

    const provider = args.provider;
    const clusterName = args.clusterName;
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
              'autoscaling:SetDesiredCapacity',
              'autoscaling:TerminateInstanceInAutoScalingGroup'
            ],
            conditions: [
              {
                test: 'StringEquals',
                values: ['owned'],
                variable: `autoscaling:ResourceTag/k8s.io/cluster-autoscaler/${clusterName}`
              },
              {
                test: 'StringEquals',
                values: ['true'],
                variable: `autoscaling:ResourceTag/k8s.io/cluster-autoscaler/enabled`
              }
            ],
            effect: 'Allow',
            resources: ['*']
          },
          {
            actions: [
              'autoscaling:DescribeAutoScalingInstances',
              'autoscaling:DescribeAutoScalingGroups',
              'ec2:DescribeLaunchTemplateVersions',
              'autoscaling:DescribeTags',
              'autoscaling:DescribeLaunchConfigurations'
            ],
            effect: 'Allow',
            resources: ['*']
          }
        ]
      })
    );
    // Get our policy document for the trust relationship
    const assumeRolePolicyDocument = all([
      clusterOidcProviderUrl,
      clusterOidcProviderArn,
      clusterNamespace
    ]).apply(([url, arn, namespace]) =>
      iam.getPolicyDocument({
        statements: [
          {
            actions: ['sts:AssumeRoleWithWebIdentity'],
            conditions: [
              {
                test: 'StringEquals',
                values: [
                  `system:serviceaccount:${namespace}:${serviceAccountName}`
                ],
                variable: `${url.replace('https://', '')}:sub`
              }, 
            ],
            effect: 'Allow',
            principals: [{ identifiers: [arn], type: 'Federated' }]
          }
        ]
      })
    );

    // Create a role
    this.role = new iam.Role(
      `${name}`,
      {
        assumeRolePolicy: assumeRolePolicyDocument.apply(
          (document) => document.json
        )
      },
      {
        provider: provider,
        parent: this,
        dependsOn: dependsOn
      }
    );

    // Create policy and attach to the above role
    const clusterAutoscalerRolePolicy = new iam.RolePolicy(
      `${name}-policy`,
      {
        role: this.role,
        policy: clusterAutoscalerPolicyDocument.apply(
          (document) => document.json
        )
      },
      {
        provider: provider,
        parent: this,
        dependsOn: dependsOn
      }
    );
  }
}

class EksClusterRole extends ComponentResource {
  public role: Role;

  constructor(name: string, args: EksClusterRoleArgs) {
    super('iam:roles:EksClusterRole', name);

    const provider = args.provider;
    const dependsOn = args.dependsOn;

    this.role = new iam.Role(
      `${name}-eksClusterRole`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'eks.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        })
      },
      { provider: provider, parent: this, dependsOn: dependsOn }
    );

    const amazonEKSClusterPolicyAttach = new iam.RolePolicyAttachment(
      'AmazonEKSClusterPolicy',
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
        role: this.role.name
      },
      { provider: provider, parent: this, dependsOn: dependsOn }
    );

    const amazonEKSVPCResourceControllerAttach = new iam.RolePolicyAttachment(
      'AmazonEKSVPCResourceController',
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
        role: this.role.name
      },
      { provider: provider, parent: this, dependsOn: dependsOn }
    );
  }
}

class EksWorkerRole extends ComponentResource {
  public role: iam.Role;

  constructor(name: string, args: EksWorkerRoleArgs) {
    super('iam:roles:EksWorkerRole', name);

    const provider = args.provider;
    const dependsOn = args.dependsOn;

    this.role = new iam.Role(
      `${name}-eksWorkerRole`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        })
      },
      { provider: provider, parent: this, dependsOn: dependsOn }
    );

    const albControllerPolicy = new iam.Policy(
      'AmazonLoadBalancerControllerPolicy',
      {
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['iam:CreateServiceLinkedRole'],
              Resource: '*',
              Condition: {
                StringEquals: {
                  'iam:AWSServiceName': 'elasticloadbalancing.amazonaws.com'
                }
              }
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeAccountAttributes',
                'ec2:DescribeAddresses',
                'ec2:DescribeAvailabilityZones',
                'ec2:DescribeInternetGateways',
                'ec2:DescribeVpcs',
                'ec2:DescribeVpcPeeringConnections',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeInstances',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DescribeTags',
                'ec2:GetCoipPoolUsage',
                'ec2:DescribeCoipPools',
                'elasticloadbalancing:DescribeLoadBalancers',
                'elasticloadbalancing:DescribeLoadBalancerAttributes',
                'elasticloadbalancing:DescribeListeners',
                'elasticloadbalancing:DescribeListenerCertificates',
                'elasticloadbalancing:DescribeSSLPolicies',
                'elasticloadbalancing:DescribeRules',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeTargetGroupAttributes',
                'elasticloadbalancing:DescribeTargetHealth',
                'elasticloadbalancing:DescribeTags'
              ],
              Resource: '*'
            },
            {
              Effect: 'Allow',
              Action: [
                'cognito-idp:DescribeUserPoolClient',
                'acm:ListCertificates',
                'acm:DescribeCertificate',
                'iam:ListServerCertificates',
                'iam:GetServerCertificate',
                'waf-regional:GetWebACL',
                'waf-regional:GetWebACLForResource',
                'waf-regional:AssociateWebACL',
                'waf-regional:DisassociateWebACL',
                'wafv2:GetWebACL',
                'wafv2:GetWebACLForResource',
                'wafv2:AssociateWebACL',
                'wafv2:DisassociateWebACL',
                'shield:GetSubscriptionState',
                'shield:DescribeProtection',
                'shield:CreateProtection',
                'shield:DeleteProtection'
              ],
              Resource: '*'
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:AuthorizeSecurityGroupIngress',
                'ec2:RevokeSecurityGroupIngress'
              ],
              Resource: '*'
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateSecurityGroup'],
              Resource: '*'
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateTags'],
              Resource: 'arn:aws:ec2:*:*:security-group/*',
              Condition: {
                StringEquals: {
                  'ec2:CreateAction': 'CreateSecurityGroup'
                },
                Null: {
                  'aws:RequestTag/elbv2.k8s.aws/cluster': 'false'
                }
              }
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateTags', 'ec2:DeleteTags'],
              Resource: 'arn:aws:ec2:*:*:security-group/*',
              Condition: {
                Null: {
                  'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
                  'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false'
                }
              }
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:AuthorizeSecurityGroupIngress',
                'ec2:RevokeSecurityGroupIngress',
                'ec2:DeleteSecurityGroup'
              ],
              Resource: '*',
              Condition: {
                Null: {
                  'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false'
                }
              }
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:CreateLoadBalancer',
                'elasticloadbalancing:CreateTargetGroup'
              ],
              Resource: '*',
              Condition: {
                Null: {
                  'aws:RequestTag/elbv2.k8s.aws/cluster': 'false'
                }
              }
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:CreateListener',
                'elasticloadbalancing:DeleteListener',
                'elasticloadbalancing:CreateRule',
                'elasticloadbalancing:DeleteRule'
              ],
              Resource: '*'
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:AddTags',
                'elasticloadbalancing:RemoveTags'
              ],
              Resource: [
                'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
                'arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*',
                'arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*'
              ],
              Condition: {
                Null: {
                  'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
                  'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false'
                }
              }
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:AddTags',
                'elasticloadbalancing:RemoveTags'
              ],
              Resource: [
                'arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*',
                'arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*',
                'arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*',
                'arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*'
              ]
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:ModifyLoadBalancerAttributes',
                'elasticloadbalancing:SetIpAddressType',
                'elasticloadbalancing:SetSecurityGroups',
                'elasticloadbalancing:SetSubnets',
                'elasticloadbalancing:DeleteLoadBalancer',
                'elasticloadbalancing:ModifyTargetGroup',
                'elasticloadbalancing:ModifyTargetGroupAttributes',
                'elasticloadbalancing:DeleteTargetGroup'
              ],
              Resource: '*',
              Condition: {
                Null: {
                  'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false'
                }
              }
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:RegisterTargets',
                'elasticloadbalancing:DeregisterTargets'
              ],
              Resource: 'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*'
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:SetWebAcl',
                'elasticloadbalancing:ModifyListener',
                'elasticloadbalancing:AddListenerCertificates',
                'elasticloadbalancing:RemoveListenerCertificates',
                'elasticloadbalancing:ModifyRule'
              ],
              Resource: '*'
            }
          ]
        }
      },
      {
        provider: provider,
        parent: this
      }
    );

    const albControllerPolicyAttach = new iam.RolePolicyAttachment(
      'AlbControllerPolicy',
      {
        policyArn: albControllerPolicy.arn,
        role: this.role.name
      },
      { provider: provider, parent: this }
    );

    const amazonEKSWorkerNodePolicyAttach = new iam.RolePolicyAttachment(
      'AmazonEKSWorkerNodePolicy',
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
        role: this.role.name
      },
      { provider: provider, parent: this }
    );

    const amazonEKSCNIPolicyAttach = new iam.RolePolicyAttachment(
      'AmazonEKS_CNI_Policy',
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
        role: this.role.name
      },
      { provider: provider, parent: this }
    );
    const amazonEC2ContainerRegistryReadOnlyAttach =
      new iam.RolePolicyAttachment(
        'AmazonEC2ContainerRegistryReadOnly',
        {
          policyArn:
            'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
          role: this.role.name
        },
        { provider: provider, parent: this }
      );

    const amazonSSMManagedInstanceCoreAttach = new iam.RolePolicyAttachment(
      'AmazonSSMManagedInstanceCore',
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        role: this.role
      },
      { provider: provider, parent: this }
    );

    const amazonSSMPatchAssociationAttach = new iam.RolePolicyAttachment(
      'AmazonSSMPatchAssociation',
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMPatchAssociation',
        role: this.role
      },
      { provider: provider, parent: this }
    );

    const cloudWatchAgentServerPolicyAttach = new iam.RolePolicyAttachment(
      'CloudWatchAgentServerPolicy',
      {
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        role: this.role
      },
      {
        provider: provider,
        parent: this
      }
    );
  }
}

export { PulumiRole, ClusterAutoscalerRole, EksClusterRole, EksWorkerRole };
