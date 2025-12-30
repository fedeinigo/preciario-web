import Modal from "@/app/components/ui/Modal";
import ItemForm, { type ItemFormData } from "@/app/components/ui/ItemForm";

import ProposalCreatedModal from "../ProposalCreatedModal";
import { SummaryModal } from "../SummaryModal";
import { WhatsAppModal, type WppForm, type WppKind } from "../WhatsAppModal";
import { WiserModal } from "../WiserModal";

export interface SummaryState {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onGenerate: () => void;
  companyName: string;
  country: string;
  subsidiary: string;
  selectedItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    devHours: number;
    discountPct?: number;
    unitNet?: number;
  }>;
  totalHours: number;
  totalAmount: number;
  oneShot?: number;
}

export interface ConfirmResetState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export interface WhatsAppState {
  open: boolean;
  kind: WppKind;
  form: WppForm;
  billingSubsidiary: string;
  onChange: (update: Partial<WppForm>) => void;
  onApply: () => void;
  onClose: () => void;
  error: string;
  applying: boolean;
}

export interface WiserState {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export interface ItemFormState {
  open: boolean;
  mode: "create" | "edit";
  initial?: ItemFormData;
  onClose: () => void;
  onSave: (data: ItemFormData) => void;
  existingSkus: string[];
}

export interface ProposalCreatedState {
  open: boolean;
  url: string;
  onClose: () => void;
}

export interface GeneratorModalStackProps {
  summary: SummaryState;
  confirmReset: ConfirmResetState;
  whatsapp: WhatsAppState;
  wiser: WiserState;
  itemForm?: ItemFormState;
  showItemForm: boolean;
  proposalCreated: ProposalCreatedState;
}

export default function GeneratorModalStack({
  summary,
  confirmReset,
  whatsapp,
  wiser,
  itemForm,
  showItemForm,
  proposalCreated,
}: GeneratorModalStackProps) {
  return (
    <>
      <SummaryModal {...summary} />

      <Modal
        open={confirmReset.open}
        onClose={confirmReset.onCancel}
        title={confirmReset.title}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={confirmReset.onCancel}>
              {confirmReset.cancelLabel}
            </button>
            <button className="btn-primary" onClick={confirmReset.onConfirm}>
              {confirmReset.confirmLabel}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">{confirmReset.message}</p>
      </Modal>

      <WhatsAppModal {...whatsapp} />
      <WiserModal {...wiser} />

      {showItemForm && itemForm ? <ItemForm {...itemForm} /> : null}

      <ProposalCreatedModal {...proposalCreated} />
    </>
  );
}
