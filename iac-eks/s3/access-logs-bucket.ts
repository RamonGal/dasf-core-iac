import { ComponentResource, Output, all } from '@pulumi/pulumi';
import { s3, elb, Provider } from '@pulumi/aws';

import { callerId, stackName } from '../config';

interface AccessLogsBucketArgs {
  provider: Provider;
}

class AccessLogsBucket extends ComponentResource {
  public bucket: Output<string>;

  constructor(name: string, args: AccessLogsBucketArgs) {
    super('s3:AccessLogsBucket', name);

    const provider = args.provider;

    // Create the bucket
    const accessLogsBucket = new s3.BucketV2(
      `${name}`,
      {
        tags: {
          Environment: stackName,
          Name: `${name}`
        }
      },
      { provider: provider, parent: this }
    );
    // Create a bucket policy
    const albAccessLogsBucketPolicy = new s3.BucketPolicy(
      `${name}-policy`,
      {
        bucket: accessLogsBucket.bucket,
        policy: all([
          callerId,
          accessLogsBucket.bucket,
          elb.getServiceAccount({})
        ]).apply(([accountId, bucket, elbAccountId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: elbAccountId.arn },
                Action: ['s3:PutObject'],
                Resource: [`arn:aws:s3:::${bucket}/logs/AWSLogs/${accountId}/*`]
              },
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'logdelivery.elb.amazonaws.com'
                },
                Action: 's3:GetBucketAcl',
                Resource: `arn:aws:s3:::${bucket}`
              },
              {
                Sid: 'AllowSSLRequestsOnly',
                Action: 's3:*',
                Effect: 'Deny',
                Resource: [
                  `arn:aws:s3:::${bucket}`,
                  `arn:aws:s3:::${bucket}/*`
                ],
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false'
                  }
                },
                Principal: '*'
              }
            ]
          })
        )
      },
      { provider: provider, parent: this }
    );
    // Create bucket encryption config
    const albAccessLogsBucketEncryption =
      new s3.BucketServerSideEncryptionConfigurationV2(
        `${name}-encryption`,
        {
          bucket: accessLogsBucket.bucket,
          rules: [
            {
              bucketKeyEnabled: true,
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256'
              }
            }
          ]
        },
        { provider: provider, parent: this }
      );
    // Create a lifecycle config
    const albAccessLogsBucketLifecycleConfig =
      new s3.BucketLifecycleConfigurationV2(
        `${name}-lifecycle-rules`,
        {
          bucket: accessLogsBucket.bucket,
          rules: [
            {
              id: `${name}-lifecycle-yearly`,
              status: 'Enabled',
              expiration: {
                days: 366
              }
            }
          ]
        },
        { provider: provider, parent: this }
      );
    const albAccessLogsBucketAcl = new s3.BucketAclV2(
      `${name}-acl`,
      { bucket: accessLogsBucket.bucket, acl: 'log-delivery-write' },
      { provider: provider, parent: this }
    );
    // Block public ACLs for the bucket
    const albAccessLogsBucketPublicAccessBlock = new s3.BucketPublicAccessBlock(
      `${name}-public-access-block`,
      {
        bucket: accessLogsBucket.bucket,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      },
      { provider: provider, parent: this }
    );

    this.bucket = accessLogsBucket.bucket;
  }
}

export { AccessLogsBucket };
