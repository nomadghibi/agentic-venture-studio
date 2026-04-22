# RBAC_MATRIX.md

## Roles
- Founder
- Product Lead
- Research Reviewer
- Technical Architect
- Growth Lead
- Finance Reviewer
- Builder
- Admin
- Viewer

## Permission Matrix

| Permission | Founder | Product Lead | Research Reviewer | Technical Architect | Growth Lead | Finance Reviewer | Builder | Admin | Viewer |
|---|---|---|---|---|---|---|---|---|---|
| View dashboard | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| View opportunities | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Create manual opportunity | Y | Y | Y | N | N | N | N | Y | N |
| Edit opportunity metadata | Y | Y | Y | N | N | N | N | Y | N |
| Trigger discovery jobs | Y | Y | Y | N | N | N | N | Y | N |
| Trigger validation reports | Y | Y | Y | N | N | N | N | Y | N |
| Trigger feasibility reports | Y | Y | N | Y | N | N | N | Y | N |
| Trigger monetization reports | Y | Y | N | N | N | Y | N | Y | N |
| Generate PRD/artifacts | Y | Y | N | Y | N | N | N | Y | N |
| Approve validation | Y | Y | Y | N | N | N | N | Y | N |
| Approve feasibility | Y | Y | N | Y | N | N | N | Y | N |
| Approve monetization | Y | Y | N | N | N | Y | N | Y | N |
| Approve build | Y | Y | N | Y | N | Y | N | Y | N |
| View ventures | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Create venture | Y | Y | N | Y | N | N | N | Y | N |
| Transition venture stage | Y | Y | N | Y | Y | N | N | Y | N |
| Add metrics | Y | Y | N | N | Y | Y | N | Y | N |
| View approvals queue | Y | Y | Y | Y | Y | Y | N | Y | N |
| Review approvals | Y | Y | Y | Y | N | Y | N | Y | N |
| View agent runs | Y | Y | Y | Y | N | N | Y | Y | N |
| View knowledge base | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Manage users/roles | N | N | N | N | N | N | N | Y | N |
| Configure system settings | N | N | N | N | N | N | N | Y | N |

## Notes
- Founder has broad business control.
- Admin manages platform-level administration.
- Product Lead coordinates opportunity progression and artifact generation.
- Technical Architect owns technical feasibility and architecture approvals.
- Finance Reviewer should review monetization and higher-cost build decisions.
- Viewer has read-only access.
