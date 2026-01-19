# ContextFlow Dashboard - Visualization Specification

> Real-time context visualization that makes AI token usage tangible and shareable.

## The Viral Hook

**"Watch AI Think"** - A mesmerizing real-time visualization showing:
- Context filling up like a water tank
- Agents spawning as isolated bubbles
- Skills loading as puzzle pieces
- Token savings appearing as green recovery bars

## Dashboard Components

### 1. Context Tank (Hero Visualization)

A large, animated container showing context usage:

```
┌─────────────────────────────────────────┐
│                                         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Available (grey)
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░ │ ← Skills (purple)
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░ │
│  ████████████████████████░░░░░░░░░░░░░ │ ← Agent Work (blue)
│  ████████████████████████░░░░░░░░░░░░░ │
│  ████████████████████████████████████░ │ ← System (dark)
│  ████████████████████████████████████░ │
├─────────────────────────────────────────┤
│  67,234 / 200,000 tokens (33.6%)       │
│  Efficiency: 72.3% ▲                   │
└─────────────────────────────────────────┘
```

**Animations**:
- Smooth fill transitions on context changes
- Pulse effect when approaching limits
- "Water splash" effect when agent returns results
- Recovery animation (green glow) when context is freed

### 2. Agent Bubbles

Floating orbs representing active agents:

```
        ┌───────────────────────────────────────────┐
        │                                           │
        │     ◉ Explorer        ◎ Reviewer         │
        │     12,400 tokens     (spawning...)      │
        │     ████████░░        ░░░░░░░░░░         │
        │                                           │
        │              ◉ Implementer               │
        │              34,200 tokens               │
        │              ██████████████░░            │
        │              📝 Writing code...          │
        │                                           │
        └───────────────────────────────────────────┘
```

**Interactions**:
- Click bubble to see agent's context breakdown
- Drag to reposition
- Double-click to terminate
- Hover for detailed stats

### 3. Timeline Ribbon

Horizontal scrolling timeline of all events:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◆──────●──────◇──────●──────◆──────○──────●──────◇──────●──────◆────▶  │
│ │      │      │      │      │      │      │      │      │      │        │
│ Start  Load   Agent  File   Agent  Skill  Query  File   Agent  Current  │
│        Skill  Start  Read   End    Load   Run    Write  Start           │
│ +2.1k  +4.3k  +12k   +1.2k  -12k   +2.8k  +0.5k  +0.3k  +15k   67.2k   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Features**:
- Zoom in/out
- Click event to see details
- Color-coded by type (load=blue, unload=green, overflow=red)
- Exportable as GIF for sharing

### 4. Efficiency Gauge

Prominent display of the key metric:

```
         ┌─────────────────────┐
         │                     │
         │    EFFICIENCY       │
         │                     │
         │       72.3%         │
         │    ▲ +12.4% vs      │
         │      baseline       │
         │                     │
         │   ◐◐◐◐◐◐◐◐○○       │
         │                     │
         └─────────────────────┘
```

### 5. Cost Tracker

Real-time cost estimation:

```
┌────────────────────────────────┐
│ 💰 Session Cost               │
├────────────────────────────────┤
│ Current:        $0.42         │
│ Projected:      $0.67         │
│ Baseline Est:   $1.89         │
│ ─────────────────────────      │
│ Savings:        $1.22 (65%)   │
└────────────────────────────────┘
```

### 6. Breakdown Panel

Detailed allocation breakdown:

```
┌──────────────────────────────────────────┐
│ Context Allocation Breakdown             │
├──────────────────────────────────────────┤
│                                          │
│ System Prompt      ████████     18,200   │
│ User Messages      ██████       12,400   │
│ Agent: Implementer ██████████████ 34,200 │
│ Skill: code-stds   ██            4,300   │
│ File: index.ts     █             2,100   │
│ File: auth.ts      █             1,800   │
│                                          │
│ ─────────────────────────────────────    │
│ Total                           73,000   │
│ Capacity                       200,000   │
│ Utilization                      36.5%   │
└──────────────────────────────────────────┘
```

## Interactive Features

### Record & Share

```
┌─────────────────────────────────────────────┐
│ 🎬 Record Session                          │
├─────────────────────────────────────────────┤
│ ◉ Recording...  02:34                      │
│                                             │
│ [Stop] [Pause] [Add Marker]                │
│                                             │
│ Export as:                                  │
│ [GIF] [MP4] [Interactive HTML]             │
└─────────────────────────────────────────────┘
```

