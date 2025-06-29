import React, { useState } from 'react';
import toast from 'react-hot-toast';
import PrintPreviewModal from './PrintPreviewModal';

const ProfitPrintGenerator = ({ results, symbol, exchange, formData }) => {
  const [showPreview, setShowPreview] = useState(false);

  const openPreview = () => {
    if (!results) {
      toast.error('Nenhum resultado para gerar print');
      return;
    }
    setShowPreview(true);
  };

  return (
    <>
      <button className="action-button primary" onClick={openPreview}>
        📸 Gerar Print
      </button>

      <PrintPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        results={results}
        symbol={symbol}
        exchange={exchange}
        formData={formData}
      />
    </>
  );
};

export default ProfitPrintGenerator;