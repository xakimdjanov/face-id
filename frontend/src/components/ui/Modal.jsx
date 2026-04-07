import React, { useEffect } from "react";
import { HiX } from "react-icons/hi";

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      {/* OVERLAY */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* MODAL CARD */}
      <div className={`relative w-full ${maxWidth} mx-4 my-auto bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in-95 fade-in duration-300`}>
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100/50">
          <h3 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tighter">
            {title}
          </h3>
          <button
            className="p-2 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            onClick={onClose}
          >
            <HiX size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="relative p-6 md:p-8 flex-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
