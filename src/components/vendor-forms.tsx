"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createVendorAction,
  deactivateVendorAction,
  payVendorAction,
  resolveVendorAccountAction,
  updateVendorAction,
} from "@/app/actions/vendors";
import type { AdminBank, AdminVendor } from "@/lib/barly-api";
import { VENDOR_CATEGORIES } from "@/lib/labels";
import { nairaFromKobo } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass = "h-8 rounded-lg border bg-background px-2 text-sm";

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-1 text-sm ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
    </label>
  );
}

function BankFields({
  banks,
  defaultBankCode,
  defaultAccountNumber,
  defaultAccountName,
}: {
  banks: AdminBank[];
  defaultBankCode?: string;
  defaultAccountNumber?: string;
  defaultAccountName?: string;
}) {
  const [accountName, setAccountName] = useState(defaultAccountName ?? "");
  const [pending, start] = useTransition();

  return (
    <>
      <label className="grid gap-1 text-sm">
        <Label htmlFor="bank_code">Bank</Label>
        <select
          id="bank_code"
          name="bank_code"
          className={selectClass}
          defaultValue={defaultBankCode ?? ""}
        >
          <option value="">Select bank</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Account number"
        name="account_number"
        defaultValue={defaultAccountNumber}
      />
      <label className="grid gap-1 text-sm sm:col-span-2">
        <Label htmlFor="account_name">Account name</Label>
        <div className="flex gap-2">
          <Input
            id="account_name"
            name="account_name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Resolve to fill"
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={(e) => {
              const form = e.currentTarget.closest("form");
              if (!form) return;
              const data = new FormData(form);
              start(async () => {
                const res = await resolveVendorAccountAction(data);
                if (!res.ok) {
                  toast.error(res.message);
                  return;
                }
                setAccountName(res.data.account_name);
                toast.success("Account resolved");
              });
            }}
          >
            {pending ? "…" : "Resolve"}
          </Button>
        </div>
      </label>
    </>
  );
}

export function AddVendorForm({ banks }: { banks: AdminBank[] }) {
  return (
    <form action={createVendorAction} className="grid gap-3 sm:grid-cols-2">
      <Field label="Company name" name="name" required />
      <label className="grid gap-1 text-sm">
        <Label htmlFor="category">Category</Label>
        <select id="category" name="category" required className={selectClass} defaultValue="other">
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <Field label="Email" name="email" type="email" required />
      <Field label="Phone" name="phone" type="tel" />
      <label className="grid gap-1 text-sm sm:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" rows={2} required />
      </label>
      <Field label="City" name="city" />
      <BankFields banks={banks} />
      <div className="flex items-end sm:col-span-2">
        <Button type="submit">Onboard vendor</Button>
      </div>
    </form>
  );
}

export function EditVendorForm({ vendor, banks }: { vendor: AdminVendor; banks: AdminBank[] }) {
  return (
    <form action={updateVendorAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={vendor.id} />
      <Field label="Company name" name="name" required defaultValue={vendor.name} />
      <label className="grid gap-1 text-sm">
        <Label htmlFor={`category-${vendor.id}`}>Category</Label>
        <select
          id={`category-${vendor.id}`}
          name="category"
          required
          className={selectClass}
          defaultValue={vendor.category}
        >
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <Field label="Email" name="email" type="email" required defaultValue={vendor.email} />
      <Field label="Phone" name="phone" type="tel" defaultValue={vendor.phone} />
      <label className="grid gap-1 text-sm sm:col-span-2">
        <Label htmlFor={`address-${vendor.id}`}>Address</Label>
        <Textarea id={`address-${vendor.id}`} name="address" rows={2} required defaultValue={vendor.address} />
      </label>
      <Field label="City" name="city" defaultValue={vendor.city} />
      <BankFields
        banks={banks}
        defaultBankCode={vendor.bank_code}
        defaultAccountNumber={vendor.account_number?.includes("*") ? undefined : vendor.account_number}
        defaultAccountName={vendor.account_name}
      />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="is_active" defaultChecked={vendor.is_active} />
        Active
      </label>
      <div className="flex items-end gap-2 sm:col-span-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export function PayVendorForm({ vendor }: { vendor: AdminVendor }) {
  const maxNaira = vendor.available_to_pay / 100;
  return (
    <form action={payVendorAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={vendor.id} />
      <label className="grid gap-1 text-sm">
        <Label htmlFor={`pay-${vendor.id}`}>Pay (₦)</Label>
        <Input
          id={`pay-${vendor.id}`}
          name="amount_naira"
          type="number"
          min={1}
          max={maxNaira}
          step="1"
          required
          disabled={maxNaira <= 0 || !vendor.has_recipient}
          placeholder={`Max ${maxNaira.toLocaleString()}`}
        />
      </label>
      <Button type="submit" disabled={maxNaira <= 0 || !vendor.has_recipient}>
        Pay via Paystack
      </Button>
      <p className="basis-full text-xs text-muted-foreground">
        Available {nairaFromKobo(vendor.available_to_pay)}
        {!vendor.has_recipient ? " · add bank details first" : ""}
      </p>
    </form>
  );
}

export function DeactivateVendorButton({ vendor }: { vendor: AdminVendor }) {
  return (
    <form action={deactivateVendorAction}>
      <input type="hidden" name="id" value={vendor.id} />
      <Button type="submit" variant="outline" size="sm">
        Deactivate
      </Button>
    </form>
  );
}
