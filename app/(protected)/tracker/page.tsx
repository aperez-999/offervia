"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmContent,
  DialogDescription as ConfirmDescription,
  DialogFooter as ConfirmFooter,
  DialogHeader as ConfirmHeader,
  DialogTitle as ConfirmTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { deleteJson, getJson, patchJson, postJson } from "@/lib/safe-fetch";
import { readJobPacketDraft, updateJobPacketDraft } from "@/lib/job-packet";
import {
  type Application,
  nextApplicationStatus,
  normalizeApplication,
  TRACKER_PAGE_SIZE_OPTIONS,
  TRACKER_PREFS_KEY,
  TRACKER_STATUS_OPTIONS,
  type SortDir,
  type SortKey,
  type TrackerApiRow,
} from "@/lib/tracker/utils";
import { ArrowUpDown, Download, LayoutGrid, Rows3, Search as SearchIcon } from "lucide-react";

type TrackerListResponse = {
  success: true;
  data: TrackerApiRow[];
};

type TrackerItemResponse = {
  success: true;
  data: TrackerApiRow | null;
};

type TrackerViewMode = "table" | "board";

const TRACKER_VIEW_KEY = "offervia.tracker.view";

const STATUS_BADGE_VARIANT: Record<
  Application["status"],
  "applied" | "interviewing" | "offer" | "rejected"
> = {
  Applied: "applied",
  Interviewing: "interviewing",
  Offer: "offer",
  Rejected: "rejected",
};

const BOARD_COLUMNS: { status: Application["status"]; accent: string }[] = [
  { status: "Applied", accent: "var(--status-applied)" },
  { status: "Interviewing", accent: "var(--status-interviewing)" },
  { status: "Offer", accent: "var(--status-offer)" },
  { status: "Rejected", accent: "var(--status-rejected)" },
];


