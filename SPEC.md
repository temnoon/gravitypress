# GravityPress Functional Specification

## Vision

GravityPress is an **offline social network** where physical notebooks are the medium of human connection. The digital layer exists to facilitate creation, logistics, and archival—but the *real* interaction happens on paper, passed hand to hand.

**Inversion of the digital-first model:** The physical object is the source of truth. The digital is witness and archive.

---

## Core Concepts

### The Notebook Journey

```
Design → Print → Write → Pass/Gift → Others Write → Pass On → Scan → Archive
         ↑                                                         ↓
         └─────────────── Return to Originator ←──────────────────┘
```

A notebook isn't a product—it's a **container for connection** with built-in logistics.

### Key Entities

| Entity | Description |
|--------|-------------|
| **Template** | A notebook design (pages, layouts, covers) created in GravityPress |
| **Edition** | A print run from a template—could be 1 or 1000 |
| **Notebook** | A specific physical instance with unique identity |
| **Journey** | The planned route a notebook will travel |
| **Stop** | A person/destination in the journey |
| **Scan** | A point-in-time digital capture of the notebook's state |
| **Touch** | Verified record that someone physically handled the notebook |

---

## Product Bundles

### Basic: Self-Print
- Template design tools
- Export to print-ready PDF
- QR code for digital identity
- User handles printing and distribution

### Standard: Print + Ship
- Professionally printed notebook
- Unique identity embedded (QR, NFC, or printed hash)
- Ships to buyer or first stop

### Journey Bundle
- Printed notebook with unique identity
- **N pre-paid mailers** (branded envelopes with instructions)
- **Distribution list** (ordered or unordered routing)
- **Return shipping** to originator
- Digital tracking portal
- Scan upload access for all participants

### Premium Journey
- Everything in Journey Bundle
- Premium materials (leather cover, archival paper)
- Professional final scan & digitization
- Printed photo book of the journey
- Physical artifact preservation

---

## Life Moment Use Cases

| Moment | Flow |
|--------|------|
| **Wedding** | Guest book travels to distant loved ones who couldn't attend, returns filled |
| **New Baby** | Notebook circulates to grandparents, aunts, uncles—each adds pages |
| **Memorial** | Collect memories from scattered friends/family, create shared grief container |
| **Retirement** | Colleagues across offices each add a page, arrives complete at celebration |
| **Graduation** | Teachers, friends, family contribute wisdom for the journey ahead |
| **Scattered Friends** | Round-robin journal keeps connection alive across distance |
| **Family Recipes** | Generations contribute, notebook gains provenance and history |
| **Creative Collab** | Artists/writers pass work in progress, each adding their voice |
| **Travel Planning** | Group trip notebook passed to build anticipation and collect ideas |
| **Recovery/Healing** | Support network contributes encouragement, notebook becomes talisman |

---

## Notebook Identity System

### Physical-Digital Bridge

Each physical notebook instance has a unique identity linking it to its digital twin:

```
┌─────────────────────────────────────────┐
│  NOTEBOOK COVER / FIRST PAGE            │
│                                         │
│  ┌─────────┐                            │
│  │ QR CODE │  ← Links to notebook page  │
│  │         │     gravitypress.org/n/xyz │
│  └─────────┘                            │
│                                         │
│  ID: GP-2026-XXXX-XXXX                  │
│  Edition: "Sarah's Wedding Book" #1/1   │
│                                         │
└─────────────────────────────────────────┘
```

### Identity Options

1. **QR Code** (default) - Printed, scannable with any phone
2. **NFC Tag** - Embedded in cover, tap to access
3. **Printed Hash** - Human-readable ID for manual entry
4. **Combination** - QR + NFC + printed for redundancy

### Digital Twin Record

```typescript
interface Notebook {
  id: string;                    // GP-2026-XXXX-XXXX
  templateId: string;            // Design template used
  editionId: string;             // Print run
  editionNumber: number;         // #3 of 50
  createdAt: Date;
  createdBy: string;             // User who ordered

  journey?: Journey;             // Distribution plan (if bundle)
  scans: Scan[];                 // Timeline of captures
  touches: Touch[];              // Chain of custody

  status: 'printing' | 'shipped' | 'in_transit' | 'active' | 'returned' | 'archived';
  currentLocation?: Stop;        // Where is it now?
}
```

---

## Journey System

### Journey Definition

