// app/(protected)/tracker/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmContent,
  DialogHeader as ConfirmHeader,
  DialogTitle as ConfirmTitle,
  DialogDescription as ConfirmDescription,
  DialogFooter as ConfirmFooter,
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
import { getBrowserSupabase } from "@/lib/supabase/client";
import { ArrowUpDown, Download, Search as SearchIcon } from "lucide-react";
import { motion } from "framer-motion";

type Application = {
  id: string;
  user_id: string;
  company: string;
  position: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  applied_on: string; // YYYY-MM-DD
  created_at: string;
};

const STATUS_OPTIONS = ["Applied", "Interviewing", "Offer", "Rejected"] as const;
type SortKey = "company" | "position" | "status" | "applied_on";
type SortDir = "asc" | "desc";
const PREFS_KEY = "offervia:trackerPrefs_v1";
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export default function TrackerPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const { toast } = useToast();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // UI state (with persistence)
  const [statusFilter, setStatusFilter] =
    useState<"All" | Application["status"]>("All");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("applied_on");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(
    10
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    // load prefs
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.statusFilter) setStatusFilter(p.statusFilter);
        if (typeof p.q === "string") setQ(p.q);
        if (p.sortKey) setSortKey(p.sortKey);
        if (p.sortDir) setSortDir(p.sortDir);
        if (p.pageSize && PAGE_SIZE_OPTIONS.includes(p.pageSize)) {
          setPageSize(p.pageSize);
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    // save prefs
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ statusFilter, q, sortKey, sortDir, pageSize })
    );
  }, [statusFilter, q, sortKey, sortDir, pageSize]);

  // form state (modal)
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<Application["status"]>("Applied");
  const [appliedOn, setAppliedOn] = useState("");

  const isValid =
    (company || "").trim() &&
    (position || "").trim() &&
    STATUS_OPTIONS.includes(status) &&
    appliedOn;

  function formatDate(s: string | null | undefined) {
    if (!s) return "";
    try {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return s as string;
      return d.toISOString().slice(0, 10);
    } catch {
      return String(s);
    }
  }

  async function loadApps() {
    setLoading(true);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      setApps([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("applications")
      .select("id,user_id,company,position,status,applied_on,created_at")
      .eq("user_id", user.id);

    if (!error && data) {
      const normalized = (data as Application[]).map((a) => ({
        ...a,
        applied_on: a.applied_on ? formatDate(a.applied_on) : "",
      }));
      setApps(normalized);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Job Packet handoff: prefill create modal from query params, then clear URL
  useEffect(() => {
    const c = search.get("company");
    const p = search.get("position");
    const s = search.get("status");
    const d = search.get("applied_on");

    if (!c && !p && !s && !d) return;

    resetForm();
    if (c) setCompany(c);
    if (p) setPosition(p);
    if (s && (STATUS_OPTIONS as readonly string[]).includes(s)) {
      setStatus(s as Application["status"]);
    }
    if (d) setAppliedOn(d);
    setOpen(true);

    // Clear query so refresh doesn't reopen the modal
    router.replace("/tracker");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
    setStatus((app.status as Application["status"]) || "Applied");
    setAppliedOn(app.applied_on ? app.applied_on : "");
    setOpen(true);
  }

  async function onSave() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("applications")
          .update({ company, position, status, applied_on: appliedOn })
          .eq("id", editingId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("applications")
          .insert({ company, position, status, applied_on: appliedOn, user_id: user.id });
        if (error) throw error;
      }
      toast({ title: "Job saved successfully" });
      setOpen(false);
      resetForm();
      await loadApps();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(errorMessage);
      toast({ title: "Failed to save job. Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete(id: string) {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }

  async function onDeleteConfirmed() {
    if (!pendingDeleteId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", pendingDeleteId)
      .eq("user_id", user.id);
    if (error) {
      console.error("Delete failed", error.message);
      toast({ title: "Failed to delete job. Try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Job deleted" });
    setConfirmOpen(false);
    setPendingDeleteId(null);
    await loadApps();
  }

  // -------- Enhancements --------

  // Quick add (inline)
  const [quickCompany, setQuickCompany] = useState("");
  const [quickPosition, setQuickPosition] = useState("");
  const [quickDate, setQuickDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [quickSaving, setQuickSaving] = useState(false);

  async function quickAdd() {
    if (!quickCompany.trim() || !quickPosition.trim() || !quickDate) return;
    setQuickSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setQuickSaving(false);
      return;
    }
    const { error } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        company: quickCompany.trim(),
        position: quickPosition.trim(),
        status: "Applied",
        applied_on: quickDate,
      });
    if (error) {
      toast({ title: "Could not add job", variant: "destructive" });
    } else {
      toast({ title: "Job added" });
      setQuickCompany("");
      setQuickPosition("");
      setQuickDate(new Date().toISOString().slice(0, 10));
      await loadApps();
    }
    setQuickSaving(false);
  }

  // Status cycle (click badge)
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  function nextStatus(s: Application["status"]): Application["status"] {
    const order: Application["status"][] = ["Applied", "Interviewing", "Offer", "Rejected"];
    const i = order.indexOf(s);
    return order[(i + 1) % order.length];
  }
  async function cycleStatus(a: Application) {
    const next = nextStatus(a.status);
    setUpdatingId(a.id);
    // optimistic
    setApps((cur) =>
      cur.map((x) => (x.id === a.id ? { ...x, status: next } : x))
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUpdatingId(null);
      return;
    }
    const { error } = await supabase
      .from("applications")
      .update({ status: next })
      .eq("id", a.id)
      .eq("user_id", user.id);
    if (error) {
      // rollback
      setApps((cur) =>
        cur.map((x) => (x.id === a.id ? { ...x, status: a.status } : x))
      );
      toast({ title: "Failed to update status", variant: "destructive" });
    }
    setUpdatingId(null);
  }

  // KPI counts
  const kpis = useMemo(() => {
    const by = (s: Application["status"]) => apps.filter((a) => a.status === s).length;
    return {
      total: apps.length,
      applied: by("Applied"),
      interviewing: by("Interviewing"),
      offer: by("Offer"),
      rejected: by("Rejected"),
    };
  }, [apps]);

  // sort helpers
  function toggleSort(k: SortKey) {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  // derived list (filter + search + sort)
  const view = useMemo(() => {
    const filtered = apps
      .filter((a) => (statusFilter === "All" ? true : a.status === statusFilter))
      .filter((a) => {
        if (!q.trim()) return true;
        const hay = `${a.company} ${a.position} ${a.status}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      });

    const sorted = [...filtered].sort((a, b) => {
      const get = (x: Application) => {
        switch (sortKey) {
          case "company": return x.company?.toLowerCase() ?? "";
          case "position": return x.position?.toLowerCase() ?? "";
          case "status": return x.status ?? "";
          case "applied_on": return x.applied_on ?? "";
        }
      };
      const av = get(a);
      const bv = get(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [apps, statusFilter, q, sortKey, sortDir]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(view.length / pageSize));
  useEffect(() => setPage(1), [q, statusFilter, sortKey, sortDir, pageSize]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return view.slice(start, start + pageSize);
  }, [view, page, pageSize]);

  // Tinted badges that work in dark & light
  function StatusBadge({ s, busy }: { s: Application["status"]; busy?: boolean }) {
    const content = busy ? "…" : s;
    if (s === "Interviewing") {
      return (
        <Badge className="border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-300">
          {content}
        </Badge>
      );
    }
    if (s === "Offer") {
      return (
        <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
          {content}
        </Badge>
      );
    }
    if (s === "Rejected") {
      return <Badge variant="destructive">{content}</Badge>;
    }
    return (
      <Badge className="border border-foreground/10 bg-foreground/[0.06] text-foreground/80 hover:bg-foreground/[0.08]">
        {content}
      </Badge>
    );
  }

  function exportCsv() {
    const rows = [
      ["Company", "Position", "Status", "Applied On"],
      ...view.map((a) => [a.company, a.position, a.status, a.applied_on || ""]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offervia-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <AuthGuard>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="space-y-4 sm:space-y-6 p-4 sm:p-6"
      >
        {/* Header */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Job Tracker</h1>
            <p className="mt-1 text-sm text-foreground/70">
              Log and track your job applications.
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="pl-8 border-border bg-background/80 text-foreground"
              />
            </div>
            <Select value={String(pageSize)} onValueChange={(v) => {
              const num = Number(v);
              if (PAGE_SIZE_OPTIONS.includes(num as typeof PAGE_SIZE_OPTIONS[number])) {
                setPageSize(num as typeof PAGE_SIZE_OPTIONS[number]);
              }
            }}>
              <SelectTrigger className="w-[110px] border-border bg-background/80 text-foreground">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card/80 text-foreground">
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
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
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) {
                  resetForm();
                  setSubmitting(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500">
                  Add Job
                </Button>
              </DialogTrigger>

              <DialogContent className="rounded-2xl border border-border bg-card/80 text-foreground shadow-lg">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {editingId ? "Edit Job Application" : "Add Job Application"}
                  </DialogTitle>
                  <DialogDescription className="text-foreground/70">
                    Fill out the fields below, then save to update your tracker.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-foreground">Company</label>
                    <Input
                      placeholder="Company name"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                    />
                  </div>

                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-foreground">Position</label>
                    <Input
                      placeholder="Job title / role"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                    />
                  </div>

                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as Application["status"])}
                    >
                      <SelectTrigger className="border-border bg-background/80 text-foreground">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card/80 text-foreground">
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
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
                      onChange={(e) => setAppliedOn(e.target.value)}
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
                    className="bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                  >
                    {submitting ? "Saving..." : editingId ? "Save Changes" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Total" value={kpis.total} />
          <Kpi title="Applied" value={kpis.applied} />
          <Kpi title="Interviewing" value={kpis.interviewing} />
          <Kpi title="Offers" value={kpis.offer} />
        </section>

        {/* Quick add */}
        <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <div className="mb-2 text-sm font-medium text-foreground">Quick add</div>
          <div className="grid gap-2 sm:grid-cols-5">
            <Input
              placeholder="Company"
              value={quickCompany}
              onChange={(e) => setQuickCompany(e.target.value)}
              className="border-border bg-background/80 text-foreground sm:col-span-2"
            />
            <Input
              placeholder="Position"
              value={quickPosition}
              onChange={(e) => setQuickPosition(e.target.value)}
              className="border-border bg-background/80 text-foreground sm:col-span-2"
            />
            <div className="flex gap-2 sm:col-span-1">
              <Input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="border-border bg-background/80 text-foreground"
              />
              <Button
                onClick={quickAdd}
                disabled={quickSaving || !quickCompany.trim() || !quickPosition.trim()}
                className="whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-500"
              >
                {quickSaving ? "Saving…" : "Add"}
              </Button>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground/70">Filter:</span>
          <Select value={statusFilter} onValueChange={(v) => {
            if (v === "All" || STATUS_OPTIONS.includes(v as Application["status"])) {
              setStatusFilter(v as "All" | Application["status"]);
            }
          }}>
            <SelectTrigger className="w-40 border-border bg-background/80 text-foreground">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card/80 text-foreground">
              <SelectItem value="All">All</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer text-foreground/70 whitespace-nowrap"
                    onClick={() => toggleSort("company")}
                  >
                    Company <ArrowUpDown className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-foreground/70 whitespace-nowrap"
                    onClick={() => toggleSort("position")}
                  >
                    Position <ArrowUpDown className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-foreground/70 whitespace-nowrap"
                    onClick={() => toggleSort("status")}
                  >
                    Status <ArrowUpDown className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-foreground/70 whitespace-nowrap hidden sm:table-cell"
                    onClick={() => toggleSort("applied_on")}
                  >
                    Applied On <ArrowUpDown className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead className="text-right text-foreground/70 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="animate-pulse space-y-2 p-4">
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
                        <p className="mb-3 text-sm text-foreground/70">
                          No matching applications.
                        </p>
                        <Button onClick={openCreate}>+ Add Job</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((app) => (
                    <TableRow key={app.id} className="hover:bg-foreground/[0.03]">
                      <TableCell className="font-medium text-foreground max-w-[120px] sm:max-w-none">
                        <div className="truncate">{app.company}</div>
                      </TableCell>
                      <TableCell className="text-foreground max-w-[150px] sm:max-w-none">
                        <div className="truncate">{app.position}</div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => cycleStatus(app)}
                          title="Click to cycle status"
                          className="cursor-pointer"
                        >
                          <StatusBadge s={app.status} busy={updatingId === app.id} />
                        </button>
                      </TableCell>
                      <TableCell className="text-foreground/80 hidden sm:table-cell">{app.applied_on}</TableCell>
                      <TableCell className="space-x-1 sm:space-x-2 text-right">
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-foreground/60 text-center sm:text-left">
            Page {page} of {totalPages} • {view.length} result{view.length === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-foreground/[0.06]"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-foreground/[0.06]"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <ConfirmContent className="rounded-2xl border border-border bg-card/80 text-foreground shadow-lg">
            <ConfirmHeader>
              <ConfirmTitle className="text-foreground">Delete Job?</ConfirmTitle>
              <ConfirmDescription className="text-foreground/70">
                Are you sure you want to delete this application? This action cannot be
                undone.
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
              <Button variant="destructive" onClick={onDeleteConfirmed}>
                Delete
              </Button>
            </ConfirmFooter>
          </ConfirmContent>
        </ConfirmDialog>
      </motion.div>
    </AuthGuard>
  );
}

/* --- tiny helper --- */
function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}