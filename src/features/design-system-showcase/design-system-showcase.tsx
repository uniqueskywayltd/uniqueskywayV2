import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartFrame,
  Checkbox,
  CountdownTimer,
  CurrencyDisplay,
  DateDisplay,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  Label,
  LoadingState,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PercentageDisplay,
  ProfileImageUploader,
  Progress,
  RadioGroup,
  RadioGroupItem,
  RoiDisplay,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusChip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui";
import { designTokens } from "@/styles/tokens";

const navigationItems = [
  { label: "Overview", href: "/design-system", icon: LayoutDashboard, active: true },
  { label: "Primitives", href: "/design-system#primitives", icon: Sparkles },
  { label: "Data", href: "/design-system#data", icon: FileText },
  { label: "Layout", href: "/design-system#layout", icon: Landmark },
] as const;

const showcaseCountdownTarget = "2030-01-01T00:00:00.000Z";

function ShowcaseSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Component system
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function DesignSystemShowcase() {
  return (
    <ResponsiveShell
      sidebar={{ items: navigationItems }}
      topBar={{
        actions: [
          { label: "Tokens", href: "#tokens" },
          { label: "Primitives", href: "#primitives" },
          { label: "Data", href: "#data" },
        ],
        trailing: (
          <Button variant="outline" size="sm">
            <Bell className="size-4" aria-hidden="true" />
            System
          </Button>
        ),
      }}
      footer={{ links: [{ label: "Foundation health", href: "/api/health" }] }}
    >
      <PageContainer className="space-y-12 py-10">
        <div className="space-y-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Foundation</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Design system</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="max-w-4xl">
            <Badge variant="secondary">Phase 2</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
              Premium UI foundation for every future page.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Reusable tokens, primitives, layout shells, navigation, display helpers, and feedback
              states.
            </p>
          </div>
        </div>

        <ShowcaseSection
          id="tokens"
          title="Design Tokens"
          description="One source of truth for spacing, type, radius, elevation, colour semantics, motion, z-index, breakpoints, and container widths."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(designTokens.colors).map(([name, value]) => (
              <Card key={name}>
                <CardContent className="flex items-center gap-3 p-4">
                  <span
                    className="size-9 rounded-md border"
                    style={{ background: value }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="primitives"
          title="Controls"
          description="Form and action primitives are compact, keyboard-accessible, and suitable for dense financial workflows."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Buttons and inputs</CardTitle>
                <CardDescription>
                  Primary actions, secondary actions, and form controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button size="icon" aria-label="More options">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="showcase-input">Input</Label>
                    <Input id="showcase-input" placeholder="Reference ID" />
                  </div>
                  <div className="space-y-2">
                    <Label>Selection</Label>
                    <Select defaultValue="standard">
                      <SelectTrigger>
                        <SelectValue placeholder="Choose mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showcase-textarea">Textarea</Label>
                  <Textarea id="showcase-textarea" placeholder="Short operational note" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Choice controls</CardTitle>
                <CardDescription>Accessible checkbox and radio primitives.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-2">
                  <Checkbox id="confirm" />
                  <Label htmlFor="confirm">Require review before submission</Label>
                </div>
                <RadioGroup defaultValue="balanced">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="balanced" value="balanced" />
                    <Label htmlFor="balanced">Balanced</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="conservative" value="conservative" />
                    <Label htmlFor="conservative">Conservative</Label>
                  </div>
                </RadioGroup>
                <Progress value={68} aria-label="Completion progress" />
              </CardContent>
            </Card>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="data"
          title="Financial Display"
          description="Display components format values consistently without becoming financial source-of-truth logic."
        >
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Amounts</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <CurrencyDisplay amountMinor={1250000} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentage</span>
                  <PercentageDisplay value={0.125} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROI</span>
                  <RoiDisplay value={0.0845} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <DateDisplay value="2026-07-12T12:00:00.000Z" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <StatusChip tone="active">Active</StatusChip>
                <StatusChip tone="pending">Pending</StatusChip>
                <StatusChip tone="matured">Matured</StatusChip>
                <StatusChip tone="restricted">Restricted</StatusChip>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timer and avatar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CountdownTimer target={showcaseCountdownTarget} />
                <ProfileImageUploader fallback="US" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Table</CardTitle>
              <CardDescription>Dense but readable tabular data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["USW-001", "USW-002", "USW-003"].map((reference, index) => (
                    <TableRow key={reference}>
                      <TableCell className="font-mono">{reference}</TableCell>
                      <TableCell>
                        <StatusChip tone={index === 0 ? "active" : "pending"}>
                          {index === 0 ? "Active" : "Pending"}
                        </StatusChip>
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amountMinor={(index + 1) * 250000} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </ShowcaseSection>

        <ShowcaseSection
          id="feedback"
          title="Feedback and Overlays"
          description="Reusable feedback states, dialogs, drawers, dropdowns, tabs, toast surfaces, and skeletons."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="info">
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    Use concise alerts for important system feedback.
                  </AlertDescription>
                </Alert>
                <EmptyState
                  icon={CreditCard}
                  title="No records yet"
                  description="Empty states explain what is missing without adding business workflow."
                  action={<Button variant="outline">Secondary action</Button>}
                />
                <LoadingState />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overlays</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modal framework</DialogTitle>
                      <DialogDescription>
                        Accessible modal surface for future workflows.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button>Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline">Drawer</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Drawer framework</DrawerTitle>
                      <DrawerDescription>
                        Responsive side panel for supporting detail.
                      </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                      <Button>Done</Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Menu
                      <ChevronDown className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View details</DropdownMenuItem>
                    <DropdownMenuItem>Export</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <ChartFrame
                title="Chart wrapper"
                description="A dependency-free frame for future chart libraries."
              >
                <svg
                  role="img"
                  aria-label="Example chart line"
                  viewBox="0 0 320 120"
                  className="h-40 w-full"
                >
                  <polyline
                    points="0,90 50,75 100,80 150,45 210,55 260,28 320,34"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-roi-positive"
                  />
                </svg>
              </ChartFrame>
            </TabsContent>
            <TabsContent value="activity">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#feedback" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#feedback" isActive>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#feedback" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </TabsContent>
          </Tabs>
        </ShowcaseSection>

        <ToastProvider>
          <Toast defaultOpen>
            <div className="grid gap-1">
              <ToastTitle>Toast system</ToastTitle>
              <ToastDescription>
                Accessible notification surface for future events.
              </ToastDescription>
            </div>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>US</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Design system ready</p>
                <p className="text-sm text-muted-foreground">
                  Reusable surfaces only. No business workflow.
                </p>
              </div>
            </div>
            <Button asChild>
              <a href="/api/health">
                Health
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </ResponsiveShell>
  );
}
