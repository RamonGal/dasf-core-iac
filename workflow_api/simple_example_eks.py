from hera.workflows import (
    Workflow,
    DAG,
    Parameter,
    Container,
    Resource,
    NFSVolume,
    models,
)
from BaseConfig import BaseConfig
from hera.shared import global_config
from Utility import get_manifest

global_config.host = (
    "http://k8s-dasfauto-albingre-fbdb435d02-649557573.us-east-1.elb.amazonaws.com"
)
global_config.token = ""
# Copy token value after "Bearer" from the `argo auth token` command  and argo cli
# from hera.auth import ArgoCLITokenGenerator
# global_config.token = ArgoCLITokenGenerator

# to enable token, modify the argo server config in the iac
# remove:
# values: {
#         server: {
#           extraArgs: ['--auth-mode=server']
#         }
#       }


config = BaseConfig(
    namespace="dasf-autoscaler-dev-cluster-namespace",
    service_account_name="dask-creator-9af354ea",
    base_image="245983579475.dkr.ecr.us-east-1.amazonaws.com/iac-eks-ecr-repo-repo-f4a9343:v1",
)

with Workflow(
    generate_name="dag-target-",
    entrypoint="dag-target",
    namespace=config.namespace,
    arguments=Parameter(name="target", value="E"),
    volumes=[
        models.Volume(
            name="shared", persistent_volume_claim={"claim_name": "many-nfs-pvc"}
        )
    ],
) as w:
    sendData = Container(
        name="send-data",
        image="245983579475.dkr.ecr.us-east-1.amazonaws.com/iac-eks-ecr-repo-repo-f4a9343:v2",
        command=["sh", "-c"],
        service_account_name=config.service_account_name,
        args=["cp -r /f3.zarr /shared/"],
        volume_mounts=[
            models.VolumeMount(name="shared", mount_path="/shared"),
        ],
    )
    dask_job = Resource(
        name="dask-job",
        action="create",
        service_account_name=config.service_account_name,
        volume_mounts=[
            models.VolumeMount(name="shared", mount_path="/shared"),
        ],
        manifest=get_manifest(
            namespace=config.namespace,
            image=config.base_image,
            service_account_name=config.service_account_name,
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
                "/shared/f3.zarr",
                "-o",
                "/shared/output.zarr",
            ],
            nfsname="many-nfs-pvc",
        ),
    )

    with DAG(
        name="dag-target",
    ):
        A = sendData(name="A")
        B = dask_job(name="B")

        A >> B

w.create()
