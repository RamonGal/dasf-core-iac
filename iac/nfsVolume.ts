import * as k8s from '@pulumi/kubernetes';

interface NfsArgs {
  namespace: k8s.core.v1.Namespace;
  port: number;
  serviceAccount: k8s.core.v1.ServiceAccount; 
}

export const createNFSVolume = (args: NfsArgs) => {
  // Install the OpenEBS Helm chart.
  const nfsChart = new k8s.helm.v3.Chart('openebs-nfs', {
    chart: 'nfs-provisioner',
    namespace: args.namespace.metadata.name,
    fetchOpts: {
      repo: 'https://openebs.github.io/dynamic-nfs-provisioner'
    },
    values: {
      nfsStorageClass: {
        backendStorageClass: 'openebs-hostpath' // or your backend storage class name
      }
    }
  });

  const localpvChart = new k8s.helm.v3.Chart('openebs-localpv', {
    chart: 'localpv-provisioner',
    namespace: args.namespace.metadata.name,
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
  });

 const testNfsPvc = new k8s.core.v1.PersistentVolumeClaim("test-nfs-pvc", {
    metadata: {
        name: "many-nfs-pvc",
        namespace: args.namespace.metadata.name,
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
});
// make a pod that mounts the nfs volume and sleeps\

 const testNfsPod = new k8s.core.v1.Pod("test-nfs-pod", {
    metadata: {
        name: "many-nfs-pod",
        namespace: args.namespace.metadata.name,
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
  });
};
