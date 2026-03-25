import './Modal.css'

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    type = 'default', 
    showCloseButton = true,
    onClickOutside = true 
}) => {
    if (!isOpen) return null

    const handleOverlayClick = (e) => {
        if (onClickOutside && e.target === e.currentTarget) {
            onClose()
        }
    }

    const getModalClass = () => {
        const baseClass = 'modal-content'
        switch(type) {
            case 'success': return `${baseClass} modal-success`
            case 'error': return `${baseClass} modal-error`
            case 'info': return `${baseClass} modal-info`
            case 'confirmation': return `${baseClass} modal-confirmacion`
            default: return baseClass
        }
    }

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={getModalClass()}>
                {(title || showCloseButton) && (
                    <div className="modal-header">
                        {title && <h3>{title}</h3>}
                        {showCloseButton && (
                            <button className="modal-close" onClick={onClose}>
                                ×
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    )
}

// Componentes específicos para diferentes tipos de modales
export const SuccessModal = ({ isOpen, onClose, title, children }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type="success">
        {children}
        <div className="modal-footer">
            <button className="btn-modal-ok" onClick={onClose}>
                OK
            </button>
        </div>
    </Modal>
)

export const ErrorModal = ({ isOpen, onClose, title, children }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type="error">
        {children}
        <div className="modal-footer">
            <button className="btn-modal-ok" onClick={onClose}>
                OK
            </button>
        </div>
    </Modal>
)

export const InfoModal = ({ isOpen, onClose, title, children }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type="info">
        {children}
        <div className="modal-footer">
            <button className="btn-modal-ok" onClick={onClose}>
                OK
            </button>
        </div>
    </Modal>
)

export const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirmar", 
    cancelText = "Cancelar" 
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type="confirmation">
        <p>{message}</p>
        {message?.includes('eliminar') && (
            <div className="advertencia">
                Esta acción no se puede deshacer.
            </div>
        )}
        <div className="modal-footer">
            <button className="btn-cancelar" onClick={onClose}>
                {cancelText}
            </button>
            <button className="btn-confirmar" onClick={onConfirm}>
                {confirmText}
            </button>
        </div>
    </Modal>
)

export default Modal