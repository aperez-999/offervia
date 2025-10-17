"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
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

export default function TrackerPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | Application["status"]>("All");

  // form state
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
      normalized.sort((a, b) =>
        b.applied_on > a.applied_on ? 1 : b.applied_on < a.applied_on ? -1 : 0
      );
      setApps(normalized);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        toast({ title: "Job saved successfully" });
      } else {
        const { error } = await supabase
          .from("applications")
          .insert({ company, position, status, applied_on: appliedOn, user_id: user.id });
        if (error) throw error;
        toast({ title: "Job saved successfully" });
      }
      setOpen(false);
      resetForm();
      await loadApps();
    } catch (e: any) {
      console.error(e?.message || e);
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

  // Tinted badges that work in dark & light
  function StatusBadge({ s }: { s: Application["status"] }) {
    if (s === "Interviewing") {
      return (
        <Badge className="border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-300">
          {s}
        </Badge>
      );
    }
    if (s === "Offer") {
      return (
        <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
          {s}
        </Badge>
      );
    }
    if (s === "Rejected") {
      return <Badge variant="destructive">{s}</Badge>;
    }
    // Applied
    return (
      <Badge className="border border-foreground/10 bg-foreground/[0.06] text-foreground/80 hover:bg-foreground/[0.08]">
        {s}
      </Badge>
    );
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Job Tracker</h1>
              <p className="mt-1 text-sm text-foreground/70">
                Log and track your job applications.
              </p>
            </div>

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
                <Button
                  onClick={openCreate}
                  className="bg-indigo-600 cursor-pointer text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                >
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

          {/* Filters */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/70">Filter:</span>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as any)}
              >
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
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground/70">Company</TableHead>
                  <TableHead className="text-foreground/70">Position</TableHead>
                  <TableHead className="text-foreground/70">Status</TableHead>
                  <TableHead className="text-foreground/70">Applied On</TableHead>
                  <TableHead className="text-right text-foreground/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.filter((a) =>
                  statusFilter === "All" ? true : a.status === statusFilter
                ).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="py-16 text-center">
                        <p className="mb-3 text-sm text-foreground/70">
                          {loading
                            ? "Loading..."
                            : "No job applications yet. Click 'Add Job' to get started."}
                        </p>
                        {!loading && (
                          <Button
                            onClick={openCreate}
                            className="bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                          >
                            + Add Job
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  apps
                    .filter((a) =>
                      statusFilter === "All" ? true : a.status === statusFilter
                    )
                    .map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium text-foreground">
                          {app.company}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {app.position}
                        </TableCell>
                        <TableCell>
                          <StatusBadge s={app.status} />
                        </TableCell>
                        <TableCell className="text-foreground/80">
                          {app.applied_on}
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button
                            variant="outline"
                            onClick={() => openEdit(app)}
                            className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => confirmDelete(app.id)}
                            className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
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

          {/* Confirm Delete Dialog */}
          <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <ConfirmContent className="rounded-2xl border border-border bg-card/80 text-foreground shadow-lg">
              <ConfirmHeader>
                <ConfirmTitle className="text-foreground">Delete Job?</ConfirmTitle>
                <ConfirmDescription className="text-foreground/70">
                  Are you sure you want to delete this application? This action cannot
                  be undone.
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
        </div>
      </AppLayout>
    </AuthGuard>
  );
}