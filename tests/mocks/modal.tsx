import * as React from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  containerClassName?: string;
  panelClassName?: string;
  panelWidthClassName?: string;
  panelStyle?: React.CSSProperties;
  backdropClassName?: string;
  variant?: "default" | "inverted";
  disableCloseOnBackdrop?: boolean;
};

export default function Modal({
  open,
  title,
  footer,
  children,
}: ModalProps) {
  const titleId = React.useId();
  if (!open) {
    return null;
  }

  const isTextTitle = typeof title === "string";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isTextTitle ? title : undefined}
      aria-labelledby={!isTextTitle ? titleId : undefined}
      className="test-modal"
    >
      {title !== undefined && (
        <div id={isTextTitle ? undefined : titleId} className="test-modal__title">
          {title}
        </div>
      )}
      <div className="test-modal__content">{children}</div>
      {footer ? <div className="test-modal__footer">{footer}</div> : null}
    </div>
  );
}
