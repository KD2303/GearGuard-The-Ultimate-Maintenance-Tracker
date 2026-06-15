import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Button from './Button';

interface SignaturePadProps {
  onSign: (base64Signature: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSign }) => {
  const sigPadRef = useRef<SignatureCanvas | null>(null);

  const clearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      onSign('');
    }
  };

  const handleEnd = () => {
    if (sigPadRef.current) {
      if (sigPadRef.current.isEmpty()) {
        onSign('');
      } else {
        const base64 = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
        onSign(base64);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-2 mt-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Digital Signature (Required)
      </label>
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white overflow-hidden shadow-inner">
        <SignatureCanvas
          ref={sigPadRef}
          penColor="black"
          canvasProps={{
            width: 400,
            height: 150,
            className: 'sigCanvas w-full h-full'
          }}
          onEnd={handleEnd}
        />
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={clearSignature} className="text-xs px-2 py-1">
          Clear Signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
