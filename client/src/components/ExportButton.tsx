import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  label: string;
  onClick: () => Promise<void>;
  variant?: 'excel' | 'pdf';
}

const ExportButton = ({
  label,
  onClick,
  variant = 'excel',
}: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setIsExporting(true);
    setError('');
    try {
      await onClick();
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const baseClass =
    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClass =
    variant === 'pdf'
      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100';

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={isExporting}
        className={`${baseClass} ${variantClass}`}
      >
        {isExporting ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Download size={15} />
        )}
        {isExporting ? 'Exporting...' : label}
      </button>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ExportButton;
