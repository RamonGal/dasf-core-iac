#!/usr/bin/env python3

from dasf.utils.types import is_dask_array
from dasf.utils.utils import is_gpu_supported
from dasf.utils.utils import is_dask_supported
from dasf.utils.utils import is_dask_gpu_supported


def task_handler(func):
    def wrapper(*args):
        cls = args[0]
        new_args = args[1:]
        func_name = func.__name__
        func_type = ""
        arch = "cpu"

        if is_dask_gpu_supported():
            arch = "gpu"
            func_type = "_lazy"
        elif is_dask_supported():
            arch = "cpu"
            func_type = "_lazy"
        elif is_gpu_supported():
            arch = "gpu"

        wrapper_func_attr = f"{func_type}_{func_name}_{arch}"

        if hasattr(cls, wrapper_func_attr):
            return getattr(cls, wrapper_func_attr)(*new_args)
        else:
            return func(*new_args)

    return wrapper


def fetch_args_from_dask(func):
    def wrapper(*args, **kwargs):
        new_kwargs = dict()
        new_args = []

        for k, v in kwargs.items():
            if is_gpu_array(v):
                new_kwargs[k] = v.compute()
            else:
                new_kwargs[k] = v

        for v in args:
            if is_gpu_array(v):
                new_args.append(v.compute())
            else:
                new_args.append(v)

        return func(*new_args, **new_kwargs)

    return wrapper


def fetch_args_from_gpu(func):
    def wrapper(*args, **kwargs):
        new_kwargs = dict()
        new_args = []

        for k, v in kwargs.items():
            if is_dask_array(v):
                new_kwargs[k] = v.get()
            else:
                new_kwargs[k] = v

        for v in args:
            if is_dask_array(v):
                new_args.append(v.get())
            else:
                new_args.append(v)

        return func(*new_args, **new_kwargs)

    return wrapper
