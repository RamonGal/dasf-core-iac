import { ComponentResource, Output } from '@pulumi/pulumi';
import { kms, iam, Provider } from '@pulumi/aws';

import { callerId, awsRegion } from '../config';

interface KmsKeyArgs {
  provider: Provider;
}

class KmsKey extends ComponentResource {
  public arn: Output<string>;

  constructor(name: string, args: KmsKeyArgs) {
    super('kms:Key', name);

    const provider = args.provider;

    // Create a KMS key for our logs
    const kmsKey = new kms.Key(
      `${name}-key`,
      {
        keyUsage: 'ENCRYPT_DECRYPT',
        description: `KMS key for encrypting/decrypting ${name} WAF logs`,
        customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
        policy: callerId.then((accountId) =>
          iam
            .getPolicyDocument({
              statements: [
                {
                  sid: 'Allow administration of the key',
                  effect: 'Allow',
                  principals: [
                    {
                      type: 'AWS',
                      identifiers: [`arn:aws:iam::${accountId}:root`]
                    }
                  ],
                  actions: ['kms:*'],
                  resources: ['*']
                },
                {
                  sid: 'Allow use of the key',
                  effect: 'Allow',
                  principals: [
                    {
                      type: 'Service',
                      identifiers: [`logs.${awsRegion}.amazonaws.com`]
                    }
                  ],
                  actions: [
                    'kms:Encrypt*',
                    'kms:Decrypt*',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                    'kms:Describe*'
                  ],
                  resources: ['*'],
                  conditions: [
                    {
                      test: 'ArnLike',
                      variable: 'kms:EncryptionContext:aws:logs:arn',
                      values: [`arn:aws:logs:${awsRegion}:${accountId}:*`]
                    }
                  ]
                }
              ]
            })
            .then((document) => document.json)
        ),
        enableKeyRotation: true,
        tags: { Aliases: `${name}` }
      },
      { provider: provider, parent: this }
    );

    this.arn = kmsKey.arn;
  }
}

export { KmsKey };
