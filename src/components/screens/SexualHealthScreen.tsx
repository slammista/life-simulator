import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { ContraceptionMethod, STIType } from '../../services/SexualHealthEngine'

const CONTRACEPTION_OPTIONS: { id: ContraceptionMethod; name: string; emoji: string; efficacy: string; cost: string; note: string }[] = [
  { id: 'none',          name: 'Nessuno',                   emoji: '❌', efficacy: '0%',    cost: '€0',     note: 'Massimo rischio' },
  { id: 'condom',        name: 'Preservativo',              emoji: '🛡️', efficacy: '98%',   cost: '€15/m',  note: 'Protegge da MST' },
  { id: 'female_condom', name: 'Preservativo femminile',    emoji: '🛡️', efficacy: '95%',   cost: '€25/m',  note: 'Protegge da MST' },
  { id: 'pill',          name: 'Pillola anticoncezionale',  emoji: '💊', efficacy: '99%',   cost: '€22/m',  note: 'No protezione MST' },
  { id: 'iud',           name: 'IUD (spirale)',             emoji: '🔩', efficacy: '99.9%', cost: '€400',   note: 'Durata 5+ anni' },
  { id: 'patch',         name: 'Cerotto contraccettivo',    emoji: '🩹', efficacy: '99%',   cost: '€30/m',  note: 'Settimanale' },
  { id: 'ring',          name: 'Anello vaginale',           emoji: '💍', efficacy: '99%',   cost: '€22/m',  note: 'Mensile' },
  { id: 'diaphragm',     name: 'Diaframma',                 emoji: '⚪', efficacy: '88%',   cost: '€5/m',   note: 'Efficacia ridotta' },
  { id: 'calendar',      name: 'Metodo calendario',         emoji: '📅', efficacy: '75%',   cost: '€0',     note: 'Rischio elevato' },
  { id: 'sterilization', name: 'Sterilizzazione',           emoji: '✂️', efficacy: '99.9%', cost: '€2000',  note: 'Permanente, 25+ anni' },
]

const STI_LABELS: Record<STIType, string> = {
  hiv: 'HIV/AIDS', chlamydia: 'Clamidia', gonorrhea: 'Gonorrea',
  syphilis: 'Sifilide', hpv: 'HPV', herpes: 'Herpes genitale', hepatitis_b: 'Epatite B',
}

