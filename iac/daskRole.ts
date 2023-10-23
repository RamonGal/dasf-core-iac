import * as k8s from '@pulumi/kubernetes';

// Create the Role, returns the ServiceAccount
export const createDaskServiceAccount = (
  namespace: k8s.core.v1.Namespace
): k8s.core.v1.ServiceAccount => {
  const daskRole = new k8s.rbac.v1.Role('dask-role', {
    metadata: {
      namespace: namespace.metadata.name
    },
    rules: [
      {
        apiGroups: ['kubernetes.dask.org'],
        resources: [
          'daskclusters',
          'daskworkergroups',
          'daskworkergroups/scale',
          'daskjobs',
          'daskautoscalers'
        ],
        verbs: ['get', 'list', 'watch', 'patch', 'create', 'delete']
      },
      {
        apiGroups: [''], // indicates the core API group
        resources: [
          'pods',
          'pods/status',
          'pods/log',
          'services',
          'poddisruptionbudgets'
        ],
        verbs: ['get', 'list', 'watch', 'create', 'delete']
      }
    ]
  });

  // Create the ServiceAccount
  const daskCreatorServiceAccount = new k8s.core.v1.ServiceAccount(
    'dask-creator',
    {
      metadata: {
        namespace: namespace.metadata.name
      }
    }
  );

  // Create the RoleBinding
  const daskRoleBinding = new k8s.rbac.v1.RoleBinding('dask-role-binding', {
    metadata: {
      namespace: namespace.metadata.name
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Role',
      name: daskRole.metadata.name
    },
    subjects: [
      {
        kind: 'ServiceAccount',
        name: daskCreatorServiceAccount.metadata.name,
        namespace: namespace.metadata.name
      }
    ]
  });
  return daskCreatorServiceAccount;
};
