import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output
} from '@pulumi/pulumi';

import { albSecurityGroup } from '../ec2';
import * as k8s from '@pulumi/kubernetes';

interface AlbArgs {
  provider: ProviderResource | undefined;
  services: {
    name: string;
    port: number;
  }[];
  labels: { [key: string]: string };
  dependsOn?: Resource[];
}

class AlbResource extends ComponentResource {
  constructor(name: string, args: AlbArgs) {
    super('cluster-components:AlbController', name);

    const provider = args.provider;
    const services = args.services;
    const dependsOn = args.dependsOn;

    const ingress = new k8s.networking.v1.Ingress(
      'nginx-ingress',
      {
        metadata: {
          annotations: {
            'kubernetes.io/ingress.class': 'alb',
            'alb.ingress.kubernetes.io/scheme': 'internet-facing',
            'alb.ingress.kubernetes.io/target-type': 'instance',
            'alb.ingress.kubernetes.io/security-groups': albSecurityGroup.id
          }
        },
        spec: {
          defaultBackend: {
            service: {
              name: services[0].name,
              port: {
                number: services[0].port
              }
            }
          },
          rules: [
            {
              http: {
                paths: services.map((service) => {
                  return {
                    path: '/',
                    pathType: 'Prefix',
                    backend: {
                      service: {
                        name: service.name,
                        port: {
                          number: service.port
                        }
                      }
                    }
                  };
                }, {})
              }
            }
          ]
        }
      },
      { provider: provider, dependsOn: dependsOn }
    );
  }
}

export { AlbResource };
