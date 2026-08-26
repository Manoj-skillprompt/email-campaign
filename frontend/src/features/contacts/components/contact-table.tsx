import type { ContactWithGroup } from "../contact.types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
});

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

interface ContactTableProps {
  contacts: ContactWithGroup[];
  onEdit: (contact: ContactWithGroup) => void;
  onDelete: (contact: ContactWithGroup) => void;
}

export function ContactTable({ contacts, onEdit, onDelete }: ContactTableProps) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-border">
          <th className="w-[120px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Client ID</th>
          <th className="w-[180px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Name</th>
          <th className="w-[240px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Email</th>
          <th className="w-[180px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Branch</th>
          <th className="w-[160px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Group</th>
          <th className="w-[120px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">Date Added</th>
          <th className="w-[100px] px-4 py-3 text-xs font-bold uppercase text-foreground-muted">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => (
          <tr key={contact.id} className="border-b border-border">
            <td className="px-4 py-4 text-sm font-medium text-accent">#{contact.clientId}</td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
                  {initialOf(contact.name)}
                </span>
                <span className="text-sm font-semibold text-foreground">{contact.name}</span>
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-1.5">
                <img src="/icons/contacts/mail.svg" alt="" className="size-3.5" />
                <span className="text-sm text-foreground">{contact.email}</span>
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-1.5">
                <img src="/icons/contacts/location.svg" alt="" className="size-3.5" />
                <span className="text-sm text-foreground">{contact.branch}</span>
              </div>
            </td>
            <td className="px-4 py-4 text-sm text-foreground-muted">{contact.groupLabel}</td>
            <td className="px-4 py-4 text-sm text-foreground-muted">
              {dateFormatter.format(new Date(contact.createdAt))}
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`Edit ${contact.name}`}
                  onClick={() => onEdit(contact)}
                  className="rounded p-0.5 hover:opacity-70"
                >
                  <img src="/icons/contacts/edit.svg" alt="" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${contact.name}`}
                  onClick={() => onDelete(contact)}
                  className="rounded p-0.5 hover:opacity-70"
                >
                  <img src="/icons/contacts/delete.svg" alt="" className="size-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
