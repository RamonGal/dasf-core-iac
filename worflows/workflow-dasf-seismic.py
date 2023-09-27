from hera.workflows import DAG, Container, Parameter, Workflow, script
from hera.shared import global_config

global_config.host = "http://127.0.0.1:2746"
global_config.token = (
    ""  # Copy token value after "Bearer" from the `argo auth token` command
)


@script()
def run_script(message: str):
    print(message)


with Workflow(
    generate_name="dag-target-",
    entrypoint="dag-target",
    namespace="argo",
    arguments=Parameter(name="target", value="E"),
) as w:
    dasf_scheduler = Container(
        name="dasf-scheduler",
        image="dasf-seismic:cpu",
        command=["dask", "scheduler"],
        working_dir="{{workflow.parameters.pwd}}",
        env={"HOME": "{{workflow.parameters.pwd}}"},
        volume_mounts={
            "{{workflow.parameters.pwd}}": {
                "bind": "{{workflow.parameters.pwd}}",
                "mode": "rw",
            }
        },
        network="host",
        daemon=True,
    )

    dasf_worker = Container(
        name="dasf-worker",
        inputs=Parameter(name="scheduler_address"),
        image="dasf-seismic:cpu",
        command=["dask", "worker", "{{inputs.parameters.scheduler_address}}"],
        working_dir="{{workflow.parameters.pwd}}",
        env={"HOME": "{{workflow.parameters.pwd}}"},
        volume_mounts={
            "{{workflow.parameters.pwd}}": {
                "bind": "{{workflow.parameters.pwd}}",
                "mode": "rw",
            }
        },
        network="host",
        daemon=True,
    )

    reference_script = Container(
        name="reference-script",
        inputs=Parameter(name="scheduler_address"),
        image="dasf-seismic:cpu",
        command=[
            "python3",
            "reference.py",
            "--data",
            "data/F3_train.npy",
            "--address",
            "{{inputs.parameters.scheduler_address}}",
        ],
        working_dir="{{workflow.parameters.pwd}}",
        env={"HOME": "{{workflow.parameters.pwd}}"},
        volume_mounts={
            "{{workflow.parameters.pwd}}": {
                "bind": "{{workflow.parameters.pwd}}",
                "mode": "rw",
            }
        },
        network="host",
    )

    with DAG(
        name="dag-target",
    ):
        scheduler_deployment = dasf_scheduler(name="scheduler-deployment", daemon=True)
        worker_deployment = dasf_worker(
            name="worker-deployment",
            arguments={
                "scheduler_address": scheduler_deployment.outputs["scheduler_address"]
            },
            daemon=True,
        )
        reference_deployment = reference_script(
            name="reference-deployment",
            arguments={
                "scheduler_address": scheduler_deployment.outputs["scheduler_address"]
            },
        )

        scheduler_deployment >> worker_deployment >> reference_deployment

w.create()
