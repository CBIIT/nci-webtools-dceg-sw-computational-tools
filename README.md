# nci-webtools-dceg-biomarker-evaluation

## CI/CD deployment

Deployments are managed by the GitHub Actions workflow [.github/workflows/biomarkerTools-deploy.yml](.github/workflows/biomarkerTools-deploy.yml).

### How deployment is triggered

- Trigger type: `workflow_dispatch` (manual run)
- Input: `tier`
- Allowed values: `dev`, `qa`, `stage`, `prod`

### Deployment process

The `Deploy BiomarkerTools` workflow performs the following high-level steps:

1. Checks out repository code.
2. Assumes AWS role `power-user-github-actions-cicd` in account `${{ secrets.AWS_ACCOUNT_ID }}` using OIDC.
3. Computes image tags and environment variables:
	- App name: `biomarkertools`
	- ECR repository: `${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/biomarkertools`
	- Backend image tags:
	  - `${IMAGE_TIER}-backend-${GITHUB_REF_NAME}-${TIMESTAMP}`
	  - `${IMAGE_TIER}-backend-${GITHUB_REF_NAME}-latest`
4. Retrieves required deployment settings from SSM Parameter Store under:
	- `/analysistools/${tier}/biomarkertools`
5. Builds and pushes backend Docker image from:
	- Context: `biomarkerTools`
	- Dockerfile: `biomarkerTools/docker/backend.dockerfile`
6. Renders ECS task definition template (`.github/aws/web.yml`) via `envsubst`.
7. Registers a new ECS task definition.
8. Validates deployment prerequisites (ECS service + network parameters).
9. Updates ECS service with forced new deployment.
10. Prunes old ECS task definition revisions (keeps latest 10).

### Environment mapping

The workflow maps deployment tier to image tier as follows:

| Deployment tier (`tier`) | Image tier (`IMAGE_TIER`) |
| --- | --- |
| `dev` | `development` |
| `qa` | `development` |
| `stage` | `release` |
| `prod` | `release` |

### Required SSM parameters

The workflow expects these SSM parameters (by name) under `/analysistools/${tier}/biomarkertools`:

- `ecs_cluster`
- `ecs_web_task`
- `ecs_web_service`
- `ecs_cpu_units`
- `ecs_memory_units`
- `role_arn`
- `efs_filesystem_id`
- `efs_access_point_id`
- `subnet_ids`
- `security_group_ids`

If any required value is missing, deployment fails with a clear error listing missing parameters/resources.
