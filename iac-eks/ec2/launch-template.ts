import { Provider } from '@pulumi/aws';
import { InstanceType, LaunchTemplate } from '@pulumi/aws/ec2';
import {
  ComponentResource,
  Input,
  Output,
  OutputInstance
} from '@pulumi/pulumi';

interface LaunchTemplateArgs {
  provider: Provider;
  labels: { [workload: string]: string };
  instanceType: Input<InstanceType>;
  clusterName: Output<string>;
  securityGroups: Input<string>[];
}

class WorkerLaunchTemplate extends ComponentResource {
  public name: Output<string>;
  public id: Output<string>;
  public latestVersion: OutputInstance<number>;

  constructor(name: string, args: LaunchTemplateArgs) {
    super('ec2:launch-templates:WorkerLaunchTemplate', name);

    const provider = args.provider;
    const securityGroups = args.securityGroups;
    const labels = args.labels;

    const launchTemplate = new LaunchTemplate(
      `${name}-launch-template`,
      {
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required',
          httpPutResponseHopLimit: 2,
          instanceMetadataTags: 'enabled'
        },
        monitoring: {
          enabled: true
        },
        vpcSecurityGroupIds: securityGroups,
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${name}-worker`
            }
          }
        ],
        tags: {
          'k8s.io/cluster-autoscaler/node-template/label/workload':
            labels.workload
        }
      },
      { provider: provider }
    );

    this.name = launchTemplate.name;
    this.id = launchTemplate.id;
    this.latestVersion = launchTemplate.latestVersion;
  }
}

export { WorkerLaunchTemplate };
