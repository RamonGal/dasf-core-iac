from hera.workflows import DAG, Container, Parameter, Workflow, script, Artifact
from hera.auth import ArgoCLITokenGenerator
from hera.shared import global_config
import numpy as np

global_config.host = "http://127.0.0.1:2746"
global_config.token = ""
# Copy token value after "Bearer" from the `argo auth token` command  and argo cli
# global_config.token = ArgoCLITokenGenerator

# to enable token, modify the argo server config in the iac,
# remove:
# values: {
#         server: {
#           extraArgs: ['--auth-mode=server']
#         }
#       }


@script(outputs=Artifact(name="dataset", path="/tmp/dataset.npy"))
def create_dataset():
    data = np.arange(10)
    np.save("/tmp/dataset.npy", data)


with Workflow(
    generate_name="dasf-target-",
    entrypoint="dasf-target",
    namespace="dasf",
    arguments=Parameter(name="target", value="E"),
) as w:
    dask_kube_operator = Container(
        name="echo",
        inputs=[]
        image="kube-operator:latest",
        command=["python", "-m", "kubeoperator"],
        args=["{{inputs.parameters.scaling}}", "{{inputs.parameters.min}}", "{{inputs.parameters.max}}"],
        outputs=[
            Artifact(name="scheduler-address", path="/tmp/scheduler-address.txt"),
            Artifact(name="scheduler-port", path="/tmp/scheduler-port.txt"),
        ],
    )

    dasf = Container(
        name="print-message",
        image="alpine:latest",
        command=["sh", "-c"],
        args=["cat /tmp/message"],
        inputs=[Artifact(name="message", path="/tmp/message")],
    )

    with DAG(
        name="dasf-target",
    ):
        A = dask_kube_operator(name="A", arguments={  "scaling": "2"
            , "min": "1"
            , "max": "2"
        }
        , deamon=True)
       

        A >> B >> D
        A >> C >> D
        C >> E

w.create()
