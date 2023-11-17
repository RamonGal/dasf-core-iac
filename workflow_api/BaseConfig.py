class BaseConfig:
    def __init__(self, namespace: str, service_account_name: str, base_image: str):
        self.namespace = namespace
        self.service_account_name = service_account_name
        self.base_image = base_image
