import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { CloudSaveService, type CloudUser } from '../../services/CloudSaveService'
import { AdRewardButton } from '../game/AdRewardButton'
import db from '../../../public/db.json'

// ─── Cloud Save Panel ────────────────────────────────────────────

function CloudSavePanel() {
  const [user, setUser] = useState<CloudUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const isConfigured = CloudSaveService.isConfigured()

  useEffect(() => {
    if (isConfigured) {
      CloudSaveService.getCurrentUser().then(setUser)
    }
  }, [isConfigured])

  function flash(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  async function handleAuth() {
    if (!email || !password) { flash('Inserisci email e password', 'err'); return }
    setLoading(true)
    const fn = mode === 'login' ? CloudSaveService.signIn : CloudSaveService.signUp
    const res = await fn(email, password)
    setLoading(false)
    if (res.success) {
      const u = await CloudSaveService.getCurrentUser()
      setUser(u)
      flash(mode === 'login' ? '✅ Accesso effettuato' : '✅ Account creato — controlla la tua email')
    } else {
      flash(res.error ?? 'Errore', 'err')
    }
  }

  async function handleSignOut() {
    await CloudSaveService.signOut()
    setUser(null)
    flash('Disconnesso')
  }

  async function handleUpload() {
    setLoading(true)
    const res = await CloudSaveService.uploadSave()
    setLoading(false)
    flash(res.success ? '☁️ Salvataggio caricato nel cloud' : (res.error ?? 'Errore'), res.success ? 'ok' : 'err')
  }

  async function handleDownload() {
    if (!confirm('Sovrascrivere il salvataggio locale con quello cloud?')) return
    setLoading(true)
    const res = await CloudSaveService.downloadSave()
    setLoading(false)
    if (res.success) {
      flash('✅ Salvataggio cloud scaricato — ricarica la pagina')
    } else {
      flash(res.error ?? 'Errore', 'err')
    }
  }

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '7px 0', borderRadius: 8, fontSize: 13, border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    background: loading ? 'rgba(255,255,255,0.1)' : color,
    color: '#fff', opacity: loading ? 0.6 : 1, width: '100%', marginBottom: 8,
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13, marginBottom: 8,
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'var(--color-text)', boxSizing: 'border-box',
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginBottom: 8 }}>☁️ Cloud Save</p>

      {msg && (
        <div style={{ padding: '6px 10px', borderRadius: 8, marginBottom: 8, fontSize: 12,
          background: msgType === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: msgType === 'ok' ? '#10b981' : '#ef4444',
        }}>
          {msg}
        </div>
      )}

      {!isConfigured ? (
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            Cloud save non configurato. Per abilitarlo:
          </p>
          <ol style={{ fontSize: 11, color: 'var(--color-text-secondary)', paddingLeft: 16, margin: 0 }}>
            <li>Crea un progetto su <strong>supabase.com</strong></li>
            <li>Crea il file <code>.env</code> con <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code></li>
            <li>Crea la tabella <code>saves</code> nel database Supabase</li>
            <li>Riavvia il server di sviluppo</li>
          </ol>
        </div>
      ) : user ? (
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            👤 {user.email}
          </p>
          <button onClick={handleUpload} style={btnStyle('#3b82f6')} disabled={loading}>
            ⬆️ Carica salvataggio nel cloud
          </button>
          <button onClick={handleDownload} style={btnStyle('#6366f1')} disabled={loading}>
            ⬇️ Scarica salvataggio dal cloud
          </button>
          <button onClick={handleSignOut} style={{ ...btnStyle('rgba(255,255,255,0.08)'), color: 'var(--color-text-secondary)' }}>
            Disconnetti
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '5px 0', borderRadius: 20, fontSize: 12, border: 'none', cursor: 'pointer',
                background: mode === m ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                color: mode === m ? '#fff' : 'var(--color-text-secondary)',
              }}>
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>
          <input
            type="email" placeholder="Indirizzo email" value={email}
            onChange={e => setEmail(e.target.value)} style={inputStyle}
          />
          <input
            type="password" placeholder="Password (min. 6 caratteri)" value={password}
            onChange={e => setPassword(e.target.value)} style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
          />
          <button onClick={handleAuth} style={btnStyle('#3b82f6')} disabled={loading}>
            {loading ? 'Caricamento...' : mode === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Backup / Export panel ───────────────────────────────────────

function BackupPanel() {
  const [msg, setMsg] = useState('')

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleExport() {
    CloudSaveService.exportToFile()
    flash('💾 File JSON scaricato')
  }

  async function handleImport() {
    const ok = await CloudSaveService.importFromFile()
    if (ok) flash('✅ Salvataggio importato — ricarica la pagina per applicarlo')
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
        💾 Backup Locale
      </p>
      {msg && (
        <div style={{ padding: '6px 10px', borderRadius: 8, marginBottom: 8, fontSize: 12,
          background: 'rgba(16,185,129,0.15)', color: '#10b981',
        }}>
          {msg}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleExport} style={{
          flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, border: 'none',
          cursor: 'pointer', background: '#10b981', color: '#fff',
        }}>
          ⬇️ Esporta JSON
        </button>
        <button onClick={handleImport} style={{
          flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, border: 'none',
          cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text)',
        }}>
          ⬆️ Importa JSON
        </button>
      </div>
      <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 6 }}>
        Il salvataggio è automatico ad ogni azione. Esporta per fare backup manuali.
      </p>
    </div>
  )
}

