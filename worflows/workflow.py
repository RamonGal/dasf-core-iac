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


@script()
def run_script(message: str):
    print(message)


with Workflow(
    generate_name="dag-target-",
    entrypoint="dag-target",
    namespace="argo",
    arguments=Parameter(name="target", value="E"),
) as w:
    echo = Container(
        name="echo",
        inputs=Parameter(name="script"),
        image="python:3.10-slim-bullseye",
        command=["echo", "{{inputs.parameters.script}}"],
    )

    with DAG(
        name="dag-target",
    ):
        A = echo(name="A", arguments={"script": "A"}, deamon=True)
        B = echo(name="B", arguments={"script": "B"})
        C = run_script(name="C", arguments={"message": "C"})
        D = run_script(name="D", arguments={"message": "D"})
        E = run_script(name="E", arguments={"message": "Hello world!"})

        A >> B >> D
        A >> C >> D
        C >> E

w.create()