export default function SexualHealthScreen() {
  const store = useGameStore()
  const { sexualHealth, finance, time, setContraception, haveSex, takePregnancyTest, getAbortion, getSTDTest, treatSTI, doIVF, terminatePregnancy, adoptOutPregnancy } = store
  const [lastMsg, setLastMsg] = useState('')

  const trimesterLabel = ['', '1° Trimestre', '2° Trimestre', '3° Trimestre'][sexualHealth.pregnancyTrimester]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, marginBottom: 8, color: 'var(--color-text)' }}>❤️ Salute Sessuale</h2>

      {lastMsg && (
        <div className="card" style={{ marginBottom: 12, background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.25)' }}>
          <p style={{ fontSize: 13 }}>{lastMsg}</p>
        </div>
      )}

      {/* Pregnancy status */}
      {sexualHealth.isPregnant && (
        <div className="card" style={{ marginBottom: 12, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>🤰 Sei incinta — {trimesterLabel}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { const r = getAbortion(); setLastMsg(r.message) }}
              disabled={sexualHealth.pregnancyTrimester > 2}
              style={{ flex: 1, minWidth: 100, padding: '6px 0', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff' }}>
              IVG (Aborto)
            </button>
            <button onClick={() => { const r = terminatePregnancy(); setLastMsg(r.message) }}
              disabled={sexualHealth.pregnancyTrimester > 2 || finance.money < 500}
              style={{ flex: 1, minWidth: 100, padding: '6px 0', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer', background: '#f97316', color: '#fff', opacity: sexualHealth.pregnancyTrimester > 2 || finance.money < 500 ? 0.5 : 1 }}>
              Interrompi (€500)
            </button>
            <button onClick={() => { const r = adoptOutPregnancy(); setLastMsg(r.message) }}
              style={{ flex: 1, minWidth: 100, padding: '6px 0', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer', background: '#8b5cf6', color: '#fff' }}>
              Dai in adozione
            </button>
          </div>
        </div>
      )}

      {/* Active STIs */}
      {sexualHealth.activeSTIs.length > 0 && (
        <div className="card" style={{ marginBottom: 12, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>⚠️ MST Attive</p>
          {sexualHealth.activeSTIs.map(sti => (
            <div key={sti.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{STI_LABELS[sti.type]}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {sti.isCurable ? '✅ Curabile' : '⚠️ Cronico'} · €{sti.monthlyCost.toLocaleString()}/mese
                </p>
              </div>
              {sti.isCurable && (
                <button onClick={() => { const r = treatSTI(sti.type as STIType); setLastMsg(r.message) }}
                  style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, border: 'none', cursor: 'pointer', background: '#10b981', color: '#fff' }}>
                  Cura
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status summary */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>Stato</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: 'Contraccettivo', val: CONTRACEPTION_OPTIONS.find(c => c.id === sexualHealth.contraceptionMethod)?.name ?? 'Nessuno' },
            { label: 'Partner sessuali', val: String(sexualHealth.sexualPartnersCount) },
            { label: 'Fertilità', val: sexualHealth.isInfertile ? '❌ Infertile' : '✅ Fertile' },
            { label: 'MST', val: sexualHealth.activeSTIs.length > 0 ? `⚠️ ${sexualHealth.activeSTIs.length}` : '✅ Nessuna' },
          ].map(({ label, val }) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 500 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>Azioni</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {time.age >= 18 ? (
            <button onClick={() => { const r = haveSex(Math.random() < 0.1); setLastMsg(r.message) }}
              style={{ padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#ec4899', color: '#fff' }}>
              💕 Rapporto Sessuale
            </button>
          ) : time.age >= 14 ? (
            <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', color: '#f9a8d4' }}>
              💞 Per ora solo baci e tenerezze (nelle relazioni). I rapporti sessuali si sbloccano a 18 anni.
            </div>
          ) : (
            <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              🔞 Sezione non disponibile alla tua età.
            </div>
          )}
          <button onClick={() => { const r = takePregnancyTest(); setLastMsg(r.message) }}
            disabled={finance.money < 10}
            style={{ padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text)', opacity: finance.money < 10 ? 0.5 : 1 }}>
            🤰 Test di Gravidanza — €10
          </button>
          <button onClick={() => { const r = getSTDTest(); setLastMsg(r.message) }}
            disabled={finance.money < 80}
            style={{ padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text)', opacity: finance.money < 80 ? 0.5 : 1 }}>
            🔬 Test MST — €80
          </button>
          {sexualHealth.isInfertile && (
            <button onClick={() => { const r = doIVF(); setLastMsg(r.message) }}
              disabled={finance.money < 4500 || sexualHealth.isPregnant}
              style={{ padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#7c3aed', color: '#fff', opacity: finance.money < 4500 ? 0.5 : 1 }}>
              🌸 FIV (Fecondazione in Vitro) — €4.500
            </button>
          )}
        </div>
      </div>

      {/* Contraception */}
      <div className="card">
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>Contraccettivo</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CONTRACEPTION_OPTIONS.map(opt => {
            const isActive = sexualHealth.contraceptionMethod === opt.id
            return (
              <button key={opt.id} onClick={() => { const r = setContraception(opt.id); setLastMsg(r.message) }}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12, border: '1px solid',
                  borderColor: isActive ? 'var(--color-cta)' : 'rgba(255,255,255,0.1)',
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <span>{opt.emoji} {opt.name}</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>{opt.efficacy} · {opt.cost}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