```typescript
interface Journey {
  id: string;
  notebookId: string;

  // Routing
  stops: Stop[];
  routingMode: 'ordered' | 'unordered' | 'holder_chooses';

  // Logistics
  mailersIncluded: number;
  returnToOriginator: boolean;
  returnAddress: Address;

  // Timeline
  startDate?: Date;
  targetEndDate?: Date;
  actualEndDate?: Date;

  // Access control
  accessMode: 'stops_only' | 'anyone_with_link' | 'public';
}

interface Stop {
  id: string;
  journeyId: string;
  order?: number;                // If ordered routing

  // Recipient
  recipientName: string;
  recipientEmail?: string;
  shippingAddress: Address;

  // Status
  status: 'pending' | 'notified' | 'shipped' | 'received' | 'writing' | 'sent_forward' | 'skipped';

  // Timeline
  shippedAt?: Date;
  receivedAt?: Date;
  sentForwardAt?: Date;

  // Contribution
  pagesAdded?: number;
  scannedAt?: Date;
}
```

### Routing Modes

**Ordered:** Stop 1 → Stop 2 → Stop 3 → ... → Return
- Pre-printed labels or digital label generation
- Each mailer has next destination

**Unordered:** Any stop can send to any remaining stop
- Holder chooses next recipient from list
- System tracks who hasn't received yet

**Holder Chooses:** Open-ended
- Current holder can add new stops
- Journey grows organically
- Optional approval by originator

---

## Scan & Archive System

### Integration with cloud_image

GravityPress integrates with the existing `cloud_image` service for:

- **Image upload** to R2 storage
- **OCR/Transcript** extraction from handwritten pages
- **Visual description** of drawings, photos, ephemera
- **Multi-model support** (Cloudflare free, OpenAI, Anthropic, Google)

### Scan Flow

```
1. User visits gravitypress.org/n/{notebook-id}/scan
2. Uploads photos of pages (phone camera or scanner)
3. cloud_image processes:
   - Transcript mode: Extract handwritten text
   - Description mode: Describe visual content
4. Results stored as Scan record
5. All journey participants notified (if enabled)
```

### Scan Record

```typescript
interface Scan {
  id: string;
  notebookId: string;
  scannedBy: string;             // User or stop ID
  scannedAt: Date;

  // Images
  images: ScanImage[];

  // Processing results (from cloud_image)
  pages: ProcessedPage[];

  // Metadata
  pageRange?: string;            // "1-5" or "all"
  notes?: string;                // Scanner's notes
  location?: GeoLocation;        // Where scanned
}

interface ProcessedPage {
  pageNumber: number;
  imageKey: string;              // R2 reference

  // cloud_image results
  transcript?: string;           // OCR text
  description?: string;          // Visual description
  hasMarkdown: boolean;

  // Metadata
  contributors?: string[];       // Who wrote on this page (if known)
}
```

### Archive Features

- **Timeline view:** See notebook evolution across scans
- **Diff view:** What changed between scans
- **Full text search:** Search across all transcribed content
- **Export:** Generate PDF, EPUB, or printed photo book
- **AI summary:** "This notebook's journey so far..."

---

## Touch Verification (Chain of Custody)

### The Problem

How do we verify someone actually touched the physical notebook vs. just claiming they did?

### Approaches (Progressive Trust)

**Level 0: Honor System**
- Anyone can claim a touch
- Useful for private/trusted journeys

**Level 1: Code Verification**
- Each notebook has unique codes printed inside
- Scanning/entering a code proves physical access
- Codes could be: per-page, hidden, or scratch-off

**Level 2: Scan Verification**
- Must upload scan to register touch
- Image analysis confirms it's the right notebook
- Timestamp and location metadata

**Level 3: Cryptographic**
- NFC tag stores rotating key
- Reading tag proves physical proximity
- Tag updates state on each read

### Touch Record

```typescript
interface Touch {
  id: string;
  notebookId: string;
  userId?: string;               // If registered user
  stopId?: string;               // If part of journey

  // Verification
  verificationLevel: 0 | 1 | 2 | 3;
  verificationMethod: 'honor' | 'code' | 'scan' | 'nfc';
  verificationProof?: string;    // Code entered, scan ID, NFC signature

  // Context
  touchedAt: Date;
  location?: GeoLocation;
  notes?: string;

  // What they did
  action: 'received' | 'wrote' | 'read' | 'passed' | 'scanned';
}
```

---

## Access Control

### Who Can See What?

| Role | Template | Journey Plan | Scans | Transcripts | Touch History |
|------|----------|--------------|-------|-------------|---------------|
| Creator/Owner | Full | Full | Full | Full | Full |
| Journey Stop | View | Own stop + progress | After their stop | After their stop | After their stop |
| Touched (verified) | View | Progress only | All | All | All |
| Link holder | View | Progress only | Depends on setting | Depends | No |
| Public | If published | No | No | No | No |

### Privacy Modes

**Private Journey:** Only stops and owner see anything
**Semi-Private:** Stops see all; others with link see progress
**Public Journey:** Anyone can follow along (names optionally hidden)

---

## Notebook Design System