// ─── Legal Name Change ───────────────────────────────────────────

function LegalNamePanel() {
  const changeLegalName = useGameStore(s => s.changeLegalName)
  const identity = useGameStore(s => s.identity)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function handle() {
    if (!firstName.trim() && !lastName.trim()) {
      setMsg({ text: 'Inserisci almeno un nome o cognome.', ok: false }); return
    }
    const r = changeLegalName(firstName.trim() || identity.name, lastName.trim() || undefined)
    setMsg({ text: r.message, ok: r.success })
    if (r.success) { setFirstName(''); setLastName('') }
    setTimeout(() => setMsg(null), 4000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13, marginBottom: 8,
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'var(--color-text)', boxSizing: 'border-box',
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 8 }}>📝 Cambio nome legale</p>
      {msg && (
        <div style={{ padding: '6px 10px', borderRadius: 8, marginBottom: 8, fontSize: 12,
          background: msg.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: msg.ok ? '#10b981' : '#ef4444',
        }}>
          {msg.text}
        </div>
      )}
      <input type="text" placeholder={`Nuovo nome (attuale: ${identity.name})`} value={firstName}
        onChange={e => setFirstName(e.target.value)} style={inputStyle} />
      <input type="text" placeholder={`Nuovo cognome (attuale: ${identity.surname})`} value={lastName}
        onChange={e => setLastName(e.target.value)} style={inputStyle} />
      <button
        onClick={handle}
        style={{ width: '100%', padding: '7px 0', borderRadius: 8, fontSize: 13, border: 'none',
          cursor: 'pointer', background: '#f59e0b', color: '#fff' }}>
        📝 Cambia nome (€300)
      </button>
    </div>
  )
}

// ─── Will Editor ─────────────────────────────────────────────────

