import { toast } from "sonner";

export function success(title: string, opts?: { description?: string }) {
  toast.success(title, { description: opts?.description });
}

export function error(title: string, opts?: { description?: string }) {
  toast.error(title, { description: opts?.description });
}

export function info(title: string, opts?: { description?: string }) {
  toast(title, { description: opts?.description });
}
