import type { Contact } from "@/types/contact";
import { ContactAvatar } from "@/components/contacts/contact-avatar";

interface ContactTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

function formatDateAdded(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US");
}

export function ContactTable({ contacts, onEdit, onDelete }: ContactTableProps) {
  return (
    <table className="w-full border-collapse text-left" data-testid="contact-table">
      <thead>
        <tr className="border-b border-border">
          <th className="w-[120px] px-4 py-3 text-xs font-bold text-foreground-muted">CLIENT ID</th>
          <th className="w-[180px] px-4 py-3 text-xs font-bold text-foreground-muted">NAME</th>
          <th className="w-[240px] px-4 py-3 text-xs font-bold text-foreground-muted">EMAIL</th>
          <th className="w-[180px] px-4 py-3 text-xs font-bold text-foreground-muted">BRANCH</th>
          <th className="w-[120px] px-4 py-3 text-xs font-bold text-foreground-muted">DATE ADDED</th>
          <th className="w-[100px] px-4 py-3" />
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => (
          <tr key={contact.id} className="border-b border-border">
            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-accent">#&nbsp;{contact.clientId}</td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-2">
                <ContactAvatar name={contact.name} />
                <span className="text-sm font-semibold text-foreground">{contact.name}</span>
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-1.5">
                <img src="/icons/mail.svg" alt="" className="size-3.5" width={14} height={14} />
                <span className="text-sm text-foreground">{contact.email}</span>
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-1.5">
                <img src="/icons/location.svg" alt="" className="size-3.5" width={14} height={14} />
                <span className="text-sm text-foreground">{contact.branch}</span>
              </div>
            </td>
            <td className="px-4 py-4 text-sm text-foreground-muted">{formatDateAdded(contact.createdAt)}</td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`Edit ${contact.name}`}
                  onClick={() => onEdit(contact)}
                  className="opacity-70 hover:opacity-100"
                >
                  <img src="/icons/edit.svg" alt="" className="size-4" width={16} height={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${contact.name}`}
                  onClick={() => onDelete(contact)}
                  className="opacity-70 hover:opacity-100"
                >
                  <img src="/icons/delete.svg" alt="" className="size-4" width={16} height={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
