from pprint import pprint

from argo_workflows import Configuration, ApiClient
from argo_workflows.api.workflow_service_api import WorkflowServiceApi
from argo_workflows.model.io_argoproj_workflow_v1alpha1_workflow import (
    IoArgoprojWorkflowV1alpha1Workflow,
)
from argo_workflows.model.io_argoproj_workflow_v1alpha1_workflow_spec import (
    IoArgoprojWorkflowV1alpha1WorkflowSpec,
)
from argo_workflows.model.io_argoproj_workflow_v1alpha1_template import (
    IoArgoprojWorkflowV1alpha1Template,
)
from argo_workflows.model.io_argoproj_workflow_v1alpha1_dag_template import (
    IoArgoprojWorkflowV1alpha1DAGTemplate,
)


def create_argo_pipeline(dag, image, retry, input_param, output_param):
    """
    Create an Argo pipeline using the provided parameters.
    """

    templates = []

    # Create a template for each task in the DAG
    for task_name, dependencies in dag.items():
        template = IoArgoprojWorkflowV1alpha1Template(
            name=task_name,
            container={
                "image": image,
                "name": task_name,
                # Add additional container specs if required
            },
            inputs={
                "parameters": [
                    {"name": key, "value": value} for key, value in input_param.items()
                ]
                + [
                    {
                        "name": f"output_from_{dep}",
                        "valueFrom": {"parameter": f"{dep}.outputs.parameters.output1"},
                    }
                    for dep in dependencies
                ]
            },
            outputs={
                "parameters": [
                    {"name": key, "valueFrom": {"path": value}}
                    for key, value in output_param.items()
                ]
            },
            retry_strategy={"limit": retry},
        )
        templates.append(template)

    dag_template = IoArgoprojWorkflowV1alpha1DAGTemplate(
        tasks=[
            {
                "name": key,
                "template": key,
                "dependencies": val,
                "arguments": {
                    "parameters": [
                        {
                            "name": f"output_from_{dep}",
                            "value": f"{{{dep}.outputs.parameters.output1}}",
                        }
                        for dep in val
                    ]
                },
            }
            for key, val in dag.items()
        ]
    )

    templates.append(IoArgoprojWorkflowV1alpha1Template(name="main", dag=dag_template))

    workflow_spec = IoArgoprojWorkflowV1alpha1WorkflowSpec(
        entrypoint="main",
        templates=templates,
    )

    workflow = IoArgoprojWorkflowV1alpha1Workflow(
        metadata={"generateName": "argo-dag-workflow-"},
        spec=workflow_spec,
    )

    # Submit the workflow to the Argo server
    config = Configuration(host="http://argo-server:2746")
    with ApiClient(config) as api_client:
        api_instance = WorkflowServiceApi(api_client)
        created_workflow = api_instance.create_workflow("argo", workflow)

    return created_workflow


# Example usage
dag = {
    "task1": [],
    "task2": ["task1"],
    "task3": ["task1", "task2"],
}
image = "my-docker-image:latest"
retry = 3
input_param = {"param1": "value1"}
output_param = {"output1": "/path/to/output1"}

create_argo_pipeline(dag, image, retry, input_param, output_param)
