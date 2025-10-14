"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Dialog as ConfirmDialog, DialogContent as ConfirmContent, DialogHeader as ConfirmHeader, DialogTitle as ConfirmTitle, DialogDescription as ConfirmDescription, DialogFooter as ConfirmFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Application = {
  id: string;
  user_id: string;
  company: string;
  position: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  applied_on: string; // ISO date string (YYYY-MM-DD)
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
      normalized.sort((a, b) => (b.applied_on > a.applied_on ? 1 : b.applied_on < a.applied_on ? -1 : 0));
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

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Job Tracker</h1>
              <p className="text-sm text-gray-600 mt-1">Log and track your job applications.</p>
            </div>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setSubmitting(false); } }}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>Add Job</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Job Application" : "Add Job Application"}</DialogTitle>
                  <DialogDescription>Fill out the fields below, then save to update your tracker.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-gray-700">Company</label>
                    <Input placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-gray-700">Position</label>
                    <Input placeholder="Job title / role" value={position} onChange={(e) => setPosition(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Select value={status} onValueChange={(v) => setStatus(v as Application["status"]) }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium text-gray-700">Applied On</label>
                    <Input type="date" placeholder="YYYY-MM-DD" value={appliedOn} onChange={(e) => setAppliedOn(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpen(false); resetForm(); setSubmitting(false); }}>Cancel</Button>
                  <Button onClick={onSave} disabled={!isValid || submitting}>{submitting ? "Saving..." : editingId ? "Save Changes" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.filter(a => statusFilter === "All" ? true : a.status === statusFilter).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="py-16 text-center">
                        <p className="text-sm text-gray-600 mb-3">{loading ? "Loading..." : "No job applications yet. Click 'Add Job' to get started."}</p>
                        {!loading && (
                          <Button onClick={openCreate}>+ Add Job</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  apps
                    .filter((a) => (statusFilter === "All" ? true : a.status === statusFilter))
                    .map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.company}</TableCell>
                      <TableCell>{app.position}</TableCell>
                      <TableCell>
                        {app.status === "Interviewing" ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{app.status}</Badge>
                        ) : app.status === "Offer" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{app.status}</Badge>
                        ) : app.status === "Rejected" ? (
                          <Badge variant="destructive">{app.status}</Badge>
                        ) : (
                          <Badge variant="secondary">{app.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{app.applied_on}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" onClick={() => openEdit(app)}>Edit</Button>
                        <Button variant="outline" onClick={() => confirmDelete(app.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Confirm Delete Dialog */}
          <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <ConfirmContent>
              <ConfirmHeader>
                <ConfirmTitle>Delete Job?</ConfirmTitle>
                <ConfirmDescription>
                  Are you sure you want to delete this application? This action cannot be undone.
                </ConfirmDescription>
              </ConfirmHeader>
              <ConfirmFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={onDeleteConfirmed}>Delete</Button>
              </ConfirmFooter>
            </ConfirmContent>
          </ConfirmDialog>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