function WillEditorPanel() {
  const will = useGameStore(s => s.will)
  const updateWill = useGameStore(s => s.updateWill)
  const relationships = useGameStore(s => s.relationships)
  const time = useGameStore(s => s.time)
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const livingRels = relationships.filter(r => r.isAlive && !['acquaintance'].includes(r.type))

  const currentWill = will ?? {
    beneficiaries: [],
    donationCharity: 0,
    funeralType: 'normal' as const,
    organDonor: false,
    note: '',
  }

  const [beneficiaries, setBeneficiaries] = useState(currentWill.beneficiaries)
  const [charityPct, setCharityPct] = useState(currentWill.donationCharity)
  const [funeralType, setFuneralType] = useState<'simple' | 'normal' | 'luxury'>(currentWill.funeralType)
  const [organDonor, setOrganDonor] = useState(currentWill.organDonor)
  const [note, setNote] = useState(currentWill.note)

  if (time.age < 18) return null

  const totalPct = beneficiaries.reduce((s, b) => s + b.share, 0) + charityPct

  function setBenefShare(relId: string, share: number) {
    setBeneficiaries(prev => {
      const existing = prev.find(b => b.relId === relId)
      if (share === 0) return prev.filter(b => b.relId !== relId)
      const rel = livingRels.find(r => r.id === relId)
      if (!rel) return prev
      if (existing) return prev.map(b => b.relId === relId ? { ...b, share } : b)
      return [...prev, { relId, name: rel.name, share }]
    })
  }

  function handleSave() {
    if (totalPct > 100) {
      setMsg({ text: `La somma delle quote supera il 100% (${totalPct}%). Riduci alcuni valori.`, ok: false })
      return
    }
    updateWill({ beneficiaries, donationCharity: charityPct, funeralType, organDonor, note })
    setMsg({ text: '✅ Testamento aggiornato.', ok: true })
    setTimeout(() => setMsg(null), 3000)
  }

  const inputStyle: React.CSSProperties = {
    padding: '5px 8px', borderRadius: 6, fontSize: 12, width: '64px', textAlign: 'right',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)',
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>📜 Testamento</p>
        <button onClick={() => setOpen(v => !v)}
          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
          {open ? 'Chiudi' : will ? 'Modifica' : 'Redigi'}
        </button>
      </div>
      {!open && will && (
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {will.beneficiaries.length} beneficiari · Funerale: {will.funeralType} · Donazione: {will.donationCharity}%
          {will.organDonor ? ' · 💚 Donatore organi' : ''}
        </p>
      )}
      {open && (
        <div style={{ marginTop: 10 }}>
          {msg && (
            <div style={{ padding: '6px 10px', borderRadius: 8, marginBottom: 8, fontSize: 12,
              background: msg.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: msg.ok ? '#10b981' : '#ef4444' }}>
              {msg.text}
            </div>
          )}

          {/* Beneficiaries */}
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Beneficiari (%)</p>
          {livingRels.slice(0, 8).map(rel => {
            const current = beneficiaries.find(b => b.relId === rel.id)?.share ?? 0
            return (
              <div key={rel.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12 }}>{rel.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: 10 }}>({rel.type})</span></span>
                <input type="number" min={0} max={100} value={current}
                  onChange={e => setBenefShare(rel.id, Math.min(100, Math.max(0, Number(e.target.value))))}
                  style={inputStyle} />
              </div>
            )
          })}

          {/* Charity */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 12 }}>💚 Beneficenza</span>
            <input type="number" min={0} max={100} value={charityPct}
              onChange={e => setCharityPct(Math.min(100, Math.max(0, Number(e.target.value))))}
              style={inputStyle} />
          </div>

          <div style={{ fontSize: 11, marginBottom: 8, color: totalPct > 100 ? '#ef4444' : '#10b981' }}>
            Totale assegnato: {totalPct}% {totalPct > 100 ? '⚠️ supera 100%' : totalPct < 100 ? `(${100 - totalPct}% non assegnato → stato)` : '✅'}
          </div>

          {/* Funeral type */}
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Tipo di funerale</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {(['simple', 'normal', 'luxury'] as const).map(t => (
              <button key={t} onClick={() => setFuneralType(t)}
                style={{ flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 11, border: 'none', cursor: 'pointer',
                  background: funeralType === t ? '#a78bfa' : 'rgba(255,255,255,0.07)',
                  color: funeralType === t ? '#fff' : 'var(--color-text-secondary)' }}>
                {t === 'simple' ? '🪦 Semplice' : t === 'normal' ? '⚱️ Tradizionale' : '👑 Lussuoso'}
              </button>
            ))}
          </div>

          {/* Organ donor */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12 }}>💚 Donatore d'organi</span>
            <button onClick={() => setOrganDonor(v => !v)}
              style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, border: 'none', cursor: 'pointer',
                background: organDonor ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)',
                color: organDonor ? '#10b981' : 'var(--color-text-secondary)' }}>
              {organDonor ? '✅ Sì' : '❌ No'}
            </button>
          </div>

          {/* Note */}
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Note o ultime volontà..."
            rows={2}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12, marginBottom: 8, boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--color-text)', resize: 'none' }}
          />

          <button onClick={handleSave}
            style={{ width: '100%', padding: '7px 0', borderRadius: 8, fontSize: 13, border: 'none',
              cursor: 'pointer', background: '#a78bfa', color: '#fff', fontWeight: 600 }}>
            📜 Salva testamento
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main SettingsScreen ─────────────────────────────────────────

