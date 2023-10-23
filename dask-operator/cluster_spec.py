# get cluster name from input args
import sys

cluster_name = sys.argv[1]


from dasf.datasets import DatasetArray
from dasf.datasets import DatasetLabeled


class MyMakeBlobs(DatasetLabeled):
    def __init__(self):
        super().__init__(name="My Own make_blobs()", download=False)

        # Let's assign the train and val data.
        self._train = DatasetArray(
            name="X", download=False, root="/X.npy", chunks=(5000, 2)
        )
        self._val = DatasetArray(name="y", download=False, root="/y.npy", chunks=(5000))


make_blobs = MyMakeBlobs()
from dasf.transforms import Normalize

normalize = Normalize()

"""
Part 3
"""
from dasf.pipeline.executors import DaskPipelineExecutor
from dask_kubernetes.operator import KubeCluster, make_cluster_spec

# get namespace from env
import os

namespace = os.environ.get("NAMESPACE", "dask-operator")
image_dask = os.environ.get("IMAGE_DASK", "dasf:cpu")


def create_dasf_cluster(
    name="cluster-spec-name",
    namespace=namespace,
    adapt=False,
    minimum=1,
    maximum=2,
    replicas=1,
    use_gpu=False,
    image_dask="dasf:cpu",
    **kwargs,
):
    print(image_dask)
    spec = make_cluster_spec(name=name, n_workers=replicas, image=image_dask)
    spec = adapt_worker_spec(spec, use_gpu=use_gpu)
    cluster = KubeCluster(
        namespace=namespace, custom_cluster_spec=spec, resource_timeout=300
    )
    # use adapt to scale the cluster up and down automatically, or scale to a fixed number of workers
    if adapt:
        cluster.adapt(minimum=minimum, maximum=maximum)
    else:
        cluster.scale(replicas)
    return cluster


def adapt_worker_spec(spec, use_gpu=False):
    # Modify the worker pod spec to use a GPU-enabled image and request GPU resources
    if use_gpu:
        spec["spec"]["worker"]["spec"]["containers"][0][
            "image"
        ] = "nvcr.io/nvidia/rapidsai/rapidsai-core:23.04-cuda11.8-runtime-ubuntu22.04-py3.10"
        spec["spec"]["worker"]["spec"]["containers"][0]["args"] = [
            "dask-cuda-worker",
            "$(DASK_SCHEDULER_ADDRESS)",
            "--rmm-pool-size",
            "10GB",
        ]
        spec["spec"]["worker"]["spec"]["containers"][0]["resources"] = {}
        spec["spec"]["worker"]["spec"]["containers"][0]["resources"]["limits"] = {}
        spec["spec"]["worker"]["spec"]["containers"][0]["resources"]["requests"] = {}
        spec["spec"]["worker"]["spec"]["containers"][0]["resources"]["limits"][
            "nvidia.com/gpu"
        ] = 1
        spec["spec"]["worker"]["spec"]["containers"][0]["resources"]["requests"][
            "nvidia.com/gpu"
        ] = 1

    return spec


# Create a Dask cluster
cluster = create_dasf_cluster(
    use_gpu=False,
    name=cluster_name,
    namespace=namespace,
    image_dask=image_dask,
    replicas=3,
)

dask = DaskPipelineExecutor(cluster=cluster, use_gpu=False)

"""
Part 4
"""
from dasf.ml.cluster import KMeans
from dasf.ml.cluster import SOM

kmeans = KMeans(n_clusters=3, max_iter=10)
from dasf.transforms import PersistDaskData

persist_kmeans = PersistDaskData()

"""
Part 5
"""
from dasf.pipeline import Pipeline

pipeline = Pipeline("A KMeans and SOM Pipeline", executor=dask)

pipeline.add(normalize, X=make_blobs._train).add(kmeans.fit_predict, X=normalize).add(
    persist_kmeans, X=kmeans.fit_predict
)

print("Pipeline created")
pipeline.run()
print("Pipeline finished")
result_kmeans = pipeline.get_result_from(persist_kmeans).compute()
cluster.close()
print("cluster closed")
print(result_kmeans)