### Page Types

| Type | Description | Designer Tool |
|------|-------------|---------------|
| **Polar Grid** | Radial graph paper | PolarGraphDesigner |
| **Cartesian Grid** | Standard graph paper | CartesianDesigner |
| **Lined** | Writing lines with configurable spacing | LinedPageDesigner |
| **Dot Grid** | Bullet journal style | DotGridDesigner |
| **Blank** | Empty page | — |
| **Image** | Photo or artwork | ImagePageDesigner |
| **Prompt** | Text prompt for writing | PromptPageDesigner |
| **Instruction** | Journey instructions | InstructionDesigner |

### Template Structure

```typescript
interface Template {
  id: string;
  name: string;
  createdBy: string;

  // Physical specs
  paperSize: 'LETTER' | 'A4' | 'A5' | 'HALF_LETTER';
  orientation: 'portrait' | 'landscape';
  binding: 'saddle_stitch' | 'perfect_bound' | 'spiral' | 'coptic';
  pageCount: number;

  // Cover
  frontCover: CoverDesign;
  backCover: CoverDesign;
  spine?: SpineDesign;

  // Interior
  pages: PageDesign[];

  // Identity placement
  identityPage: 'inside_front' | 'first_page' | 'inside_back';
  identityStyle: IdentityDesign;

  // Sharing
  visibility: 'private' | 'unlisted' | 'public';
  forkable: boolean;
}
```

### Layer Composition

Each page can have multiple layers:

```typescript
interface PageDesign {
  pageNumber: number;
  layers: Layer[];
  bleed: boolean;
  margin: Margins;
}

interface Layer {
  type: 'grid' | 'image' | 'text' | 'shape' | 'prompt';
  config: GridConfig | ImageConfig | TextConfig | ShapeConfig;
  opacity: number;
  blendMode: BlendMode;
  zIndex: number;
}
```

---

## Technical Architecture

### Services

```
┌─────────────────────────────────────────────────────────────────┐
│                         GRAVITYPRESS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Web App    │  │   Worker     │  │   cloud_image        │  │
│  │  (React/TS)  │  │   (CF)       │  │   (existing)         │  │
│  │              │  │              │  │                      │  │
│  │ • Designer   │  │ • Auth       │  │ • Image upload       │  │
│  │ • Journey UI │  │ • Notebooks  │  │ • OCR/transcript     │  │
│  │ • Scan view  │  │ • Journeys   │  │ • Visual description │  │
│  │ • Timeline   │  │ • Scans      │  │ • Multi-model        │  │
│  └──────┬───────┘  │ • Touches    │  └──────────┬───────────┘  │
│         │          │ • Export     │             │              │
│         │          └──────┬───────┘             │              │
│         │                 │                     │              │
│         └────────────────┼─────────────────────┘              │
│                          │                                     │
├──────────────────────────┼─────────────────────────────────────┤
│                          ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    npe-api                                │  │
│  │                 (Authentication)                          │  │
│  │                                                           │  │
│  │  • JWT tokens        • User tiers                        │  │
│  │  • OAuth (Google, GitHub, Discord)                       │  │
│  │  • Session management                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                         STORAGE                                 │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │     D1     │  │     R2     │  │     KV     │               │
│  │  (SQLite)  │  │  (Objects) │  │  (Cache)   │               │
│  │            │  │            │  │            │               │
│  │ • Users    │  │ • Scans    │  │ • Sessions │               │
│  │ • Templates│  │ • PDFs     │  │ • Config   │               │
│  │ • Notebooks│  │ • Images   │  │ • Temp     │               │
│  │ • Journeys │  │ • Exports  │  │            │               │
│  │ • Stops    │  │            │  │            │               │
│  │ • Touches  │  │            │  │            │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Endpoints (Worker)

```
# Templates
GET    /api/templates              - List user's templates
POST   /api/templates              - Create template
GET    /api/templates/:id          - Get template
PUT    /api/templates/:id          - Update template
DELETE /api/templates/:id          - Delete template
POST   /api/templates/:id/fork     - Fork a template

# Notebooks
POST   /api/notebooks              - Create notebook instance
GET    /api/notebooks/:id          - Get notebook (by ID or shortcode)
GET    /api/notebooks/:id/journey  - Get journey details
GET    /api/notebooks/:id/scans    - Get all scans
GET    /api/notebooks/:id/timeline - Get full timeline

# Journeys
POST   /api/journeys               - Create journey for notebook
PUT    /api/journeys/:id           - Update journey
POST   /api/journeys/:id/stops     - Add stop
PUT    /api/journeys/:id/stops/:stopId - Update stop status

# Scans
POST   /api/notebooks/:id/scans    - Upload scan (proxies to cloud_image)
GET    /api/scans/:id              - Get scan details
GET    /api/scans/:id/pages        - Get processed pages

# Touches
POST   /api/notebooks/:id/touch    - Register touch
GET    /api/notebooks/:id/touches  - Get touch history

# Export
GET    /api/notebooks/:id/export/pdf    - Export as PDF
GET    /api/notebooks/:id/export/epub   - Export as EPUB
```

---

## User Flows

### Flow 1: Create & Print (Basic)

```
1. User signs in (npe-api)
2. Opens Designer
3. Selects page types, customizes
4. Previews notebook
5. Exports print-ready PDF
6. Prints at home/office/print shop
7. (Optional) Registers notebook for digital identity
```

### Flow 2: Order Journey Bundle

```
1. User designs or selects template
2. Chooses "Journey Bundle"
3. Enters stops: names, addresses, order
4. Selects options: routing mode, return shipping
5. Pays (Stripe)
6. Notebook printed with unique ID
7. Shipped to first stop (or buyer)
8. Each stop:
   a. Receives notebook + pre-paid mailer
   b. Writes/contributes
   c. (Optional) Scans pages
   d. Sends to next stop
9. Returns to originator
10. Final scan/archival
```

### Flow 3: Receive & Contribute

```
1. Notebook arrives in mail
2. Recipient opens, sees instruction page
3. Scans QR code → gravitypress.org/n/xyz
4. Signs in or creates account
5. Marks "received" (registers touch)
6. Writes in notebook
7. (Optional) Scans contribution
8. Sends to next stop using included mailer
9. Marks "sent forward"
```

### Flow 4: Follow a Journey

```
1. Originator shares link: gravitypress.org/n/xyz
2. Viewer sees:
   - Journey progress map
   - Timeline of touches
   - Scans (if permitted)
   - Transcribed content (if permitted)
3. Gets notifications as notebook moves
```

---

## Business Model

### Free Tier
- 3 templates
- Basic page types
- Self-print PDF export
- Manual notebook registration

### Member ($5/mo or $50/yr)
- Unlimited templates
- All page types
- Cloud save/sync
- 5 registered notebooks
- 50 scans/month (via cloud_image)

### Pro ($15/mo or $150/yr)
- Everything in Member
- Unlimited notebooks
- Unlimited scans
- Priority processing
- API access
- White-label export

### Journey Bundles (à la carte)
- 3-stop journey: $25 + printing
- 5-stop journey: $35 + printing
- 10-stop journey: $55 + printing
- Custom routing: +$10
- Premium materials: +$30
- Final photo book: +$40

### Print Partnerships
- Integration with print-on-demand services
- Bulk pricing for events (weddings, corporate)
- Custom branding options

---

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Monorepo structure
- [x] Schemas package
- [x] Core generator (stub)
- [x] Web app shell
- [x] Worker with auth
- [ ] Polar grid renderer (real implementation)
- [ ] Template CRUD
- [ ] PDF export

### Phase 2: Notebook Identity
- [ ] Notebook registration
- [ ] QR code generation
- [ ] Notebook landing page
- [ ] Touch registration (honor system)
- [ ] Basic scan upload (integrate cloud_image)

### Phase 3: Journey System
- [ ] Journey creation flow
- [ ] Stop management
- [ ] Status tracking
- [ ] Email notifications
- [ ] Journey timeline view

### Phase 4: Social & Archive
- [ ] Scan processing (OCR/description)
- [ ] Timeline with transcripts
- [ ] Search across notebooks
- [ ] Sharing/permissions
- [ ] Export options

### Phase 5: Commerce
- [ ] Stripe integration
- [ ] Print partner integration
- [ ] Journey bundle ordering
- [ ] Shipping label generation
- [ ] Fulfillment tracking

### Phase 6: Enhancement
- [ ] Mobile app (scan-focused)
- [ ] NFC tag support
- [ ] AI journey summaries
- [ ] Public gallery
- [ ] Community features

---

## Open Questions

1. **Shipping logistics:** Partner with shipping service? Use Shippo/EasyPost API?
2. **Print fulfillment:** Lulu? Blurb? Local print partnerships?
3. **NFC tags:** Cost-effective source? How to embed in cover?
4. **International shipping:** Pre-paid mailers across borders?
5. **Lost notebooks:** Insurance? Replacement policy?
6. **Privacy/GDPR:** Handwritten content, addresses, journey tracking
7. **Moderation:** Inappropriate content in public journeys?

---

## Related Systems

- **npe-api:** Authentication, user management, tiers
- **cloud_image:** Image upload, OCR, visual analysis (at `/Users/tem/humanizer_root/cloud_image`)
- **humanizer.com:** Parent brand, shared user accounts

---

*This is a living document. Last updated: 2026-01-18*
