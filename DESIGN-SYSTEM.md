# Ruhana dashboard design system

The dashboard uses Ruhana's Pearl / Mist monochrome language: pearl-white chrome, a barely cool mist workspace, crisp-white working surfaces, cool graphite typography, quiet borders, and black primary actions. Color is reserved for focus and semantic status—not decoration.

## Foundations

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#f4f6f8` | Cool mist application background |
| `--chrome` | `#fdfdfd` | Shared header and sidebar surface |
| `--panel` | `#f6f7f8` | Framed workspace background |
| `--surface` | `#ffffff` | Primary panels and controls |
| `--surface-subtle` | `#fafbfc` | Nested or quiet surfaces |
| `--surface-strong` | `#eef1f3` | Selected and grouped controls |
| `--ink` | `#16181b` | Primary text and actions |
| `--ink-secondary` | `#62666d` | Body copy |
| `--ink-tertiary` | `#656c74` | Accessible metadata and labels |
| `--line` | `#e3e6e9` | Default dividers |
| `--line-strong` | `#d7dce1` | Elevated and secondary boundaries |
| `--control-line` | `#858f9a` | 3:1+ accessible form-control boundaries |
| `--focus` | `#4c5a70` | Keyboard focus and scrollbar tone |

Typography uses Geist. Page titles are 28–38px, section titles 22–32px, body copy 13–15px, and metadata 10–12px. Headings use restrained weights and tight tracking instead of an additional display typeface.

The primary radius is 9–10px for controls and 14–16px for large surfaces. Shadows are limited to floating or elevated elements. Most structure comes from borders and whitespace.

## Navigation pattern

- A single 64px global header spans the product. The Ruhana wordmark sits on the left; assistance, plan, and account actions sit on the right.
- Below the header, the sidebar and header use one continuous chrome surface so they read as a single navigation system.
- Every route renders inside a shared bordered, rounded workspace viewport. Only this viewport scrolls on desktop.
- `Agents / Analytics` is a persistent mode switch at the top of the sidebar.
- The navigation below the switch changes with the selected mode.
- Agents mode uses: My agents, Conversations, Websites, Integrations, and Billing. Settings and the workspace switcher remain anchored at the bottom.
- Analytics mode uses: Overview, Results, Website insights, and Usage.
- Knowledge, actions, voice, widget configuration, and deployment health live inside each agent workspace rather than becoming unrelated global pages.
- Ask Ruhana, Upgrade, and account controls remain in the global top bar.
- The sidebar becomes an off-canvas drawer below 820px while the framed viewport remains visible behind it.

## Component behavior

- Primary buttons are black and reserved for the single most important action in a region.
- Secondary buttons are white with a strong neutral border.
- Navigation items have default, hover, active, focus-visible, and mobile states.
- Empty states explain why content is absent, what will appear, and the action needed to generate it.
- Workspace scrollbars are 4px, nearly transparent at rest, darker on workspace hover, and strongest only when the thumb itself is hovered.
- All motion is brief and disabled when reduced motion is requested.

## Product patterns

- My Agents combines existing agents and the avatar library so a first-time user can either create from a photo or start from a ready avatar without changing pages.
- Agent creation always follows four plain-language steps: Website & goal, Look & voice, Knowledge & behavior, and Widget & launch.
- Every agent has an internal workspace with Overview, Configure, Knowledge, Actions, Widget, and Conversations tabs.
- Operational screens use one consistent demo workspace and typed data shapes so backend responses can replace the local data without changing the visual hierarchy.
- Analytics reports business contribution first—revenue, outcomes, result rate, and support resolution—while keeping usage available as a supporting view.
- Portraits use a single original Ruhana atlas asset, framed through a reusable `AvatarPortrait` component to keep imagery cohesive and avoid competitor assets.

## Accessibility

- Desktop interactive targets are at least 36px high; primary actions are 38px or larger. Mobile controls expand to 44px where layout allows.
- Focus-visible outlines use the dedicated focus token.
- Inputs and selects use the dedicated control-border token so their boundaries retain at least 3:1 contrast on Ruhana's light surfaces.
- Navigation uses landmarks and `aria-current`.
- Mobile navigation exposes expanded state and a labeled backdrop/close control.
- Semantic status colors must never be the only carrier of meaning.
- Dialogs expose a name, modal role, close control, backdrop dismissal, and Escape dismissal.
