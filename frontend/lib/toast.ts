import { toast } from "sonner";

type Opts = {
  description?: string;
  /** When set, the toast carries a "View on explorer" action opening this URL. */
  explorerUrl?: string;
};

function action(opts?: Opts) {
  if (!opts?.explorerUrl) return undefined;
  const url = opts.explorerUrl;
  return {
    label: "View on explorer ↗",
    onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
  };
}

export function success(title: string, opts?: Opts) {
  toast.success(title, {
    description: opts?.description,
    action: action(opts),
    duration: opts?.explorerUrl ? 12000 : 4000,
  });
}

export function error(title: string, opts?: Opts) {
  toast.error(title, { description: opts?.description });
}

export function info(title: string, opts?: Opts) {
  toast(title, { description: opts?.description });
}
