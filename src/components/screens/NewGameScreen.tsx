import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { Gender, FamilyBackground, Religion, SexualOrientation, GameMode, AvatarConfig, SkinTone, AvatarHairStyle, AvatarHairColor } from '../../store/types'
import { getDefaultAvatar, SKIN_TONES, HAIR_COLORS } from '../../services/AvatarEngine'
import { AvatarRenderer } from '../avatar/AvatarRenderer'
import db from '../../../public/db.json'

const HAIR_STYLE_OPTIONS: { val: AvatarHairStyle; label: string }[] = [
  { val: 'buzz',     label: 'Buzzcut' },
  { val: 'short',    label: 'Corto' },
  { val: 'medium',   label: 'Medio' },
  { val: 'long',     label: 'Lungo' },
  { val: 'wavy',     label: 'Mosso' },
  { val: 'curly',    label: 'Ricci' },
  { val: 'afro',     label: 'Afro' },
  { val: 'ponytail', label: 'Coda' },
  { val: 'bun',      label: 'Bun' },
  { val: 'bald',     label: 'Pelato' },
]

const HAIR_COLOR_OPTIONS: { val: AvatarHairColor; label: string }[] = [
  { val: 'black',       label: 'Nero' },
  { val: 'dark_brown',  label: 'Castano' },
  { val: 'brown',       label: 'Marrone' },
  { val: 'light_brown', label: 'Bruno' },
  { val: 'blonde',      label: 'Biondo' },
  { val: 'red',         label: 'Rosso' },
  { val: 'auburn',      label: 'Ramato' },
  { val: 'blue',        label: 'Blu' },
  { val: 'pink',        label: 'Rosa' },
]

