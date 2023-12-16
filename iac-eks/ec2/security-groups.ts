import * as awsx from '@pulumi/awsx';

import { provider } from '../iam';
import { vpc } from '../vpc';

import { stackName, projectName } from '../config';

// Create a cluster security group
const clusterSecurityGroup = new awsx.ec2.SecurityGroup(
  `${projectName}-${stackName}-cluster-securitygroup`,
  {
    vpc: vpc,
    tags: {
      Name: `${projectName}-${stackName}-cluster-securitygroup`
    }
  },
  { provider: provider }
);
// Create an apps security group
const appsSecurityGroup = new awsx.ec2.SecurityGroup(
  `${projectName}-${stackName}-apps-securitygroup`,
  {
    vpc: vpc,
    tags: {
      Name: `${projectName}-${stackName}-apps-securitygroup`
    }
  },
  { provider: provider }
);
// create alb security group
const albSecurityGroup = new awsx.ec2.SecurityGroup(
  `${projectName}-${stackName}-alb-securitygroup`,
  {
    vpc: vpc,
    tags: {
      Name: `${projectName}-${stackName}-alb-securitygroup`
    }
  },
  { provider: provider }
);

/* apps */
appsSecurityGroup.createIngressRule(
  `${projectName}-${stackName}-apps-kubelets-in`,
  {
    description: 'Allow cluster to communicate with apps kubelets',
    ports: new awsx.ec2.TcpPorts(10250),
    location: { sourceSecurityGroupId: clusterSecurityGroup.id }
  }
);
appsSecurityGroup.createEgressRule(
  `${projectName}-${stackName}-apps-cluster-api-out`,
  {
    description: 'Allow apps to communicate with cluster api',
    ports: new awsx.ec2.TcpPorts(443),
    location: { sourceSecurityGroupId: clusterSecurityGroup.id }
  }
);
appsSecurityGroup.createIngressRule(
  `${projectName}-${stackName}-apps-coredns-tcp-in`,
  {
    description: 'Allow apps to communicate with coredns TCP',
    ports: new awsx.ec2.TcpPorts(53),
    location: { sourceSecurityGroupId: appsSecurityGroup.id }
  }
);
appsSecurityGroup.createIngressRule(
  `${projectName}-${stackName}-apps-coredns-udp-in`,
  {
    description: 'Allow apps to communicate with coredns UDP',
    ports: new awsx.ec2.UdpPorts(53),
    location: { sourceSecurityGroupId: appsSecurityGroup.id }
  }
);
appsSecurityGroup.createEgressRule(
  `${projectName}-${stackName}-apps-https-out`,
  {
    description: 'Allow apps HTTPS out',
    ports: new awsx.ec2.TcpPorts(443),
    location: { cidrBlocks: ['0.0.0.0/0'] }
  }
);
/* cluster */
clusterSecurityGroup.createIngressRule(
  `${projectName}-${stackName}-apps-cluster-api-in-tcp`,
  {
    description: 'Allow apps to communicate with to cluster API',
    ports: new awsx.ec2.TcpPorts(443),
    location: { sourceSecurityGroupId: appsSecurityGroup.id }
  }
);
clusterSecurityGroup.createEgressRule(
  `${projectName}-${stackName}-apps-kubelets-out-tcp`,
  {
    description: 'Allow cluster to communicate with apps kubelets',
    ports: new awsx.ec2.TcpPorts(10250),
    location: { sourceSecurityGroupId: appsSecurityGroup.id }
  }
);
clusterSecurityGroup.createIngressRule(
  `${projectName}-${stackName}-apps-to-alb-tcp-in`,
  {
    description: 'Allow apps to communicate with ALB on any port',
    ports: new awsx.ec2.AllTcpPorts(),
    location: { sourceSecurityGroupId: albSecurityGroup.id }
  }
);
/* alb */
albSecurityGroup.createIngressRule(
  `${projectName}-${stackName}-alb-to-apps-tcp-in`,
  {
    description: 'Allow apps to communicate with ALB on any port',
    ports: new awsx.ec2.AllTcpPorts(),
    location: { sourceSecurityGroupId: appsSecurityGroup.id }
  }
);
albSecurityGroup.createEgressRule(
  `${projectName}-${stackName}-apps-alb-tcp-out`,
  {
    description: 'Allow ALB to communicate with apps on any port',
    ports: new awsx.ec2.AllTcpPorts(),
    location: { sourceSecurityGroupId: appsSecurityGroup.id }
  }
);

export { clusterSecurityGroup, appsSecurityGroup, albSecurityGroup };
