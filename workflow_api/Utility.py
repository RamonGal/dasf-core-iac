import jinja2


def get_manifest(namespace, image, service_account_name, container_args, nfsname):
    templateLoader = jinja2.FileSystemLoader(searchpath="./")
    templateEnv = jinja2.Environment(loader=templateLoader)
    template = templateEnv.get_template("dask_job_template_cpu.yml")

    formatted_args = "\n            - " + "\n            - ".join(
        [f'"{arg}"' for arg in container_args]
    )

    return template.render(
        namespace=namespace,
        serviceAccountName=service_account_name,
        image=image,
        formatted_args=formatted_args,
        nfsname=nfsname,
    )
