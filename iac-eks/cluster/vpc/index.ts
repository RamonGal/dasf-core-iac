import * as awsx from "@pulumi/awsx";
import { vpcNetworkCidr, projectName, stackName } from "../config";

const vpc = new awsx.ec2.Vpc(`${projectName}-${stackName}-eks-vpc`, {
  cidrBlock: vpcNetworkCidr,
});
export { vpc };
