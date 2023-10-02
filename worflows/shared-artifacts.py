# como passar dados entre os containers e como passar dados entre os workflows com um volume compartilhado
# # @script(inputs=Artifact(name="my-artifact", path="/tmp/file"))
# def read_artifact():
#     with open("/tmp/file") as a_file:  # Repeating "/tmp/file" is prone to human error!
#         print(a_file.read())

# # or

# MY_PATH = "/tmp/file"  # Now accessible outside of the function scope!
# @script(inputs=Artifact(name="my-artifact", path=MY_PATH))
# def read_artifact():
#     with open(MY_PATH) as a_file:
#         print(a_file.read())
# By using annotations we can avoid repeating the path of the file, and the function can use the variable directly as a Path object, with its value already set to the given path:


# @script(constructor="runner")
# def read_artifact(an_artifact: Annotated[Path, Artifact(name="my-artifact", path="/tmp/file")]):
#     print(an_artifact.read_text())
# from hera.workflows import (
#     Container,
#     S3Artifact,
#     Workflow,
#     models as m,
# )

# with Workflow(generate_name="input-artifact-s3-", entrypoint="input-artifact-s3-example") as w:
#     Container(
#         name="input-artifact-s3-example",
#         image="debian:latest",
#         command=["sh", "-c"],
#         args=["ls -l /my-artifact"],
#         inputs=[
#             S3Artifact(
#                 name="my-art",
#                 path="/my-artifact",
#                 endpoint="s3.amazonaws.com",
#                 bucket="my-bucket-name",
#                 key="path/in/bucket",
#              # region="us-west-2",
#                 access_key_secret=m.SecretKeySelector(
#                     name="my-s3-credentials",
#                     key="accessKey",
#                 ),
#                 secret_key_secret=m.SecretKeySelector(
#                     name="my-s3-credentials",
#                     key="secretKey",
#                 ),
#             ),
#         ],
#     )
