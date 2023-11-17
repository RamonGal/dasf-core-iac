from hera.workflows import (
    DAG,
    Container,
    Parameter,
    Workflow,
    script,
    Resource,
    NFSVolume,
    models,
)
from hera.auth import ArgoCLITokenGenerator
from hera.shared import global_config

global_config.host = "http://127.0.0.1:2746"
global_config.token = ""
# Copy token value after "Bearer" from the `argo auth token` command  and argo cli
# global_config.token = ArgoCLITokenGenerator

# to enable token, modify the argo server config in the iac
# remove:
# values: {
#         server: {
#           extraArgs: ['--auth-mode=server']
#         }
#       }


# these informations are usually stored on a secrets manager upon the pulumi deployment,
# and passed as env variable or api (example, aws secrets manager)
serviceAccountName = "dask-creator-27448b44"
namespace = "dasf-da121b4a"
base_image = "dasf-seismic:cpu"
inputzarr = "/shared/f3.zarr"
outputzarr = "/shared/f3out.zarr"
nfsname = "many-nfs-pvc"


# dask job manifest
def get_manifest(namespace, image, serviceAccountName, container_args):
    formatted_args = "\n            - " + "\n            - ".join(
        [f'"{arg}"' for arg in container_args]
    )
    return rf"""
apiVersion: kubernetes.dask.org/v1
kind: DaskJob
metadata:  
  generateName: dask-jobs-
  namespace: {namespace}
spec:
  job:
    spec:
      serviceAccountName: {serviceAccountName}
      containers:
        - name: job
          image:  "{image}"
          imagePullPolicy: "IfNotPresent"
          args: {formatted_args}
          volumeMounts:
            - name: shared
              mountPath: /shared 
      volumes:
        - name: shared
          persistentVolumeClaim:
            claimName: {nfsname}

  cluster:
    spec:
      worker:
        replicas: 2
        spec:
          containers:
            - name: worker
              image: "{image}"
              imagePullPolicy: "IfNotPresent"
              args:
                - dask-worker
                - --name
                - $(DASK_WORKER_NAME)
                - --dashboard
                - --dashboard-address
                - "8788"
              ports:
                - name: http-dashboard
                  containerPort: 8788
                  protocol: TCP
              env:
                - name: WORKER_ENV
                  value: hello-world # We dont test the value, just the name
      scheduler:
        spec:
          containers:
            - name: scheduler
              image: "{image}"
              imagePullPolicy: "IfNotPresent"
              args:
                - dask-scheduler
              ports:
                - name: tcp-comm
                  containerPort: 8786
                  protocol: TCP
                - name: http-dashboard
                  containerPort: 8787
                  protocol: TCP
              readinessProbe:
                httpGet:
                  port: http-dashboard
                  path: /health
                initialDelaySeconds: 5
                periodSeconds: 10
              livenessProbe:
                httpGet:
                  port: http-dashboard
                  path: /health
                initialDelaySeconds: 15
                periodSeconds: 20
              env:
                - name: SCHEDULER_ENV
                  value: hello-world
        service:
          type: ClusterIP
          selector:
            dask.org/cluster-name: simple-job
            dask.org/component: scheduler
          ports:
            - name: tcp-comm
              protocol: TCP
              port: 8786
              targetPort: "tcp-comm"
            - name: http-dashboard
              protocol: TCP
              port: 8787
              targetPort: "http-dashboard"
"""


with Workflow(
    generate_name="dag-target-",
    entrypoint="dag-target",
    namespace="dasf-da121b4a",
    arguments=Parameter(name="target", value="E"),
    volumes=[
        models.Volume(
            name="shared", persistent_volume_claim={"claim_name": "many-nfs-pvc"}
        )
    ],
) as w:
    sendData = Container(
        name="send-data",
        image="senddata:cpu",
        command=["sh", "-c"],
        args=["cp -r /f3.zarr /shared/"],
        volume_mounts=[
            models.VolumeMount(name="shared", mount_path="/shared"),
        ],
    )
    dask_job = Resource(
        name="dask-job",
        action="create",
        service_account_name=serviceAccountName,
        volume_mounts=[
            models.VolumeMount(name="shared", mount_path="/shared"),
        ],
        manifest=get_manifest(
            namespace=namespace,
            image=base_image,
            serviceAccountName=serviceAccountName,
            container_args=[
                "python",
                "attribute_extractor.py",
                "-x",
                "128",
                "-y",
                "128",
                "-z",
                "-1",
                "-a",
                "envelope",
                "-r",
                "cpu",
                "-d",
                inputzarr,
                "-o",
                outputzarr,
            ],
        ),
    )

    with DAG(
        name="dag-target",
    ):
        A = sendData(name="A")
        B = dask_job(name="B")

        A >> B
        # for dag dependencies:
        # define B, then A as a dependency of B
        # A >> B >> C >> D >> E, e.g.
w.create()
# serialized_workflow = w.to_dict()
# import json

# # Print the serialized workflow
# print(json.dumps(serialized_workflow, indent=2))
