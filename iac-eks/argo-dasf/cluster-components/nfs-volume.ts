import * as k8s from '@pulumi/kubernetes';
import { Output, ProviderResource } from '@pulumi/pulumi';

interface NfsArgs {
  namespace: Output<string>;  
  provider: ProviderResource | undefined;
}

export const createNFSVolume = (args: NfsArgs) => {
  // Install the OpenEBS Helm chart.
  const nfsChart = new k8s.helm.v3.Chart('openebs-nfs', {
    chart: 'nfs-provisioner',
    namespace: args.namespace,
    fetchOpts: {
      repo: 'https://openebs.github.io/dynamic-nfs-provisioner'
    },
    values: {
      nfsStorageClass: {
        backendStorageClass: 'openebs-hostpath' // or your backend storage class name
      }
    }
  }, 
  { provider: args.provider });

  const localpvChart = new k8s.helm.v3.Chart('openebs-localpv', {
    chart: 'localpv-provisioner',
    namespace: args.namespace ,
    fetchOpts: {
      repo: 'https://openebs.github.io/dynamic-localpv-provisioner'
    },
    values: {
      openebsNDM: {
        enabled: false
      },
      deviceClass: {
        enabled: false
      }
    }
  }, 
  { provider: args.provider });

 const testNfsPvc = new k8s.core.v1.PersistentVolumeClaim("test-nfs-pvc", {
    metadata: {
        name: "many-nfs-pvc",
        namespace: args.namespace ,
    },
    spec: {
        accessModes: ["ReadWriteMany"],
        storageClassName: "openebs-kernel-nfs",
        resources: {
            requests: {
                storage: "2Gi"
            },
        },
    },
}, 
  { provider: args.provider });
// make a pod that mounts the nfs volume and sleeps\

 const testNfsPod = new k8s.core.v1.Pod("test-nfs-pod", {
    metadata: {
        name: "many-nfs-pod",
        namespace: args.namespace ,
    },
    spec: {
        containers: [{
            name: "many-nfs-pod",
            image: "busybox",
            command: ["sleep", "3000"],
            volumeMounts: [{
                mountPath: "/mnt",
                name: "many-nfs-pvc",
            }],
        }],
        volumes: [{
            name: "many-nfs-pvc",
            persistentVolumeClaim: {
                claimName: testNfsPvc.metadata.name,
            },
        }],
    },
  }, 
  { provider: args.provider });
};
