from argo.workflows.client import (
    V1alpha1Workflow,
    V1alpha1WorkflowSpec,
    V1alpha1DAGTemplate,
    V1alpha1Template,
    ApiClient,
    Configuration,
    WorkflowServiceApi,
)


def create_argo_pipeline(dag, image, retry, input_param, output_param):
    """
    Create an Argo pipeline using the provided parameters.

    Args:
        dag (dict): A dictionary representing the DAG of tasks. Keys are task names, values are lists of dependencies.
        image (str): The docker image to be used in each step of the workflow.
        retry (int): The number of retry attempts for each step.
        input_param (dict): A dictionary representing the input parameters for the workflow.
        output_param (dict): A dictionary representing the output parameters for the workflow.

    Returns:
        V1alpha1Workflow: A workflow object representing the created Argo workflow.
    """

    # Initialize workflow templates list
    templates = []

    # Create a template for each task in the DAG
    for task_name, dependencies in dag.items():
        template = V1alpha1Template(
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

    # Create the workflow spec
    workflow_spec = V1alpha1WorkflowSpec(
        entrypoint="main",
        templates=templates,
    )

    # Create the main workflow template (DAG template)
    dag_template = V1alpha1DAGTemplate(
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

    # Create the workflow object
    workflow = V1alpha1Workflow(
        metadata={"generateName": "argo-dag-workflow-"},
        spec=workflow_spec,
    )

    # Set the DAG template as the entrypoint template
    workflow.spec.entrypoint = "main"
    workflow.spec.templates = [V1alpha1Template(name="main", dag=dag_template)]

    # Submit the workflow to the Argo server
    config = Configuration()
    config.host = "http://argo-server:2746"
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
