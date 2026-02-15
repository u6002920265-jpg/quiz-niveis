import { useState, useEffect } from 'react';
import { marked } from 'marked';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/report.md')
      .then((res) => res.text())
      .then((md) => {
        const rendered = marked.parse(md);
        if (typeof rendered === 'string') {
          setHtml(rendered);
        } else {
          rendered.then((h) => setHtml(h));
        }
        setLoading(false);
      })
      .catch(() => {
        setHtml('<p>Erro ao carregar o relatório.</p>');
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/20 bg-bg-secondary/80 backdrop-blur-sm">
        <h2 className="text-sm font-bold text-gold">Análise do Grupo</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-tertiary text-text-muted hover:text-text transition-colors text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-text-muted text-sm">A carregar relatório…</div>
          </div>
        ) : (
          <div
            className="report-content prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