export function SettingsScreen() {
  const { settings, nation, identity, finance, time, adRewards, claimAdReward, cheatAddMoney, cheatSetMaxStats, cheatSetImmortal, cheatSkipToAge, unlockGodMode } =
    useGameStore(useShallow(s => ({
      settings: s.settings,
      nation: s.nation,
      identity: s.identity,
      finance: s.finance,
      time: s.time,
      adRewards: s.adRewards,
      claimAdReward: s.claimAdReward,
      cheatAddMoney: s.cheatAddMoney,
      cheatSetMaxStats: s.cheatSetMaxStats,
      cheatSetImmortal: s.cheatSetImmortal,
      cheatSkipToAge: s.cheatSkipToAge,
      unlockGodMode: s.unlockGodMode,
    })))

  const [cheatMoneyAmt, setCheatMoneyAmt] = useState(10000)
  const [cheatAge, setCheatAge] = useState(time.age + 10)
  const [cheatMsg, setCheatMsg] = useState('')
  const [showCheatWarning, setShowCheatWarning] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  const runCheat = (fn: () => void, msg: string) => {
    fn()
    setCheatMsg(msg)
    setTimeout(() => setCheatMsg(''), 3000)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--color-text)' }}>⚙️ Info & Impostazioni</h2>

      {/* Cloud Save */}
      <CloudSavePanel />

      {/* Local Backup */}
      <BackupPanel />

      {/* Rewarded Ads */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>📺 Premi Gratuiti</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          Guarda un breve annuncio per ricevere un premio a sorpresa. {adRewards.totalWatched > 0 && `(${adRewards.totalWatched} totali guardati)`}
        </p>
        <AdRewardButton adState={adRewards} onClaim={claimAdReward} />
      </div>

      {/* Nation info */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>Nazione</p>
        {nation && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16 }}>{nation.flag} {nation.name}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Tasse: {(nation.taxRate * 100).toFixed(0)}%</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Salario medio</p>
              <p style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>€{nation.avgSalary.toLocaleString('it-IT')}/m</p>
            </div>
          </div>
        )}
      </div>

      {/* Character info */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>Personaggio</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: 'Nome', val: `${identity.name} ${identity.surname}` },
            { label: 'Genere', val: identity.gender },
            { label: 'Nazionalità', val: identity.nationality },
            { label: 'Background', val: identity.familyBackground },
            { label: 'Religione', val: identity.religion },
            { label: 'Orientamento', val: identity.sexualOrientation },
          ].map(({ label, val }) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 500 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legal name change */}
      {time.age >= 18 && <LegalNamePanel />}

      {/* Will editor */}
      {time.age >= 18 && <WillEditorPanel />}

      {/* Game mode */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 600 }}>Modalità di gioco</p>
        <p style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
          {settings.mode === 'god' ? '⚡ Modalità Dio' :
           settings.mode === 'hard' ? '💀 Difficile' :
           settings.ironMan ? '🔒 Iron Man' :
           '🎮 Normale'}
        </p>
        {settings.ironMan && (
          <p style={{ fontSize: 12, color: 'var(--color-negative)', marginTop: 4 }}>
            ⚠️ Iron Man attivo — nessun salvataggio multiplo
          </p>
        )}
      </div>

      {/* God Mode — paywall or unlocked cheat panel */}
      {!settings.godModeUnlocked ? (
        <div className="card" style={{ marginBottom: 12, background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>⚡</div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#c4b5fd', marginBottom: 4 }}>God Mode</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
              Modifica statistiche, aggiungi denaro illimitato, salta gli anni. Accesso permanente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '💰 Aggiungi qualsiasi somma di denaro',
                '⚡ Statistiche al massimo istantaneamente',
                '⏩ Salta a qualsiasi età',
                '♾️ Accesso permanente, una tantum',
              ].map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                  <span style={{ fontSize: 11, color: '#a78bfa' }}>{feat}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowPurchaseModal(true)}
              style={{
                marginTop: 14, width: '100%', padding: '12px 0',
                borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
              }}
            >
              🔓 Sblocca God Mode — €5.99
            </button>
            <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 6 }}>
              Pagamento unico · Nessun abbonamento
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⚡ God Mode — Attivo</p>
            <button onClick={() => setShowCheatWarning(!showCheatWarning)}
              style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
              {showCheatWarning ? 'Nascondi' : 'Mostra'}
            </button>
          </div>

          {showCheatWarning && (
            <>
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#ef4444' }}>
                  ⚠️ L'uso di cheat attiva la <strong>Modalità Dio</strong> e disabilita gli achievement.
                </p>
              </div>

              {cheatMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#818cf8' }}>{cheatMsg}</p>
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Aggiungi denaro</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" min={1000} max={999999999} value={cheatMoneyAmt}
                    onChange={e => setCheatMoneyAmt(Number(e.target.value))}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)', fontSize: 13 }} />
                  <button onClick={() => runCheat(() => cheatAddMoney(cheatMoneyAmt), `💰 +€${cheatMoneyAmt.toLocaleString()} aggiunti!`)}
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#10b981', color: '#fff' }}>
                    +€
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {[10000, 100000, 1000000].map(amt => (
                  <button key={amt} onClick={() => runCheat(() => cheatAddMoney(amt), `💰 +€${amt.toLocaleString()} aggiunti!`)}
                    style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                    +€{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <button onClick={() => runCheat(cheatSetMaxStats, '⚡ Tutte le statistiche al massimo!')}
                style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#6366f1', color: '#fff', marginBottom: 8 }}>
                ⚡ Max Statistiche
              </button>

              <button onClick={() => runCheat(cheatSetImmortal, '☠️ Salute al 100%!')}
                style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#7c3aed', color: '#fff', marginBottom: 8 }}>
                ☠️ Ripristina Salute
              </button>

              <div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Salta all'età</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" min={time.age + 1} max={100} value={cheatAge}
                    onChange={e => setCheatAge(Number(e.target.value))}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)', fontSize: 13 }} />
                  <button onClick={() => {
                    if (cheatAge > time.age) runCheat(() => cheatSkipToAge(cheatAge), `⏩ Saltato a ${cheatAge} anni!`)
                  }}
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#f59e0b', color: '#fff' }}>
                    Salta
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[18, 25, 40, 65].map(age => age > time.age && (
                    <button key={age} onClick={() => runCheat(() => cheatSkipToAge(age), `⏩ Saltato a ${age} anni!`)}
                      style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, border: 'none', cursor: 'pointer', background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                      {age} anni
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* God Mode purchase modal */}
      {showPurchaseModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340,
            border: '1px solid rgba(124,58,237,0.4)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
                Sblocca God Mode
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Accesso permanente a tutti i cheat.<br />Pagamento unico.
              </p>
            </div>

            <div style={{ background: 'rgba(124,58,237,0.12)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#c4b5fd' }}>€5.99</p>
              <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>IVA inclusa · Una tantum</p>
            </div>

            <button
              onClick={async () => {
                setPurchasing(true)
                await new Promise(r => setTimeout(r, 1200))
                unlockGodMode()
                setPurchasing(false)
                setShowPurchaseModal(false)
              }}
              disabled={purchasing}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 15, fontWeight: 700,
                background: purchasing ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff', border: 'none', cursor: purchasing ? 'not-allowed' : 'pointer',
                marginBottom: 10, boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
              }}
            >
              {purchasing ? '⏳ Elaborazione...' : '🔓 Acquista — €5.99'}
            </button>

            <button
              onClick={() => setShowPurchaseModal(false)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13,
                background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Version info */}
      <div className="card">
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 600 }}>App</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Life Simulator 2D v1.0.0</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Stack: React 19 + TypeScript + Zustand v5 + Vite
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Nazioni: {db.nations.length} · Engines attivi: 41 · Schermate: 28
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Saldo: €{finance.money.toLocaleString('it-IT')} · Anno: {time.year} · Età: {time.age}
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          ☁️ Cloud save: {CloudSaveService.isConfigured() ? '✅ Configurato' : '⚪ Non configurato'}
        </p>
      </div>
    </div>
  )
}
