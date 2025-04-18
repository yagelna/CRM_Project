import React from "react";

const Modal = ({id, title, children, size= ""}) => {
    return (
        <div className="modal fade" id={id} data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby={`${id}Label`} aria-hidden="true">
            <div className={`modal-dialog ${size}`}>
                <div className="modal-content">
                    <div className="modal-header d-flex justify-content-between align-items-start">
                        <div className="d-flex flex-column">
                            {typeof title === 'string' ? (
                                <h5 className="modal-title" id={`${id}Label`}>{title}</h5>
                            ) : (
                                title
                            )}
                        </div>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Modal;