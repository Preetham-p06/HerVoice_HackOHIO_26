# HerVoice design system

A U.S.-first care-service interface with blue-and-white surfaces, direct help choices, readable sans-serif typography, and elevated high-contrast buttons. This visual direction does not imply hospital affiliation or clinical care. The UI/UX skill informed accessibility and interaction decisions; its generic dark dashboard recommendation was overridden by the supplied brief's warm, discreet visual direction.

| Token | Value |
| --- | --- |
| Canvas | `#F4F8FB` |
| Surface | `#FFFFFF` |
| Text | `#17354A` |
| Secondary text | `#4C6474` |
| Primary action | `#075A86`, hover `#064769` |
| Border | `#CFDEE8` |
| Selected / muted surface | `#EAF3FA` |
| Spacing | 4/8px base, 12/16/24/32px groups |
| Card radius | 8–10px |
| Body | System sans serif, 16px, 1.65 line height |
| Display | Local system sans serif; no external font requests |

Shared Button, Field, Badge, public/staff shells, table, event row, source card, error/notice, progress steps and composer establish consistency. Lucide is the single icon family. Botanical artwork is original CSS; the R3F studio uses an attributed rigged character, with its separate asset license documented in `companion.md`.

Public maximum width is 1120px; requests 760px including padding; chats 840px. Below 650px, task cards and details stack, staff navigation becomes a compact horizontal group, and tables scroll inside their own region. Touch controls generally use 44px minimum targets, with visible focus rings, skip navigation, associated field labels and status announcements. Wizard headings receive focus when advancing. Reduced motion disables transitions and continuous 3D frames.

Content distinguishes prepared files, persisted requests, intake receipt and human review. It never claims help has been dispatched, a person visited, partnerships, user counts or clinically validated outcomes. Every synthetic organization/session and deterministic conversation is labeled.

Axe WCAG 2 A/AA and 2.1 AA tagging was run through the development-only `#audit` diagnostic. Initial home contrast failures were fixed; the next home scan returned zero violations. Automated results are not a WCAG certification. See verification.md for additional screen checks and remaining manual-review scope.

## Help panel

A persistent **Help options** launcher and prominent **Get help now** buttons open a native modal dialog. It does not open automatically or clear a draft. Native focus containment, Escape dismissal, focus return, and 44px close/quick-exit controls support keyboard use. Quick exit is also available inside the modal because the rest of the document becomes inert. Phone and advocate-chat links require an explicit click; no call, message, or geolocation starts automatically. The floating launcher has no flashing/pulsing animation.


## Default public surface: Everyday Notes

The public experience is a neutral editorial reading site in warm paper, forest green, and muted botanical illustration. All stories and SVG art are original; no remote media or fonts are requested. Search and category filters work locally. The neutral Personal space button opens a keyboard-accessible native dialog before support tools are displayed. The public view has no support navigation, hotline launcher, or demonstration banner. HerVoice branding, explicit help buttons, and source/clinical limitations are visible only after deliberate entry. Neutral metadata, favicon, and frontend paths remain consistent in both modes. The unlock state exists only in the root layout's React memory, so client navigation works but a reload/new tab does not remember it.
