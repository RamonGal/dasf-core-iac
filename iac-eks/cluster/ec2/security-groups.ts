import { ec2 } from "@pulumi/aws";
import { vpc } from "../vpc";
import { stackName, projectName } from "../config";

// Create a cluster security group
const clusterSecurityGroup = new ec2.SecurityGroup(
  `${projectName}-${stackName}-cluster-securitygroup`,
  {
    vpcId: vpc.vpcId,
    tags: {
      Name: `${projectName}-${stackName}-cluster-securitygroup`,
    },
  },
);
// Create an apps security group
const appsSecurityGroup = new ec2.SecurityGroup(
  `${projectName}-${stackName}-apps-securitygroup`,
  {
    vpcId: vpc.vpcId,
    tags: {
      Name: `${projectName}-${stackName}-apps-securitygroup`,
    },
  },
);
// create alb security group
const albSecurityGroup = new ec2.SecurityGroup(
  `${projectName}-${stackName}-alb-securitygroup`,
  {
    vpcId: vpc.vpcId,
    tags: {
      Name: `${projectName}-${stackName}-alb-securitygroup`,
    },
  },
);

// Ingress Rule: Allow cluster to communicate with apps kubelets
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-kubelets-in`, {
  type: "ingress",
  securityGroupId: appsSecurityGroup.id,
  sourceSecurityGroupId: clusterSecurityGroup.id,
  protocol: "tcp",
  fromPort: 10250,
  toPort: 10250,
  description: "Allow cluster to communicate with apps kubelets",
});

new ec2.SecurityGroupRule(`${projectName}-${stackName}-webhook-access-in`, {
  type: "ingress",
  securityGroupId: appsSecurityGroup.id, // Adjust as necessary for your worker nodes security group
  sourceSecurityGroupId: clusterSecurityGroup.id, // The security group of your control plane
  protocol: "tcp",
  fromPort: 9443,
  toPort: 9443,
  description: "Allow Kubernetes control plane to access webhook on port 9443",
});

// Egress Rule: Allow apps to communicate with cluster API
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-cluster-api-out`, {
  type: "egress",
  securityGroupId: appsSecurityGroup.id,
  sourceSecurityGroupId: clusterSecurityGroup.id,
  protocol: "tcp",
  fromPort: 443,
  toPort: 443,
  description: "Allow apps to communicate with cluster API",
});

// Ingress Rule: Allow apps to communicate with coredns TCP
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-coredns-tcp-in`, {
  type: "ingress",
  securityGroupId: appsSecurityGroup.id,
  protocol: "tcp",
  fromPort: 53,
  toPort: 53,
  sourceSecurityGroupId: appsSecurityGroup.id,
  description: "Allow apps to communicate with coredns TCP",
});

// Ingress Rule: Allow apps to communicate with coredns UDP
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-coredns-udp-in`, {
  type: "ingress",
  securityGroupId: appsSecurityGroup.id,
  protocol: "udp",
  fromPort: 53,
  toPort: 53,
  sourceSecurityGroupId: appsSecurityGroup.id,
  description: "Allow apps to communicate with coredns UDP",
});

// Egress Rule: Allow apps HTTPS out
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-https-out`, {
  type: "egress",
  securityGroupId: appsSecurityGroup.id,
  protocol: "tcp",
  fromPort: 443,
  toPort: 443,
  cidrBlocks: ["0.0.0.0/0"],
  description: "Allow apps HTTPS out",
});
// Egress Rule: Allow apps HTTPS out
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-http-out`, {
  type: "egress",
  securityGroupId: appsSecurityGroup.id,
  protocol: "tcp",
  fromPort: 80,
  toPort: 80,
  cidrBlocks: ["0.0.0.0/0"],
  description: "Allow apps HTTPS out",
});
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-argo-out`, {
  type: "egress",
  securityGroupId: appsSecurityGroup.id,
  protocol: "tcp",
  fromPort: 2746,
  toPort: 2746,
  cidrBlocks: ["0.0.0.0/0"],
  description: "Allow apps HTTPS out",
});
/* cluster */
// Ingress Rule: Allow apps to communicate with the cluster API
new ec2.SecurityGroupRule(
  `${projectName}-${stackName}-apps-cluster-api-in-tcp`,
  {
    type: "ingress",
    securityGroupId: clusterSecurityGroup.id,
    sourceSecurityGroupId: appsSecurityGroup.id,
    protocol: "tcp",
    fromPort: 443,
    toPort: 443,
    description: "Allow apps to communicate with the cluster API",
  },
);

// Egress Rule: Allow cluster to communicate with apps kubelets
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-kubelets-out-tcp`, {
  type: "egress",
  securityGroupId: clusterSecurityGroup.id,
  sourceSecurityGroupId: appsSecurityGroup.id,
  protocol: "tcp",
  fromPort: 10250,
  toPort: 10250,
  description: "Allow cluster to communicate with apps kubelets",
});

// Ingress Rule: Allow apps to communicate with ALB on any port
new ec2.SecurityGroupRule(`${projectName}-${stackName}-cl-to-alb-tcp-in`, {
  type: "ingress",
  securityGroupId: clusterSecurityGroup.id,
  sourceSecurityGroupId: albSecurityGroup.id,
  protocol: "-1",
  fromPort: 0, // 0 for all ports
  toPort: 0, // 0 for all ports
  description: "Allow cluster to communicate with ALB on any port",
});
new ec2.SecurityGroupRule(`${projectName}-${stackName}-alb-to-cl-tcp-in`, {
  type: "ingress",
  securityGroupId: albSecurityGroup.id,
  sourceSecurityGroupId: clusterSecurityGroup.id,
  protocol: "-1",
  fromPort: 0, // 0 for all ports
  toPort: 0, // 0 for all ports
  description: "Allow alb to communicate with cluster on any port",
});
/* alb */
//  Allow apps to communicate with ALB on any port
new ec2.SecurityGroupRule(`${projectName}-${stackName}-alb-to-apps-tcp-in`, {
  type: "ingress",
  securityGroupId: albSecurityGroup.id,
  sourceSecurityGroupId: appsSecurityGroup.id,
   protocol: "-1",
  fromPort: 0, // 0 for all ports
  toPort: 0, // 0 for all ports
  description: "Allow apps to communicate with ALB on any port",
});

//   Allow ALB to communicate with apps on any port
new ec2.SecurityGroupRule(`${projectName}-${stackName}-apps-alb-tcp-out`, {
  type: "ingress",
  securityGroupId: appsSecurityGroup.id,
  sourceSecurityGroupId: albSecurityGroup.id,
   protocol: "-1",
  fromPort: 0, // 0 for all ports
  toPort: 0, // 0 for all ports
  description: "Allow ALB to communicate with apps on any port",
});

// allow http traffic to alb
new ec2.SecurityGroupRule(`${projectName}-${stackName}-alb-http-in`, {
  type: "ingress",
  securityGroupId: albSecurityGroup.id,
  protocol: "tcp",
  fromPort: 80,
  toPort: 80,
  cidrBlocks: ["0.0.0.0/0"],
  description: "Allow http traffic to alb",
});

new ec2.SecurityGroupRule(`${projectName}-${stackName}-alb-out`, {
  type: "egress",
  securityGroupId: albSecurityGroup.id,
  protocol: "-1",
  fromPort: 0,
  toPort: 0,
  cidrBlocks: ["0.0.0.0/0"],
  description: "Allow http traffic to alb",
});
export { clusterSecurityGroup, appsSecurityGroup, albSecurityGroup };
