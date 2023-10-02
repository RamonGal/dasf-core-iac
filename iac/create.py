from dask_kubernetes.operator import KubeCluster
from dask.distributed import Client

cluster = KubeCluster(name="mycluster")
cluster.adapt(minimum=1, maximum=10)
client = Client(cluster)
print(client)
