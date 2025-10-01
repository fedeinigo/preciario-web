import Modal from "@/app/components/ui/Modal";

import { useTranslations } from "@/app/LanguageProvider";

export function WiserModal({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("proposals.wiserModal");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("title")}
      footer={
        <div className="flex justify-end gap-2">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSc0rVOmoTHZxHakZTQRuUn4xo7Wy10o4GP1nnmJEg19TwxEEw/viewform"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            {t("actions.form")}
          </a>
          <button
            className="btn-primary"
            onClick={onConfirm}
            title={t("actions.confirmTitle")}
          >
            {t("actions.confirm")}
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-gray-700">{t("content.intro")}</p>
        <p className="text-sm text-gray-600">{t("content.followup")}</p>
      </div>
    </Modal>
  );
}
