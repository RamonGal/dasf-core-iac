import {
  ProviderResource,
  ComponentResource,
  Resource,
  Output,
} from "@pulumi/pulumi";

import { albSecurityGroupId } from "../config";
import * as k8s from "@pulumi/kubernetes";

interface AlbArgs {
  provider: ProviderResource | undefined;
  services: {
    name: string;
    port: number;
    path: string;
  }[];
  clusterNamespace: Output<string>;
  labels: { [key: string]: string }; 
  subnetIds: Output<string[]>;
  dependsOn?: Resource[];
}

class AlbResource extends ComponentResource {
  public url: Output<string>;
  constructor(name: string, args: AlbArgs) {
    super("cluster-components:AlbController", name);

    const provider = args.provider;
    const services = args.services;
    const dependsOn = args.dependsOn; 
    const clusterNamespace = args.clusterNamespace;
    const subnetIds = args.subnetIds;

    const ingress = new k8s.networking.v1.Ingress(
      "alb-ingress",
      {
        metadata: {
          namespace: clusterNamespace,
          annotations: {
            "kubernetes.io/ingress.class": "alb",
            "alb.ingress.kubernetes.io/scheme": "internet-facing", 
            "alb.ingress.kubernetes.io/target-type": "ip",
            "alb.ingress.kubernetes.io/security-groups": albSecurityGroupId, 
            "alb.ingress.kubernetes.io/subnets": subnetIds.apply((ids) => {
              return ids.join(",");
            }),
          },
        },
        spec: { 
          ingressClassName: "alb",
          defaultBackend: {
            service: {
              name: services[0].name,
              port: {
                number: services[0].port,
              },
            },
          },
          rules: [
            {
              http: {
                paths: services.map((service) => {
                  return {
                    path: service.path,
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: service.name,
                        port: {
                          number: service.port,
                        },
                      },
                    },
                  };
                }, {}),
              },
            },
          ],
        },
      },
      { provider: provider, dependsOn: dependsOn },
    );

    this.url = ingress.status.loadBalancer.ingress[0].hostname;
  }
}

export { AlbResource };
