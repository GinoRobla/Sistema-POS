import { useEffect } from 'react'
import './Modal.css'

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    type = 'default',
    size = 'md',
    showCloseButton = true,
    onClickOutside = true,
    closeOnEscape = true,
    panelClassName = '',
    contentClassName = ''
}) => {
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return undefined

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [closeOnEscape, isOpen, onClose])

    if (!isOpen) return null

    const handleOverlayClick = (event) => {
        if (onClickOutside && event.target === event.currentTarget) {
            onClose()
        }
    }

    return (
        <div
            className="modal-overlay ui-modal-overlay"
            onClick={handleOverlayClick}
            role="presentation"
        >
            <div
                className={`ui-modal-panel ui-modal-${size} ui-modal-${type} ${panelClassName}`.trim()}
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Dialogo'}
            >
                {(title || showCloseButton) && (
                    <div className="ui-modal-header">
                        {title ? <h3 className="ui-modal-title">{title}</h3> : <span />}
                        {showCloseButton && (
                            <button
                                type="button"
                                className="ui-modal-close"
                                aria-label="Cerrar modal"
                                onClick={onClose}
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}

                <div className={`ui-modal-content ${contentClassName}`.trim()}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type="confirmation" size="sm">
        <p className="ui-modal-text">{message}</p>
        {message?.toLowerCase().includes('eliminar') && (
            <div className="ui-modal-warning">Esta accion no se puede deshacer.</div>
        )}
        <div className="ui-modal-actions">
            <button type="button" className="ui-modal-button ui-modal-button-secondary" onClick={onClose}>
                {cancelText}
            </button>
            <button type="button" className="ui-modal-button ui-modal-button-danger" onClick={onConfirm}>
                {confirmText}
            </button>
        </div>
    </Modal>
)

export default Modal
