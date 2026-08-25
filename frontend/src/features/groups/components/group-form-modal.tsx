"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, updateGroupSchema, type CreateGroupInput } from "@email-campaign-v2/contracts";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Group } from "../group.types";

type GroupFormValues = CreateGroupInput;

function isConflictError(error: unknown): error is { status: 409; body: { message: string } } {
  return typeof error === "object" && error !== null && "status" in error && error.status === 409;
}

interface GroupFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  group?: Group;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GroupFormValues) => Promise<void>;
}

const emptyValues: GroupFormValues = { name: "" };

export function GroupFormModal({ open, mode, group, onOpenChange, onSubmit }: GroupFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(mode === "create" ? createGroupSchema : updateGroupSchema) as Resolver<GroupFormValues>,
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(group ? { name: group.name } : emptyValues);
    }
  }, [open, group, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (isConflictError(error)) {
        setError("name", { message: error.body.message });
        return;
      }
      throw error;
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Group" : "Edit Group"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Sydney Visa Pending Clients"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