export default function TrackerPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { toast } = useToast();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"All" | Application["status"]>("All");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("applied_on");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<(typeof TRACKER_PAGE_SIZE_OPTIONS)[number]>(10);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<TrackerViewMode>("table");
  const [openedFromPacket, setOpenedFromPacket] = useState(false);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<Application["status"]>("Applied");
  const [appliedOn, setAppliedOn] = useState("");

  const [quickCompany, setQuickCompany] = useState("");
  const [quickPosition, setQuickPosition] = useState("");
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [quickSaving, setQuickSaving] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isValid =
    Boolean((company || "").trim()) &&
    Boolean((position || "").trim()) &&
    TRACKER_STATUS_OPTIONS.includes(status) &&
    Boolean(appliedOn);

  const loadApps = useCallback(async () => {
    setLoading(true);
    const res = await getJson<TrackerListResponse>("/api/tracker");

    if (!res.ok) {
      if (res.status !== 401) {
        toast({ title: "Failed to load tracker", variant: "destructive" });
      }
      setApps([]);
      setLoading(false);
      return;
    }

    setApps((res.data.data || []).map(normalizeApplication));
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRACKER_PREFS_KEY);
      if (!raw) return;

      const prefs = JSON.parse(raw);
      if (prefs.statusFilter) setStatusFilter(prefs.statusFilter);
      if (typeof prefs.q === "string") setQ(prefs.q);
      if (prefs.sortKey) setSortKey(prefs.sortKey);
      if (prefs.sortDir) setSortDir(prefs.sortDir);
      if (prefs.pageSize && TRACKER_PAGE_SIZE_OPTIONS.includes(prefs.pageSize)) {
        setPageSize(prefs.pageSize);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      TRACKER_PREFS_KEY,
      JSON.stringify({ statusFilter, q, sortKey, sortDir, pageSize })
    );
  }, [statusFilter, q, sortKey, sortDir, pageSize]);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  useEffect(() => {
    const companyParam = search.get("company");
    const positionParam = search.get("position") ?? search.get("role");
    const statusParam = search.get("status");
    const appliedOnParam = search.get("applied_on") ?? search.get("follow_up_date");
    const fromPacket = search.get("from") === "job-packet";

    if (!companyParam && !positionParam && !statusParam && !appliedOnParam) {
      if (!fromPacket) return;
      const packetDraft = readJobPacketDraft();
      const packetTracker = packetDraft?.trackerDraft;
      if (!packetTracker) return;

      resetForm();
      setCompany(packetTracker.company);
      setPosition(packetTracker.position);
      setStatus(packetTracker.status);
      setAppliedOn(packetTracker.applied_on);
      setOpenedFromPacket(true);
      setOpen(true);
      router.replace("/tracker");
      return;
    }

    resetForm();
    if (companyParam) setCompany(companyParam);
    if (positionParam) setPosition(positionParam);
    if (statusParam && (TRACKER_STATUS_OPTIONS as readonly string[]).includes(statusParam)) {
      setStatus(statusParam as Application["status"]);
    }
    if (appliedOnParam) setAppliedOn(appliedOnParam);
    if (fromPacket) setOpenedFromPacket(true);
    setOpen(true);

    router.replace("/tracker");
  }, [router, search]);

  function resetForm() {
    setCompany("");
    setPosition("");
    setStatus("Applied");
    setAppliedOn("");
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(app: Application) {
    setEditingId(app.id);
    setCompany(app.company || "");
    setPosition(app.position || "");
    setStatus(app.status || "Applied");
    setAppliedOn(app.applied_on || "");
    setOpen(true);
  }

  async function onSave() {
    if (!isValid || submitting) return;

    setSubmitting(true);
    const payload = {
      company: company.trim(),
      role: position.trim(),
      status,
      follow_up_date: appliedOn,
    };

    const res = editingId
      ? await patchJson<TrackerItemResponse>(`/api/tracker?id=${encodeURIComponent(editingId)}`, payload)
      : await postJson<TrackerItemResponse>("/api/tracker", payload);

    if (!res.ok) {
      toast({ title: "Failed to save job. Try again.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const saved = res.data.data ? normalizeApplication(res.data.data) : null;
    setApps((current) => {
      if (!saved) return current;
      if (editingId) {
        return current.map((app) => (app.id === saved.id ? saved : app));
      }
      return [saved, ...current];
    });
    if (saved && openedFromPacket) {
      updateJobPacketDraft({
        currentStep: "complete",
        companyName: saved.company,
        roleTitle: saved.position,
        trackerDraft: {
          company: saved.company,
          position: saved.position,
          status: saved.status,
          applied_on: saved.applied_on,
        },
        completedAt: new Date().toISOString(),
      });
      setOpenedFromPacket(false);
    }
    toast({
      title: saved && openedFromPacket ? "Application saved from Job Packet" : "Application saved",
      description:
        saved && openedFromPacket
          ? "Your packet is complete and the tracker now has the latest details."
          : "Your tracker is up to date.",
    });
    setOpen(false);
    resetForm();
    setSubmitting(false);
  }

  function confirmDelete(id: string) {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }

  async function onDeleteConfirmed() {
    if (!pendingDeleteId) return;

    const res = await deleteJson(`/api/tracker?id=${encodeURIComponent(pendingDeleteId)}`);
    if (!res.ok) {
      toast({ title: "Failed to delete job. Try again.", variant: "destructive" });
      return;
    }

    setApps((current) => current.filter((app) => app.id !== pendingDeleteId));
    toast({ title: "Application removed" });
    setConfirmOpen(false);
    setPendingDeleteId(null);
  }

  async function quickAdd() {
    if (!quickCompany.trim() || !quickPosition.trim() || !quickDate || quickSaving) return;

    setQuickSaving(true);
    const res = await postJson<TrackerItemResponse>("/api/tracker", {
      company: quickCompany.trim(),
      role: quickPosition.trim(),
      status: "Applied",
      follow_up_date: quickDate,
    });

    if (!res.ok) {
      toast({ title: "Could not add job", variant: "destructive" });
      setQuickSaving(false);
      return;
    }

    const saved = res.data.data ? normalizeApplication(res.data.data) : null;
    if (saved) {
      setApps((current) => [saved, ...current]);
    }
    toast({
      title: "Application added",
      description: "Your tracker has a new entry ready for follow-up.",
    });
    setQuickCompany("");
    setQuickPosition("");
    setQuickDate(new Date().toISOString().slice(0, 10));
    setQuickSaving(false);
  }

  async function cycleStatus(app: Application) {
    const next = nextApplicationStatus(app.status);
    setUpdatingId(app.id);
    setApps((current) =>
      current.map((entry) => (entry.id === app.id ? { ...entry, status: next } : entry))
    );

    const res = await patchJson<TrackerItemResponse>(`/api/tracker?id=${encodeURIComponent(app.id)}`, {
      status: next,
    });

    if (!res.ok) {
      setApps((current) =>
        current.map((entry) => (entry.id === app.id ? { ...entry, status: app.status } : entry))
      );
      toast({ title: "Failed to update status", variant: "destructive" });
    }

    setUpdatingId(null);
  }

  const kpis = useMemo(() => {
    const byStatus = (value: Application["status"]) => apps.filter((app) => app.status === value).length;
    return {
      total: apps.length,
      applied: byStatus("Applied"),
      interviewing: byStatus("Interviewing"),
      offer: byStatus("Offer"),
      rejected: byStatus("Rejected"),
    };
  }, [apps]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  const view = useMemo(() => {
    const filtered = apps
      .filter((app) => (statusFilter === "All" ? true : app.status === statusFilter))
      .filter((app) => {
        if (!q.trim()) return true;
        const haystack = `${app.company} ${app.position} ${app.status}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      });

    return [...filtered].sort((a, b) => {
      const getValue = (app: Application) => {
        switch (sortKey) {
          case "company":
            return app.company.toLowerCase();
          case "position":
            return app.position.toLowerCase();
          case "status":
            return app.status;
          case "applied_on":
            return app.applied_on;
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);
      if (aValue < bValue) return sortDir === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [apps, q, sortDir, sortKey, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(view.length / pageSize));
  useEffect(() => setPage(1), [q, statusFilter, sortKey, sortDir, pageSize]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TRACKER_VIEW_KEY);
      if (saved === "table" || saved === "board") setViewMode(saved);
    } catch {
      // ignore storage access errors
    }
  }, []);

  function changeViewMode(next: TrackerViewMode) {
    setViewMode(next);
    try {
      window.localStorage.setItem(TRACKER_VIEW_KEY, next);
    } catch {
      // ignore storage access errors
    }
  }

  const groupedByStatus = useMemo(() => {
    const groups: Record<Application["status"], Application[]> = {
      Applied: [],
      Interviewing: [],
      Offer: [],
      Rejected: [],
    };
    for (const app of view) groups[app.status].push(app);
    return groups;
  }, [view]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return view.slice(start, start + pageSize);
  }, [page, pageSize, view]);

  function StatusBadge({ value, busy }: { value: Application["status"]; busy?: boolean }) {
    const content = busy ? "…" : value;
    const variant = STATUS_BADGE_VARIANT[value];
    return <Badge variant={variant}>{content}</Badge>;
  }

  function exportCsv() {
    const rows = [
      ["Company", "Position", "Status", "Applied On"],
      ...view.map((app) => [app.company, app.position, app.status, app.applied_on || ""]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `offervia-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Job Tracker</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Keep every application, status change, and next step in one place.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search…"
              className="border-border bg-background/80 pl-8 text-foreground"
            />
          </div>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const nextPageSize = Number(value);
              if (
                TRACKER_PAGE_SIZE_OPTIONS.includes(
                  nextPageSize as (typeof TRACKER_PAGE_SIZE_OPTIONS)[number]
                )
              ) {
                setPageSize(nextPageSize as (typeof TRACKER_PAGE_SIZE_OPTIONS)[number]);
              }
            }}
          >
            <SelectTrigger className="w-[110px] border-border bg-background/80 text-foreground">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card/80 text-foreground">
              {TRACKER_PAGE_SIZE_OPTIONS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={exportCsv}
            className="border-border text-foreground hover:bg-foreground/[0.06]"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>

          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) {
                resetForm();
                setSubmitting(false);
                setOpenedFromPacket(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Add Job
              </Button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl border border-border bg-card/80 text-foreground shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingId ? "Edit application" : "Add application"}
                </DialogTitle>
                <DialogDescription className="text-foreground/70">
                  Save the essentials now so future follow-ups stay easier to manage.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-foreground">Company</label>
                  <Input
                    placeholder="Company name"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm font-medium text-foreground">Position</label>
                  <Input
                    placeholder="Job title / role"
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={status} onValueChange={(value) => setStatus(value as Application["status"])}>
                    <SelectTrigger className="border-border bg-background/80 text-foreground">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card/80 text-foreground">
                      {TRACKER_STATUS_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1">
                  <label className="text-sm font-medium text-foreground">Applied On</label>
                  <Input
                    type="date"
                    placeholder="YYYY-MM-DD"
                    value={appliedOn}
                    onChange={(event) => setAppliedOn(event.target.value)}
                    className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                    setSubmitting(false);
                  }}
                  className="border-border text-foreground hover:bg-foreground/[0.06]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={!isValid || submitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Total" value={kpis.total} />
        <Kpi title="Applied" value={kpis.applied} />
        <Kpi title="Interviewing" value={kpis.interviewing} />
        <Kpi title="Offers" value={kpis.offer} />
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <div className="mb-1 text-sm font-medium text-foreground">Quick add</div>
        <p className="mb-3 text-xs text-foreground/60">
          Add a role in a few seconds, then come back later for edits and follow-up planning.
        </p>
        <div className="grid gap-2 sm:grid-cols-5">
          <Input
            placeholder="Company"
            value={quickCompany}
            onChange={(event) => setQuickCompany(event.target.value)}
            className="border-border bg-background/80 text-foreground sm:col-span-2"
          />
          <Input
            placeholder="Position"
            value={quickPosition}
            onChange={(event) => setQuickPosition(event.target.value)}
            className="border-border bg-background/80 text-foreground sm:col-span-2"
          />
          <div className="flex gap-2 sm:col-span-1">
            <Input
              type="date"
              value={quickDate}
              onChange={(event) => setQuickDate(event.target.value)}
              className="border-border bg-background/80 text-foreground"
            />
            <Button
              onClick={quickAdd}
              disabled={quickSaving || !quickCompany.trim() || !quickPosition.trim()}
              className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {quickSaving ? "Saving…" : "Add"}
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground/70">Filter:</span>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            if (value === "All" || TRACKER_STATUS_OPTIONS.includes(value as Application["status"])) {
              setStatusFilter(value as "All" | Application["status"]);
            }
          }}
        >
          <SelectTrigger className="w-40 border-border bg-background/80 text-foreground">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card/80 text-foreground">
            <SelectItem value="All">All</SelectItem>
            {TRACKER_STATUS_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div
          role="group"
          aria-label="View mode"
          className="ml-auto inline-flex items-center rounded-lg border border-border bg-background/80 p-0.5"
        >
          <button
            type="button"
            aria-pressed={viewMode === "table"}
            onClick={() => changeViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              viewMode === "table"
                ? "bg-primary/10 text-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "board"}
            onClick={() => changeViewMode("board")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              viewMode === "board"
                ? "bg-primary/10 text-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Board</span>
          </button>
        </div>
      </div>

      {viewMode === "board" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {BOARD_COLUMNS.map((column) => {
            const items = groupedByStatus[column.status];
            return (
              <div
                key={column.status}
                className="flex flex-col rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: column.accent }}
                    />
                    <span className="text-sm font-semibold text-foreground">{column.status}</span>
                  </div>
                  <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground/70">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  {loading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-16 rounded-lg bg-foreground/[0.06]" />
                      <div className="h-16 rounded-lg bg-foreground/[0.06]" />
                    </div>
                  ) : items.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-foreground/50">
                      No applications
                    </p>
                  ) : (
                    items.map((app) => (
                      <div
                        key={app.id}
                        className="group rounded-lg border border-border bg-background/60 p-3 transition-colors hover:border-primary/30 hover:bg-foreground/[0.02]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {app.company}
                            </div>
                            <div className="truncate text-xs text-foreground/70">{app.position}</div>
                          </div>
                          <button
                            onClick={() => void cycleStatus(app)}
                            title="Click to advance status"
                            className="shrink-0 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <StatusBadge value={app.status} busy={updatingId === app.id} />
                          </button>
                        </div>
                        {app.applied_on && (
                          <div className="mt-2 text-[11px] text-foreground/50">
                            Applied {app.applied_on}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(app)}
                            className="h-7 border-border px-2 text-xs text-foreground hover:bg-foreground/[0.06]"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(app.id)}
                            className="h-7 border-border px-2 text-xs text-foreground hover:bg-foreground/[0.06]"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer whitespace-nowrap text-foreground/70"
                  onClick={() => toggleSort("company")}
                >
                  Company <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead
                  className="cursor-pointer whitespace-nowrap text-foreground/70"
                  onClick={() => toggleSort("position")}
                >
                  Position <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead
                  className="cursor-pointer whitespace-nowrap text-foreground/70"
                  onClick={() => toggleSort("status")}
                >
                  Status <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer whitespace-nowrap text-foreground/70 sm:table-cell"
                  onClick={() => toggleSort("applied_on")}
                >
                  Applied On <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead className="whitespace-nowrap text-right text-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="space-y-2 p-4 animate-pulse">
                      <div className="h-4 rounded bg-foreground/[0.06]" />
                      <div className="h-4 rounded bg-foreground/[0.06]" />
                      <div className="h-4 rounded bg-foreground/[0.06]" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="py-16 text-center">
                      <p className="mb-3 text-sm text-foreground/70">No matching applications yet.</p>
                      <p className="mb-4 text-xs text-foreground/60">
                        Start with Job Packet for a guided flow, or add an application manually here.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          onClick={() => router.push("/job-packet")}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Start Job Packet
                        </Button>
                        <Button
                          variant="outline"
                          onClick={openCreate}
                          className="border-border text-foreground hover:bg-foreground/[0.06]"
                        >
                          Add manually
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((app) => (
                  <TableRow key={app.id} className="hover:bg-foreground/[0.03]">
                    <TableCell className="max-w-[120px] font-medium text-foreground sm:max-w-none">
                      <div className="truncate">{app.company}</div>
                    </TableCell>
                    <TableCell className="max-w-[150px] text-foreground sm:max-w-none">
                      <div className="truncate">{app.position}</div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => void cycleStatus(app)}
                        title="Click to cycle status"
                        className="cursor-pointer"
                      >
                        <StatusBadge value={app.status} busy={updatingId === app.id} />
                      </button>
                    </TableCell>
                    <TableCell className="hidden text-foreground/80 sm:table-cell">
                      {app.applied_on}
                    </TableCell>
                    <TableCell className="space-x-1 text-right sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(app)}
                        className="border-border text-foreground hover:bg-foreground/[0.06]"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(app.id)}
                        className="border-border text-foreground hover:bg-foreground/[0.06]"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      )}

      {viewMode === "table" && (
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-center text-xs text-foreground/60 sm:text-left">
          Page {page} of {totalPages} • {view.length} result{view.length === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-foreground/[0.06]"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-foreground/[0.06]"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
      )}

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ConfirmContent className="rounded-2xl border border-border bg-card/80 text-foreground shadow-lg">
          <ConfirmHeader>
            <ConfirmTitle className="text-foreground">Remove this application?</ConfirmTitle>
            <ConfirmDescription className="text-foreground/70">
              This permanently removes the tracker entry and its current status. This action cannot be undone.
            </ConfirmDescription>
          </ConfirmHeader>
          <ConfirmFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="border-border text-foreground hover:bg-foreground/[0.06]"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void onDeleteConfirmed()}>
              Delete
            </Button>
          </ConfirmFooter>
        </ConfirmContent>
      </ConfirmDialog>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
