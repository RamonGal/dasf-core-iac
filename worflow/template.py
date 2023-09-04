from argo.workflows.client.models import *

# Define the DAG template
dag_template = V1alpha1Template(
    name="my-dag",
    dag=V1alpha1DAGTemplate(
        tasks=[
            # First task
            V1alpha1DAGTask(
                name="first-task",
                template="do-action",
                arguments=V1alpha1Arguments(
                    parameters=[V1alpha1Parameter(name="action", value="first-action")]
                ),
            ),
            # Second task that depends on the first task
            V1alpha1DAGTask(
                name="second-task",
                dependencies=["first-task"],
                template="do-action",
                arguments=V1alpha1Arguments(
                    parameters=[V1alpha1Parameter(name="action", value="second-action")]
                ),
            ),
        ]
    ),
)

# Define the action template
action_template = V1alpha1Template(
    name="do-action",
    inputs=V1alpha1Inputs(parameters=[V1alpha1Parameter(name="action")]),
    container=V1alpha1Container(
        name="action-container",
        image="your-registry/your-image:latest",
        command=["/path/to/script/in/image.sh"],
        args=["{{inputs.parameters.action}}"],
    ),
)

# Create the Workflow
workflow = V1alpha1Workflow(
    metadata=V1ObjectMeta(generate_name="my-dag-"),
    spec=V1alpha1WorkflowSpec(
        entrypoint="my-dag", templates=[dag_template, action_template]
    ),
)

# Submit the workflow to Argo (this part depends on your setup, namespace, etc.)
