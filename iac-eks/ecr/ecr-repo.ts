import { ComponentResource, Output } from '@pulumi/pulumi';
import { ecr } from '@pulumi/aws';

class EcrRepo extends ComponentResource {
  public repositoryUrl: Output<string>;

  constructor(name: string) {
    super('ecr:Repo', name);

    const repo = new ecr.Repository(
      `${name}-repo`,
      {
        imageScanningConfiguration: {
          scanOnPush: true
        },
        imageTagMutability: 'MUTABLE'
      },
      {
        parent: this
      }
    );

    const lifecyclePolicy = new ecr.LifecyclePolicy(
      'ecrLifecyclePolicy',
      {
        repository: repo.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Keep last 30 images',
              selection: {
                tagStatus: 'tagged',
                tagPrefixList: ['v'],
                countType: 'imageCountMoreThan',
                countNumber: 30
              },
              action: {
                type: 'expire'
              }
            },
            {
              rulePriority: 2,
              description: 'Expire images older than 14 days',
              selection: {
                tagStatus: 'untagged',
                countType: 'sinceImagePushed',
                countUnit: 'days',
                countNumber: 14
              },
              action: {
                type: 'expire'
              }
            }
          ]
        })
      },
      {
        parent: this
      }
    );

    this.repositoryUrl = repo.repositoryUrl;
  }
}
export { EcrRepo };
