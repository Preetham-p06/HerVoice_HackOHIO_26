# HerVoice design system

A calm editorial interface with a warm-white canvas, restrained botanical artwork, readable forms and familiar navigation. The UI/UX skill informed accessibility and interaction decisions; its generic dark dashboard recommendation was overridden by the supplied brief's warm, discreet visual direction.

| Token | Value |
| --- | --- |
| Canvas | `#F7F7F2` |
| Surface | `#FFFFFF` |
| Text | `#172F2C` |
| Secondary text | `#56685E` |
| Primary action | `#276252`, hover `#194E40` |
| Border | `#DCE3DB` |
| Selected / muted surface | `#EDF2E9` |
| Spacing | 4/8px base, 12/16/24/32px groups |
| Card radius | 8–10px |
| Body | System sans serif, 16px, 1.65 line height |
| Display | Local Georgia serif; no external font requests |

Shared Button, Field, Badge, public/staff shells, table, event row, source card, error/notice, progress steps and composer establish consistency. Lucide is the single icon family. Botanical artwork is original CSS; the R3F companion uses original code geometry.

Public maximum width is 1120px; requests 760px including padding; chats 840px. Below 650px, task cards and details stack, staff navigation becomes a compact horizontal group, and tables scroll inside their own region. Touch controls generally use 44px minimum targets, with visible focus rings, skip navigation, associated field labels and status announcements. Wizard headings receive focus when advancing. Reduced motion disables transitions and continuous 3D frames.

Content distinguishes prepared files, persisted requests, intake receipt and human review. It never claims help has been dispatched, a person visited, partnerships, user counts or clinically validated outcomes. Every synthetic organization/session and deterministic conversation is labeled.

Axe WCAG 2 A/AA and 2.1 AA tagging was run through the development-only `#audit` diagnostic. Initial home contrast failures were fixed; the next home scan returned zero violations. Automated results are not a WCAG certification. See verification.md for additional screen checks and remaining manual-review scope.
