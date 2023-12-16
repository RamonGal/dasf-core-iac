import { vpc } from './vpc';
import { stackName, projectName } from '../config';
import { ec2 } from '@pulumi/aws';

const publicSubnets = vpc.publicSubnets;
const privateSubnets = vpc.privateSubnets;
// Get aps private subnets
const appsPrivateSubnets = privateSubnets.then((subnets) =>
  subnets.filter((subnet) =>
    subnet.subnetName.includes(`${projectName}-${stackName}-vpc-apps-private`)
  )
);
// Get apps public subnets
const appsPublicSubnets = publicSubnets.then((subnets) =>
  subnets.filter((subnet) =>
    subnet.subnetName.includes(`${projectName}-${stackName}-vpc-apps-public`)
  )
);

// CIDRs for use in security groups
const appsPrivateCidrs = appsPrivateSubnets.then((subnets) =>
  subnets.map((subnets) => subnets.subnet.cidrBlock)
);
const appsPublicCidrs = appsPublicSubnets.then((subnets) =>
  subnets.map((subnets) => subnets.subnet.cidrBlock)
);
const appsPrivateSubnetIds = appsPrivateSubnets.then((subnets) =>
  subnets.map((subnets) => subnets.id)
);
const appsPublicSubnetIds = appsPublicSubnets.then((subnets) =>
  subnets.map((subnets) => subnets.id)
);

// Route table IDs
const appsPrivateRouteTableIds = appsPrivateSubnets.then((subnets) =>
  subnets
    .map((subnets) => subnets.id)
    .map((id) => id.apply((i) => ec2.getRouteTable({ subnetId: i })).id)
);

export {
  appsPrivateSubnets,
  appsPublicSubnets,
  appsPrivateCidrs,
  appsPublicCidrs,
  appsPrivateSubnetIds,
  appsPublicSubnetIds,
  appsPrivateRouteTableIds
};