export function NewGameScreen() {
  const { newGame } = useGameStore()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [nationId, setNationId] = useState('italy')
  const [birthYear, setBirthYear] = useState(2000)
  const [background, setBackground] = useState<FamilyBackground>('middle')
  const [religion, setReligion] = useState<Religion>('catholicism')
  const [orientation, setOrientation] = useState<SexualOrientation>('heterosexual')
  const [gameMode, setGameMode] = useState<GameMode>('normal')
  const [ironMan, setIronMan] = useState(false)
  const [avatar, setAvatar] = useState<AvatarConfig>(() => getDefaultAvatar('male'))

  const updateAvatar = (patch: Partial<AvatarConfig>) =>
    setAvatar(prev => ({ ...prev, ...patch }))

  const handleGenderChange = (g: Gender) => {
    setGender(g)
    setAvatar(getDefaultAvatar(g))
  }

  const handleStart = () => {
    if (!name.trim()) return
    newGame({
      name: name.trim(),
      surname: surname.trim() || 'Rossi',
      gender,
      nationality: nationId,
      birthYear,
      familyBackground: background,
      religion,
      sexualOrientation: orientation,
      emoji: '👶',
      avatar,
    }, nationId, gameMode, ironMan)
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--color-text)',
    fontSize: 14,
    outline: 'none',
  }

  const labelStyle = {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    marginBottom: 4,
    display: 'block' as const,
    fontWeight: 600 as const,
  }

  const skinTones = Object.entries(SKIN_TONES) as [SkinTone, string][]
  const hairColors = HAIR_COLOR_OPTIONS

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌍</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
          Life Simulator 2D
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Crea il tuo personaggio e inizia la tua vita
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Nome *</label>
          <input
            style={inputStyle}
            placeholder="es. Marco"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div>
          <label style={labelStyle}>Cognome</label>
          <input
            style={inputStyle}
            placeholder="es. Rossi"
            value={surname}
            onChange={e => setSurname(e.target.value)}
            maxLength={20}
          />
        </div>

        <div>
          <label style={labelStyle}>Genere</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { val: 'male', label: '👨 Maschio' },
              { val: 'female', label: '👩 Femmina' },
              { val: 'non_binary', label: '🧑 Non-binary' },
            ].map(({ val, label }) => (
              <button
                key={val}
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderColor: gender === val ? 'var(--color-cta)' : 'var(--color-border)',
                  backgroundColor: gender === val ? 'rgba(233,69,96,0.1)' : 'var(--bg-secondary)',
                }}
                onClick={() => handleGenderChange(val as Gender)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Avatar Customization ── */}
        <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', background: 'rgba(124,92,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>🎨 Personalizza il tuo avatar</span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Preview */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ borderRadius: 16, border: '2px solid rgba(124,92,255,0.4)', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                <AvatarRenderer size="lg" config={avatar} age={0} gender={gender} />
              </div>
            </div>

            {/* Skin tone */}
            <div>
              <p style={labelStyle}>Carnagione</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {skinTones.map(([key, hex]) => (
                  <button
                    key={key}
                    onClick={() => updateAvatar({ skinTone: key })}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: hex, flexShrink: 0,
                      outline: avatar.skinTone === key ? `3px solid var(--primary)` : '2px solid rgba(255,255,255,0.15)',
                      outlineOffset: 2,
                    }}
                    title={key}
                  />
                ))}
              </div>
            </div>

            {/* Hair style */}
            <div>
              <p style={labelStyle}>Capelli</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {HAIR_STYLE_OPTIONS.map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => updateAvatar({ hairStyle: val })}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, border: 'none', cursor: 'pointer',
                      background: avatar.hairStyle === val ? 'rgba(124,92,255,0.3)' : 'rgba(255,255,255,0.07)',
                      color: avatar.hairStyle === val ? 'var(--primary)' : 'var(--color-text-secondary)',
                      outline: avatar.hairStyle === val ? '1px solid rgba(124,92,255,0.5)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair color */}
            {avatar.hairStyle !== 'bald' && (
              <div>
                <p style={labelStyle}>Colore capelli</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {hairColors.map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => updateAvatar({ hairColor: val })}
                      title={label}
                      style={{
                        width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: HAIR_COLORS[val], flexShrink: 0,
                        outline: avatar.hairColor === val ? '3px solid var(--primary)' : '2px solid rgba(255,255,255,0.15)',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Anno di nascita: {birthYear}</label>
          <input
            type="range"
            min={1950}
            max={2020}
            value={birthYear}
            onChange={e => setBirthYear(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-cta)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)' }}>
            <span>1950</span>
            <span>2020</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Nazionalità</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={nationId}
            onChange={e => setNationId(e.target.value)}
          >
            {db.nations.map(n => (
              <option key={n.id} value={n.id}>
                {n.flag} {n.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Background familiare</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={background}
            onChange={e => setBackground(e.target.value as FamilyBackground)}
          >
            <option value="poor">💸 Povero (€200 iniziali)</option>
            <option value="lower_middle">📉 Bassa classe media (€500)</option>
            <option value="middle">🏠 Classe media (€1000)</option>
            <option value="upper_middle">📈 Alta classe media (€3000)</option>
            <option value="rich">💰 Ricco (€10000)</option>
            <option value="elite">💎 Elite (€50000)</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Religione</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={religion}
            onChange={e => setReligion(e.target.value as Religion)}
          >
            <option value="catholicism">✝️ Cattolicesimo</option>
            <option value="islam">☪️ Islam</option>
            <option value="buddhism">☸️ Buddismo</option>
            <option value="hinduism">🕉️ Induismo</option>
            <option value="judaism">✡️ Ebraismo</option>
            <option value="protestantism">🙏 Protestantesimo</option>
            <option value="orthodoxy">☦️ Ortodossia</option>
            <option value="atheism">🔬 Ateismo</option>
            <option value="agnosticism">🤔 Agnosticismo</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Orientamento sessuale</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={orientation}
            onChange={e => setOrientation(e.target.value as SexualOrientation)}
          >
            <option value="heterosexual">Eterosessuale</option>
            <option value="homosexual">Omosessuale</option>
            <option value="bisexual">Bisessuale</option>
            <option value="pansexual">Pansessuale</option>
            <option value="asexual">Asessuale</option>
          </select>
        </div>

        {/* Game Mode */}
        <div>
          <label style={labelStyle}>Modalità di gioco</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { val: 'normal', label: '🎮 Normale', desc: 'Esperienza bilanciata' },
              { val: 'hard',   label: '💀 Difficile', desc: 'Salario -30%, declino più rapido' },
            ].map(({ val, label, desc }) => (
              <button
                key={val}
                onClick={() => setGameMode(val as GameMode)}
                style={{
                  ...inputStyle,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: gameMode === val ? (val === 'hard' ? '#f87171' : 'var(--color-cta)') : 'var(--color-border)',
                  backgroundColor: gameMode === val ? (val === 'hard' ? 'rgba(248,113,113,0.1)' : 'rgba(233,69,96,0.1)') : 'var(--bg-secondary)',
                  padding: '8px 12px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Iron Man Mode */}
        <div
          style={{
            padding: '12px',
            borderRadius: 10,
            border: `1px solid ${ironMan ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
            background: ironMan ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
          }}
          onClick={() => setIronMan(v => !v)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: ironMan ? '#f87171' : '#e2e8f0', fontSize: 14 }}>
                ☠️ Iron Man Mode
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Morte permanente, niente continue, declino +30%. Ribbon esclusivo.
              </div>
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 11,
              background: ironMan ? '#f87171' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.2s', position: 'relative', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: ironMan ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          className="btn-age"
          onClick={handleStart}
          disabled={!name.trim()}
          style={{ opacity: !name.trim() ? 0.5 : 1 }}
        >
          🚀 Inizia la tua vita!
        </button>
      </div>
    </div>
  )
}
