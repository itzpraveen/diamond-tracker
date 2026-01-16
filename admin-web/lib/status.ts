export function statusLabel(status?: string | null): string {
  if (!status) return "-";
  switch (status) {
    case "PACKED_READY":
      return "Ready to Delivery";
    default:
      return status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
