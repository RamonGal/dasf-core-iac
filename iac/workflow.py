from hera.workflows import DAG, Container, Parameter, Workflow, script
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

pod_spec_patch = '{"serviceAccountName": "dask-creator-ad7a5f7a"}'


with Workflow(
    generate_name="dag-target-",
    entrypoint="dag-target",
    namespace="dasf-df6615d5",
    arguments=Parameter(name="target", value="E"),
) as w:
    dasf = Container(
        name="dasf",
        image="dasf:cpu",
        command=["python", "cluster_spec.py", "cluster"],
        env={
            "NAMESPACE": "dasf-df6615d5",
            "IMAGE_DASK": "dasf:cpu",
        },
        pod_spec_patch=pod_spec_patch,
    )

    with DAG(
        name="dag-target",
    ):
        A = dasf(message="A")

        A

w.create()
