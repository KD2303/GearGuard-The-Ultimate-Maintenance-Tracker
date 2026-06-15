import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import SignaturePad from './SignaturePad';
import toast from 'react-hot-toast';

interface ApprovalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (signatureBase64: string) => void;
  title: string;
}

const ApprovalSignatureModal: React.FC<ApprovalSignatureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
}) => {
  const [signature, setSignature] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      toast.error('A digital signature is legally required for financial approval.');
      return;
    }
    onSubmit(signature);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This action represents your legal digital signature for the financial approval of this repair. By signing, you acknowledge accountability for the costs associated with this ticket.
        </p>

        <SignaturePad onSign={setSignature} />

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Approve & Sign
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ApprovalSignatureModal;
