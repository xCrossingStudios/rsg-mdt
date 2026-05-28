import type { IssuedCharge } from '../types';

interface ChargeDetailModalProps {
  charge: IssuedCharge | null;
  onClose: () => void;
}

export function ChargeDetailModal({ charge, onClose }: ChargeDetailModalProps) {
  if (!charge) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryStyle = () => {
    const fine = charge.fine || 0;
    const jailtime = charge.jailtime || 0;
    
    if (jailtime >= 12 || fine >= 100) {
      return { label: 'Felony', color: 'text-red-400 bg-red-400/10 border-red-400/30' };
    } else if (jailtime > 0 || fine >= 25) {
      return { label: 'Misdemeanor', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
    } else {
      return { label: 'Infraction', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30' };
    }
  };

  const category = getCategoryStyle();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80" />
      <div 
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Charge Details
            </h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xl font-bold text-white">{charge.charge_name}</h4>
              <span className={`inline-block mt-1 text-xs px-2 py-1 rounded border ${category.color}`}>
                {category.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs">Charge ID</p>
              <p className="text-zinc-300 text-sm font-mono">#{charge.id}</p>
            </div>
          </div>

          {charge.charge_description && (
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Description</p>
              <p className="text-zinc-300 text-sm leading-relaxed">{charge.charge_description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Fine</p>
              <p className={`text-2xl font-bold ${charge.fine > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {charge.fine > 0 ? `$${charge.fine}` : 'None'}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Jail Time</p>
              <p className={`text-2xl font-bold ${charge.jailtime > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                {charge.jailtime > 0 ? `${charge.jailtime} mo` : 'None'}
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 space-y-4">
            <h5 className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Parties Involved</h5>
            
            <div className="bg-zinc-800/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Charged Person</p>
                  <p className="text-white font-medium">{charge.citizen_name}</p>
                  <p className="text-zinc-500 text-xs font-mono">{charge.citizenid}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Issuing Officer</p>
                  <p className="text-white font-medium">{charge.officer}</p>
                  {charge.officer_cid && (
                    <p className="text-zinc-500 text-xs font-mono">{charge.officer_cid}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Issued on {formatDate(charge.created_at)}</span>
              </div>
              {charge.report_id && (
                <span className="text-zinc-500">
                  Report #{charge.report_id}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
