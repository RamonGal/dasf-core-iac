import argparse
import time

from dasf.transforms import Transform
from dasf.pipeline import Pipeline

from dasf.pipeline.executors import DaskPipelineExecutor
from dasf_seismic.attributes.complex_trace import (
    Hilbert,
    Envelope,
    InstantaneousPhase,
    CosineInstantaneousPhase,
    RelativeAmplitudeChange,
    AmplitudeAcceleration,
    InstantaneousFrequency,
    InstantaneousBandwidth,
    DominantFrequency,
    FrequencyChange,
    Sweetness,
    QualityFactor,
    ResponsePhase,
    ResponseFrequency,
    ResponseAmplitude,
    ApparentPolarity,
)
from dask.distributed import wait

from dasf.datasets import DatasetZarr
from dasf.transforms import Transform

try:
    import cupy as cp
except:
    pass
from dask.distributed import performance_report


transforms = {
    "hilbert": Hilbert,
    "envelope": Envelope,
    "instantaneous-phase": InstantaneousPhase,
    "cosine-instantaneous-phase": CosineInstantaneousPhase,
    "relative-amplitude-change": RelativeAmplitudeChange,
    "amplitude-acceleration": AmplitudeAcceleration,
    "instantaneous-frequency": InstantaneousFrequency,
    "instantaneous-bandwidth": InstantaneousBandwidth,
    "dominant-frequency": DominantFrequency,
    "frequency-change": FrequencyChange,
    "sweetness": Sweetness,
    "quality-factor": QualityFactor,
    "response-phase": ResponsePhase,
    "response-frequency": ResponseFrequency,
    "response-amplitude": ResponseAmplitude,
    "apparent-polarity": ApparentPolarity,
}


class SyncPersist(Transform):
    def transform(self, X):
        X = X.persist()
        wait(X)
        return X


class AsyncPersist(Transform):
    def transform(self, X):
        return X.persist()


class Data(Transform):
    def transform(self, X):
        return X._data


class SaveZarr(Transform):
    def __init__(self, output):
        self._output = output

    def transform(self, X):
        X = X.to_zarr(self._output)
        return X


class Finalize(Transform):
    def _lazy_transform_cpu(self, X, **kwargs):
        return X

    def _lazy_transform_gpu(self, X, **kwargs):
        return X.map_blocks(cp.asnumpy)

    def _transform_cpu(self, X, **kwargs):
        return X

    def _transform_gpu(self, X, **kwargs):
        return cp.asarray(X)


def create_pipeline(
    executor, dataset_path: str, output_path: str, transform_name: str, chunks: dict
):
    # Instantiate the dataset
    dataset = DatasetZarr(
        name="Input dataset", root=dataset_path, download=False, chunks=chunks
    )

    # Instantiate the transforms
    data = Data()
    transform = transforms[transform_name]()
    finalizer = Finalize()
    save = SaveZarr(output_path)

    # Create the pipeline
    pipeline = Pipeline(f"Calculating {transform_name}...", executor=executor)
    pipeline.add(data, X=dataset)
    pipeline.add(transform, X=data)
    pipeline.add(finalizer, X=transform)
    pipeline.add(save, X=finalizer)

    # Return the pipeline and the finalizer
    return pipeline, save


if __name__ == "__main__":
    # Argument parser
    # save a .txt file to the /shared folder
    with open("/shared/test.txt", "w") as f:
        f.write("Hello, world!")

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-d", "--dataset", type=str, required=True, help="Path to dataset"
    )
    parser.add_argument(
        "-o", "--output", type=str, required=True, help="Path to output path"
    )
    parser.add_argument(
        "-a",
        "--attribute",
        type=str,
        choices=list(transforms.keys()),
        required=True,
        help="Attribute to calculate",
    )
    parser.add_argument(
        "-x",
        "--x",
        type=int,
        default=128,
        help="Chunk size on X dim",
    )

    parser.add_argument(
        "-y",
        "--y",
        type=int,
        default=128,
        help="Chunk size on y dim",
    )

    parser.add_argument(
        "-z",
        "--z",
        type=int,
        default=-1,
        help="Chunk size on z dim",
    )

    parser.add_argument(
        "-i",
        "--scheduler-ip",
        type=str,
        required=False,
        default=None,
        help="scheduler address",
    )

    parser.add_argument(
        "-s", "--scheduler-port", type=int, default=8786, help="scheduler port"
    )

    parser.add_argument(
        "-w", "--workers", type=int, default=None, help="number of workers to use"
    )

    parser.add_argument(
        "-t", "--threads", type=int, default=None, help="number of threads per worker"
    )
    parser.add_argument("-r", "--run", type=str, choices=["cpu", "gpu"], help="run on")

    args = parser.parse_args()
    print(args)
    cluster_kwargs = {
        "n_workers": args.workers,
        "threads_per_worker": args.threads,
        "scheduler_port": args.scheduler_port,
    }

    for key in list(cluster_kwargs.keys()):
        if cluster_kwargs[key] is None:
            cluster_kwargs.pop(key)

    # Create the pipeline executor
    if args.scheduler_ip is not None:
        if args.run == "cpu":
            executor = DaskPipelineExecutor(
                local=False,
                use_gpu=False,
                address=args.scheduler_ip,
                port=args.scheduler_port,
            )
        else:
            executor = DaskPipelineExecutor(
                local=False,
                use_gpu=True,
                address=args.scheduler_ip,
                port=args.scheduler_port,
            )
    else:
        if args.run == "cpu":
            executor = DaskPipelineExecutor(local=False, use_gpu=False, daskjob=True)
        else:
            executor = DaskPipelineExecutor(local=False, use_gpu=True, daskjob=True)

    # Run the pipeline
    print("Starting...")
    start = time.time()

    print("Creating pipeline...")
    pipeline, last_task = create_pipeline(
        executor,
        dataset_path=args.dataset,
        output_path=args.output,
        transform_name=args.attribute,
        chunks={0: args.x, 1: args.y, 2: args.z},
    )
    filename = f"{args.attribute}_{args.run}_w{args.workers}_t{args.threads}_{args.x}-{args.y}-{args.z}"
    with performance_report(filename=f"{filename}.html"):
        print("Running pipeline...")
        pipeline.run()

    end = time.time()
    print(f"Done! It took {end-start:.3f} seconds")
