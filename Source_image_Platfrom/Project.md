User pastes GitHub URL
        ↓
Backend clones repository
        ↓
Detect/build source automatically
        ↓
Railpack + BuildKit
        ↓
OCI/Docker image
        ↓
Push to registry
        ↓
Return:
docker pull registry.yoursite.com/user/app:tag

┌──────────────────────────────────────────────┐
│ Paste GitHub URL                             │
│                                              │
│ github.com/kiran/my-project                  │
│                                              │
│              [ Build Image ]                 │
└──────────────────────────────────────────────┘

                     ↓

              Automatically detect
              React / Node / Python
                     ↓
               Build container
                     ↓

┌──────────────────────────────────────────────┐
│ ✅ Image ready                               │
│                                              │
│ docker pull xyz.io/kiran/my-project:latest   │
└──────────────────────────────────────────────┘

For DeployForge, this is actually useful: you could build exactly that UX on top of Railpack + BuildKit + your own registry/GHCR/ECR: