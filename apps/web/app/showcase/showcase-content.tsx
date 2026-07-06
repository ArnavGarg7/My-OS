"use client";

import { useState, type ReactNode } from "react";
import {
  Archive,
  Bell,
  Calendar,
  Download,
  Flame,
  Folder,
  Home,
  Inbox,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  Button,
  CalendarCell,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Chip,
  Combobox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Delta,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Divider,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  EmptyState,
  FadeIn,
  Field,
  Icon,
  IconButton,
  Kbd,
  Label,
  ListItem,
  MetricCard,
  MetricWidget,
  NavigationItem,
  Pagination,
  PasswordInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScaleIn,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ShortcutBadge,
  SimpleTooltip,
  Skeleton,
  Slider,
  Spinner,
  Stagger,
  StaggerItem,
  StatBlock,
  StatusIndicator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tag,
  Text,
  Textarea,
  ThemeToggle,
  TimelineItem,
  useTheme,
  useToast,
  type ToastVariant,
} from "@myos/ui";

/* ── Layout helpers ─────────────────────────────────────────────────────────── */

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="space-y-0.5">
        <Text asChild variant="heading-l">
          <h2>{title}</h2>
        </Text>
        {description ? (
          <Text variant="body-m" tone="muted">
            {description}
          </Text>
        ) : null}
      </div>
      <Card variant="section" padding="lg" className="space-y-8">
        {children}
      </Card>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Text variant="label" tone="subtle">
        {label}
      </Text>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* ── Sections ───────────────────────────────────────────────────────────────── */

const COLOR_TOKENS: { name: string; className: string }[] = [
  { name: "base", className: "bg-base" },
  { name: "surface", className: "bg-surface" },
  { name: "elevated", className: "bg-elevated" },
  { name: "overlay", className: "bg-overlay" },
  { name: "inset", className: "bg-inset" },
  { name: "accent", className: "bg-accent" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger", className: "bg-danger" },
  { name: "info", className: "bg-info" },
];

function ColorsSection() {
  return (
    <Section id="colors" title="Colors" description="Theme-aware surface & semantic tokens.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {COLOR_TOKENS.map((token) => (
          <div key={token.name} className="space-y-1.5">
            <div className={`border-border h-14 rounded-lg border ${token.className}`} />
            <Text variant="caption" tone="subtle">
              {token.name}
            </Text>
          </div>
        ))}
      </div>
    </Section>
  );
}

const TYPE_VARIANTS = [
  "display-xl",
  "display-l",
  "display-m",
  "heading-xl",
  "heading-l",
  "heading-m",
  "heading-s",
  "body-l",
  "body-m",
  "body-s",
  "caption",
  "label",
  "mono",
] as const;

function TypographySection() {
  return (
    <Section id="typography" title="Typography" description="One scale, all from tokens.">
      <div className="space-y-3">
        {TYPE_VARIANTS.map((variant) => (
          <div
            key={variant}
            className="border-border flex items-baseline justify-between gap-6 border-b pb-2"
          >
            <Text variant={variant}>The quick brown fox jumps</Text>
            <span className="text-caption text-fg-subtle shrink-0 font-mono">{variant}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ButtonsSection() {
  return (
    <Section id="buttons" title="Buttons" description="Variants, sizes, and states.">
      <Row label="Variants">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="subtle">Subtle</Button>
      </Row>
      <Row label="Sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </Row>
      <Row label="With icons & loading">
        <Button leftIcon={<Plus size={15} />}>New task</Button>
        <Button variant="secondary" rightIcon={<Download size={15} />}>
          Export
        </Button>
        <Button loading>Saving</Button>
        <Button disabled>Disabled</Button>
      </Row>
      <Row label="Icon buttons">
        <IconButton aria-label="Settings" variant="ghost">
          <Settings size={16} />
        </IconButton>
        <IconButton aria-label="Notifications" variant="secondary">
          <Bell size={16} />
        </IconButton>
        <IconButton aria-label="Delete" variant="danger" size="icon-sm">
          <Trash2 size={15} />
        </IconButton>
      </Row>
    </Section>
  );
}

function IconsSection() {
  return (
    <Section id="icons" title="Icons" description="Lucide, token-sized.">
      <Row label="Sizes">
        <Icon icon={Home} size="sm" aria-label="Home small" />
        <Icon icon={Home} size="md" aria-label="Home medium" />
        <Icon icon={Home} size="lg" aria-label="Home large" />
        <Icon icon={Home} size="xl" aria-label="Home extra large" />
        <Icon icon={Settings} size="lg" interactive aria-label="Interactive settings" />
      </Row>
    </Section>
  );
}

function BadgesSection() {
  const [selected, setSelected] = useState(true);
  const [chips, setChips] = useState(["College", "Health"]);
  return (
    <Section id="badges" title="Badges, Chips & Tags" description="Compact status + labels.">
      <Row label="Badges">
        <Badge>Neutral</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Done</Badge>
        <Badge variant="warning">At risk</Badge>
        <Badge variant="danger">Overdue</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="outline">Outline</Badge>
      </Row>
      <Row label="Chips">
        <Chip selected={selected} onClick={() => setSelected((s) => !s)}>
          Toggle me
        </Chip>
        {chips.map((chip) => (
          <Chip key={chip} onRemove={() => setChips((prev) => prev.filter((c) => c !== chip))}>
            {chip}
          </Chip>
        ))}
      </Row>
      <Row label="Tags & status">
        <Tag color="var(--accent)">personal</Tag>
        <Tag color="var(--success)">health</Tag>
        <Tag>untagged</Tag>
        <StatusIndicator status="online" label="Online" />
        <StatusIndicator status="busy" pulse label="Live" />
        <StatusIndicator status="away" label="Away" />
      </Row>
      <Row label="Keyboard">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <ShortcutBadge keys={["⌘", "K"]} />
        <ShortcutBadge keys={["G", "then", "T"]} size="sm" />
      </Row>
    </Section>
  );
}

function CardsSection() {
  return (
    <Section id="cards" title="Cards & Metrics" description="Surfaces and dashboard stats.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card variant="standard">
          <CardHeader>
            <CardTitle>Standard</CardTitle>
            <CardDescription>Surface with a hairline border.</CardDescription>
          </CardHeader>
          <CardContent>Body content sits here with tokenized spacing.</CardContent>
          <CardFooter>
            <Button size="sm" variant="secondary">
              Action
            </Button>
          </CardFooter>
        </Card>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Elevated</CardTitle>
            <CardDescription>Raised with a soft shadow.</CardDescription>
          </CardHeader>
          <CardContent>Used for popovered / floating content.</CardContent>
        </Card>
        <Card variant="interactive" role="button" tabIndex={0}>
          <CardHeader>
            <CardTitle>Interactive</CardTitle>
            <CardDescription>Hover / focus to raise.</CardDescription>
          </CardHeader>
          <CardContent>Great for clickable list cards.</CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Deep work"
          value="14h"
          icon={Flame}
          delta={<Delta value="1.5h" trend="up" />}
        />
        <MetricCard
          label="Interruptions"
          value="12"
          delta={<Delta value="3" trend="down" goodDirection="down" />}
        />
        <MetricWidget label="Planner accuracy" value="92%" delta={<Delta value="4%" trend="up" />}>
          <div className="flex h-full items-end gap-1">
            {[40, 55, 48, 70, 62, 80, 92].map((h, i) => (
              <div
                key={i}
                className="bg-accent-muted flex-1 rounded-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </MetricWidget>
        <Card variant="standard" className="flex items-center">
          <StatBlock label="Water" value="1.8L" delta={<Delta value="72%" trend="flat" />} />
        </Card>
      </div>
    </Section>
  );
}

function AlertsSection() {
  return (
    <Section id="alerts" title="Alerts" description="Inline contextual messages.">
      <div className="space-y-3">
        <Alert variant="info" title="Heads up">
          Recurring events are materialized 12 months ahead.
        </Alert>
        <Alert variant="success" title="Saved">
          Your plan for tomorrow is ready.
        </Alert>
        <Alert variant="warning" title="At risk">
          Food budget is 92% used with 9 days left.
        </Alert>
        <Alert
          variant="danger"
          title="Overdue"
          action={
            <Button size="sm" variant="secondary">
              Review
            </Button>
          }
        >
          3 tasks are past due.
        </Alert>
      </div>
    </Section>
  );
}

const FRUIT = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
];

function FormsSection() {
  const [combo, setCombo] = useState<string>();
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("p2");
  const [pushOn, setPushOn] = useState(true);
  const [slider, setSlider] = useState([40]);

  return (
    <Section id="forms" title="Inputs & Forms" description="Every control, fully accessible.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" hint="We never share it.">
          <SearchInput placeholder="you@example.com" />
        </Field>
        <Field label="Password" required>
          <PasswordInput placeholder="••••••••" />
        </Field>
        <Field label="Invalid" error="This field is required.">
          <SearchInput defaultValue="bad value" />
        </Field>
        <Field label="Disabled">
          <SearchInput placeholder="Disabled" disabled />
        </Field>
        <Field label="Select">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pick an area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Combobox (searchable)">
          <Combobox
            options={FRUIT}
            value={combo}
            onValueChange={setCombo}
            placeholder="Pick a fruit"
          />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea placeholder="A freeform note…" />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <Text variant="label" tone="subtle">
            Selection controls
          </Text>
          <label className="flex items-center gap-2.5">
            <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
            <span className="text-body-m text-fg">Send me reminders</span>
          </label>
          <RadioGroup value={radio} onValueChange={setRadio}>
            {(
              [
                ["p1", "High priority"],
                ["p2", "Normal priority"],
                ["p3", "Low priority"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2.5">
                <RadioGroupItem value={value} />
                <span className="text-body-m text-fg">{label}</span>
              </label>
            ))}
          </RadioGroup>
          <div className="flex items-center gap-2.5">
            <Switch id="push" checked={pushOn} onCheckedChange={setPushOn} />
            <Label htmlFor="push">Push notifications</Label>
          </div>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <Text variant="label" tone="subtle">
              Slider — {slider[0]}
            </Text>
            <Slider value={slider} onValueChange={setSlider} max={100} step={1} />
          </div>
          <div className="space-y-2">
            <Text variant="label" tone="subtle">
              Progress
            </Text>
            <Progress value={72} />
            <Progress value={40} tone="success" />
            <Progress value={90} tone="warning" />
            <Progress value={null} />
          </div>
        </div>
      </div>
    </Section>
  );
}

function OverlaysSection() {
  return (
    <Section
      id="overlays"
      title="Overlays & Menus"
      description="Dialog, drawer, popover, tooltip, menu."
    >
      <Row label="Triggers">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete project?</DialogTitle>
              <DialogDescription>
                This deletes the project and its 23 tasks. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="danger">Delete</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="secondary">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent side="right">
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>Right-hand slide-over panel.</DrawerDescription>
            <div className="mt-2 flex flex-col gap-3">
              <SearchInput placeholder="Search…" />
              <DrawerClose asChild>
                <Button>Apply</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-1">
              <Text variant="heading-s">Quick note</Text>
              <Text variant="body-s" tone="muted">
                Popovers float above content with a scale-in.
              </Text>
            </div>
          </PopoverContent>
        </Popover>

        <SimpleTooltip content="This is a tooltip">
          <Button variant="secondary">Hover for tooltip</Button>
        </SimpleTooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">Open menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Archive size={15} /> Archive
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download size={15} /> Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>
              <Trash2 size={15} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Row>
    </Section>
  );
}

function TabsAccordionSection() {
  return (
    <Section id="tabs" title="Tabs & Accordion">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Text variant="body-m" tone="muted">
            The overview tab content.
          </Text>
        </TabsContent>
        <TabsContent value="tasks">
          <Text variant="body-m" tone="muted">
            The tasks tab content.
          </Text>
        </TabsContent>
        <TabsContent value="notes">
          <Text variant="body-m" tone="muted">
            The notes tab content.
          </Text>
        </TabsContent>
      </Tabs>
      <Accordion type="single" collapsible className="max-w-lg">
        <AccordionItem value="a">
          <AccordionTrigger>What is My OS?</AccordionTrigger>
          <AccordionContent>The operating system for your life.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes — keyboard, ARIA and focus are first-class.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Section>
  );
}

const TOAST_VARIANTS: ToastVariant[] = ["default", "success", "warning", "danger", "info"];

function ToastSection() {
  const { toast } = useToast();
  return (
    <Section id="toasts" title="Toasts" description="Bottom-center, auto-dismiss, swipe to close.">
      <Row label="Fire a toast">
        {TOAST_VARIANTS.map((variant) => (
          <Button
            key={variant}
            variant="secondary"
            onClick={() =>
              toast({
                variant,
                title: `${variant[0]?.toUpperCase()}${variant.slice(1)} toast`,
                description: "This will dismiss automatically.",
              })
            }
          >
            {variant}
          </Button>
        ))}
        <Button
          onClick={() =>
            toast({
              variant: "success",
              title: "Task completed",
              description: "Physics lab report submitted.",
              action: { label: "Undo", onClick: () => undefined },
            })
          }
        >
          With action
        </Button>
      </Row>
    </Section>
  );
}

function CommandSection() {
  return (
    <Section id="command" title="Command Center" description="⌘K-style search & actions.">
      <Card variant="elevated" padding="none" className="max-w-lg overflow-hidden">
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem>
                <Home size={16} /> Go to Today
                <CommandShortcut>G H</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Inbox size={16} /> Go to Inbox
                <CommandShortcut>G I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem>
                <Plus size={16} /> New task
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Sparkles size={16} /> Ask the assistant
                <CommandShortcut>⌘J</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Card>
    </Section>
  );
}

function DataDisplaySection() {
  const [page, setPage] = useState(3);
  return (
    <Section
      id="data"
      title="Lists, Nav & Data"
      description="Rows, navigation, calendar, timeline."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Text variant="label" tone="subtle">
            List items
          </Text>
          <Card variant="standard" padding="sm">
            <ListItem
              interactive
              leading={<Checkbox aria-label="Complete task" />}
              trailing={<Badge variant="danger">Overdue</Badge>}
            >
              <Text variant="body-m">Finish DBMS assignment</Text>
            </ListItem>
            <ListItem interactive leading={<Checkbox aria-label="Complete task" defaultChecked />}>
              <Text variant="body-m" tone="muted">
                Log workout
              </Text>
            </ListItem>
            <ListItem
              selected
              interactive
              leading={<Folder size={16} className="text-fg-subtle" />}
            >
              <Text variant="body-m">Side project</Text>
            </ListItem>
          </Card>

          <Text variant="label" tone="subtle">
            Navigation
          </Text>
          <div className="border-border bg-surface max-w-56 space-y-0.5 rounded-lg border p-2">
            <NavigationItem icon={Home} active>
              Today
            </NavigationItem>
            <NavigationItem icon={Inbox} trailing={<Badge variant="accent">14</Badge>}>
              Inbox
            </NavigationItem>
            <NavigationItem icon={Calendar}>Calendar</NavigationItem>
            <NavigationItem icon={Settings}>Settings</NavigationItem>
          </div>
        </div>

        <div className="space-y-4">
          <Text variant="label" tone="subtle">
            Timeline
          </Text>
          <div className="border-border bg-surface rounded-lg border p-4">
            <TimelineItem
              icon={Trophy}
              title="Gym streak: 100 days"
              meta="Today"
              color="var(--warning)"
            >
              A new personal record.
            </TimelineItem>
            <TimelineItem
              icon={Sparkles}
              title="Reached 82 kg"
              meta="3d ago"
              color="var(--success)"
            />
            <TimelineItem icon={Folder} title="Finished Stage 7" meta="1w ago" last />
          </div>

          <Text variant="label" tone="subtle">
            Calendar cells
          </Text>
          <div className="border-border bg-surface grid grid-cols-7 gap-1 rounded-lg border p-2">
            {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
              <CalendarCell
                key={d}
                day={d}
                today={d === 6}
                selected={d === 9}
                events={d % 4 === 0 ? ["var(--accent)", "var(--success)"] : []}
              />
            ))}
          </div>
        </div>
      </div>

      <Divider />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { label: "Home", href: "#" },
            { label: "Projects", href: "#" },
            { label: "My OS" },
          ]}
        />
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>AG</AvatarFallback>
          </Avatar>
          <Pagination page={page} pageCount={10} onPageChange={setPage} />
        </div>
      </div>
    </Section>
  );
}

function FeedbackSection() {
  const [key, setKey] = useState(0);
  return (
    <Section id="feedback" title="Feedback & Motion" description="Loading, empty, and animation.">
      <Row label="Spinners & skeletons">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
        <div className="w-48 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton variant="pulse" className="h-8 w-full" />
        </div>
      </Row>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="standard" padding="none">
          <EmptyState
            icon={Inbox}
            title="Inbox Zero"
            description="Nothing to organize. Capture anything with C."
            action={<Button size="sm">Capture</Button>}
            hint={<ShortcutBadge keys={["C"]} size="sm" />}
          />
        </Card>
        <Card variant="standard" className="space-y-3">
          <div className="flex items-center justify-between">
            <Text variant="heading-s">Motion presets</Text>
            <Button size="sm" variant="ghost" onClick={() => setKey((k) => k + 1)}>
              Replay
            </Button>
          </div>
          <Stagger key={key} className="space-y-2">
            {["Fade + slide in", "Staggered rows", "Premium, subtle"].map((t) => (
              <StaggerItem key={t}>
                <div className="border-border bg-elevated text-body-m text-fg rounded-md border px-3 py-2">
                  {t}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="flex gap-2">
            <FadeIn key={`f${key}`}>
              <Badge variant="accent">FadeIn</Badge>
            </FadeIn>
            <ScaleIn key={`s${key}`}>
              <Badge variant="success">ScaleIn</Badge>
            </ScaleIn>
          </div>
        </Card>
      </div>
    </Section>
  );
}

/* ── Root ───────────────────────────────────────────────────────────────────── */

export function ShowcaseContent() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div className="mx-auto max-w-[var(--container-content)] px-6 py-10">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-elevated text-accent flex size-8 items-center justify-center rounded-lg font-mono">
              ▮
            </span>
            <Text asChild variant="heading-l">
              <h1>My OS — Design System</h1>
            </Text>
          </div>
          <Text variant="body-m" tone="muted">
            Development reference. Theme: {theme} ({resolvedTheme}). Every component, every state.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">v0.0.0</Badge>
          <ThemeToggle />
        </div>
      </header>

      <FadeIn>
        <div className="space-y-12">
          <ColorsSection />
          <TypographySection />
          <ButtonsSection />
          <IconsSection />
          <BadgesSection />
          <CardsSection />
          <AlertsSection />
          <FormsSection />
          <OverlaysSection />
          <TabsAccordionSection />
          <ToastSection />
          <CommandSection />
          <DataDisplaySection />
          <FeedbackSection />
        </div>
      </FadeIn>
    </div>
  );
}