**Shareable Outputs**:
- Animated GIF (Twitter/Discord friendly)
- MP4 video (YouTube demos)
- Interactive HTML (embed in blogs)
- Static image with metrics

### Comparison Mode

Side-by-side comparison:

```
┌─────────────────────┬─────────────────────┐
│    WITHOUT          │    WITH             │
│    ContextFlow      │    ContextFlow      │
├─────────────────────┼─────────────────────┤
│ ███████████████████ │ ██████░░░░░░░░░░░░░ │
│ 187,234 tokens      │ 67,234 tokens       │
│ Efficiency: 23%     │ Efficiency: 72%     │
│ Cost: $1.89         │ Cost: $0.67         │
│ Time: 14m 23s       │ Time: 7m 41s        │
├─────────────────────┼─────────────────────┤
│         IMPROVEMENT: 3.1x more efficient  │
└─────────────────────────────────────────────┘
```

## Dashboard Layout

### Desktop (1920x1080)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ContextFlow Dashboard                                    [Record] [?]  │
├──────────────────────────────────┬─────────────────────────────────────┤
│                                  │ Efficiency    │ Cost Tracker       │
│     CONTEXT TANK                 │    72.3%      │ Current: $0.42     │
│     (Main Visualization)         │    ▲ +12%     │ Savings: $1.22     │
│                                  ├───────────────┴────────────────────┤
│                                  │ Agent Bubbles                      │
│                                  │  ◉ Impl    ◉ Review    ○ Explorer │
│                                  │                                    │
├──────────────────────────────────┴────────────────────────────────────┤
│ Timeline: ◆──●──◇──●──◆──○──●──◇──●──◆──●──◇──●──◆──○──●──◇──●──▶   │
├───────────────────────────────────────────────────────────────────────┤
│ Breakdown: System 18k │ User 12k │ Agent 34k │ Skills 4k │ Files 4k  │
└───────────────────────────────────────────────────────────────────────┘
```

### Mobile / Embed Widget

```
┌──────────────────────┐
│ Context: 33.6%       │
│ ██████░░░░░░░░░░░░░ │
│ Efficiency: 72.3%    │
│ Cost: $0.42          │
└──────────────────────┘
```

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Visualization**: D3.js for custom charts
- **Animation**: Framer Motion
- **State**: Zustand (lightweight)
- **Styling**: Tailwind CSS
- **Export**: html2canvas + gif.js

## Real-Time Data Flow

```
ContextFlow Core
      │
      ▼ (WebSocket)
Dashboard Server (optional, for remote monitoring)
      │
      ▼ (Events)
React Dashboard
      │
      ├── Context Tank Component
      ├── Agent Bubbles Component
      ├── Timeline Component
      └── Metrics Components
```

## Embed Integration

```html
<!-- Minimal embed -->
<script src="https://contextflow.dev/widget.js"></script>
<div id="contextflow-widget" data-session="abc123"></div>

<!-- Full dashboard embed -->
<iframe
  src="https://contextflow.dev/dashboard?session=abc123"
  width="800"
  height="600"
></iframe>
```

## CLI Dashboard (Terminal)

For terminal-only environments:

```
contextflow dashboard --tui

┌─ContextFlow ──────────────────────────────────────┐
│ Context: ████████████████░░░░░░░░░░░░░░░ 67.2k   │
│ Efficiency: 72.3% │ Cost: $0.42 │ Time: 2m 34s   │
├──────────────────────────────────────────────────┤
│ Agents:                                          │
│  ● Implementer [████████░░] 34.2k tokens         │
│  ○ Reviewer    [spawning...]                     │
├──────────────────────────────────────────────────┤
│ Recent: +file:index.ts +skill:testing -agent:exp │
└──────────────────────────────────────────────────┘
```

## Viral Features

### 1. "Context Race" Mode
Compare two approaches racing to complete the same task. Gamified, shareable.

### 2. Leaderboard Widget
Show your project's efficiency rank globally.

### 3. Achievement Badges
- "Context Master" - 80%+ efficiency
- "Token Miser" - Under $1 for complex task
- "Zero Overflow" - No context failures

### 4. Social Cards
Auto-generated images for sharing:
```
┌────────────────────────────────────────┐
│ 🏆 ContextFlow Achievement            │
│                                        │
│    Saved 65% on context costs         │
│    72.3% efficiency (vs 23% baseline) │
│                                        │
│    contextflow.dev                     │
└────────────────────────────────────────┘
```
