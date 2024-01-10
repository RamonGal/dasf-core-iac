class BaseConfig:
    def __init__(self, namespace: str, service_account_name: str, dasf_base_image: str):
        self.namespace = namespace
        self.service_account_name = service_account_name
        self.dasf_base_image = dasf_base_image
