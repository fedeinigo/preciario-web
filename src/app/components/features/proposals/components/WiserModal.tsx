import Modal from "@/app/components/ui/Modal";

export function WiserModal({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Wiser PRO"
      footer={
        <div className="flex justify-end gap-2">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSc0rVOmoTHZxHakZTQRuUn4xo7Wy10o4GP1nnmJEg19TwxEEw/viewform"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            Ir al formulario
          </a>
          <button
            className="btn-primary"
            onClick={onConfirm}
            title="Insertar ítem con cantidad 1, precio 0 y horas 0"
          >
            Confirmar e insertar
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-gray-700">
          Para cotizar <strong>Wiser PRO</strong> necesitamos información adicional. Completa el
          formulario del equipo <strong>Mapaches</strong> y, mientras tanto, agregaremos el ítem con
          <strong> cantidad 1</strong>, <strong>precio 0</strong> y <strong>horas 0</strong>.
        </p>
        <p className="text-sm text-gray-600">
          Luego podrás actualizar el valor y reemitir la propuesta.
        </p>
      </div>
    </Modal>
  );
}
