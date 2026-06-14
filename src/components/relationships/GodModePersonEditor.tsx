// GodModePersonEditor — God Mode only.
// BitLife-style 3-pane editor for any living NPC: Name, Appearance, Attributes.
// Persists via the store's updateRelationship (name, emoji, avatar, attributes).

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { AvatarRenderer } from '../avatar/AvatarRenderer'
import { getRandomAvatar } from '../../services/AvatarEngine'
import { ensureNpcAttributes, NPC_ATTR_META, SEXUALITY_LABELS } from '../../services/NpcAttributes'
import type {
  Relationship, NPCExtendedAttributes, AvatarConfig,
  SkinTone, AvatarHairStyle, AvatarHairColor, AvatarAccessory, SexualOrientation,
} from '../../store/types'

interface Props {
  relId: string
  onClose: () => void
}

const FACE_EMOJIS = ['👨','👩','🧑','👴','👵','👦','👧','🧔','👱‍♂️','👱‍♀️','👨‍🦰','👩‍🦰','👨‍🦱','👩‍🦱','👨‍🦳','👩‍🦳','👨‍🦲','🧑‍🦲','😎','🤓','🥸','👮','🕵️','👷','💂','🤴','👸','🦸','🦹','🧙']

const SKIN_OPTS: SkinTone[] = ['light', 'medium_light', 'medium', 'medium_dark', 'dark']
const HAIR_STYLE_OPTS: AvatarHairStyle[] = ['bald', 'buzz', 'short', 'medium', 'long', 'wavy', 'curly', 'afro', 'ponytail', 'bun']
const HAIR_COLOR_OPTS: AvatarHairColor[] = ['black', 'dark_brown', 'brown', 'light_brown', 'blonde', 'red', 'auburn', 'gray', 'white', 'blue', 'pink']
const ACCESSORY_OPTS: AvatarAccessory[] = ['none', 'glasses_round', 'glasses_square', 'sunglasses', 'hat_cap', 'hat_beanie', 'hat_fedora']
const SEXUALITY_OPTS: SexualOrientation[] = ['heterosexual', 'homosexual', 'bisexual', 'pansexual', 'asexual']

type Pane = 'menu' | 'name' | 'appearance' | 'attributes'

export function GodModePersonEditor({ relId, onClose }: Props) {
  const rel = useGameStore(s => s.relationships.find(r => r.id === relId)) as Relationship | undefined
  const updateRelationship = useGameStore(s => s.updateRelationship)

  const [pane, setPane] = useState<Pane>('menu')
  const [name, setName] = useState(rel?.name ?? '')
  const [emoji, setEmoji] = useState(rel?.emoji ?? '🧑')
  const [avatar, setAvatar] = useState<AvatarConfig | null>(rel?.avatar ?? null)
  const [attrs, setAttrs] = useState<NPCExtendedAttributes>(() =>
    rel ? ensureNpcAttributes(rel) : ({} as NPCExtendedAttributes))

  if (!rel) return null

  const save = () => {
    updateRelationship(rel.id, {
      name: name.trim() || rel.name,
      emoji,
      avatar: avatar ?? undefined,
      extendedAttributes: attrs,
    })
    onClose()
  }

  const setAttr = <K extends keyof NPCExtendedAttributes>(k: K, v: NPCExtendedAttributes[K]) =>
    setAttrs(prev => ({ ...prev, [k]: v }))

  const editAvatar = (patch: Partial<AvatarConfig>) =>
    setAvatar(prev => ({ ...(prev ?? getRandomAvatar(rel.gender)), ...patch }))

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#facc15' }}>God Mode</h2>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
              Modifica {rel.name}, {rel.age} anni
            </p>
          </div>
          <button onClick={onClose} className="icon-btn icon-btn--danger" style={{ width: 34, height: 34 }} aria-label="Chiudi">✕</button>
        </div>

        {/* Live preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          {avatar
            ? <AvatarRenderer size="lg" config={avatar} age={rel.age} gender={rel.gender} />
            : <span style={{ fontSize: 64 }}>{emoji}</span>}
        </div>

        {pane === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PaneButton bg="#38bdf8" onClick={() => setPane('name')}>
              <span style={{ fontSize: 20 }}>{emoji}</span> {name || rel.name}
              <span style={subLabel}>Nome</span>
            </PaneButton>
            <PaneButton bg="#facc15" dark onClick={() => setPane('appearance')}>
              ⚡ Modifica aspetto
            </PaneButton>
            <PaneButton bg="#facc15" dark onClick={() => setPane('attributes')}>
              ⚡ Modifica attributi
            </PaneButton>
            <button onClick={save} className="btn-candy btn-candy--positive"
              style={{ width: '100%', fontSize: 16, padding: '13px 0', marginTop: 6, fontWeight: 800 }}>
              Salva
            </button>
          </div>
        )}

        {pane === 'name' && (
          <div>
            <SectionTitle>Nome completo</SectionTitle>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome e cognome"
              style={textInput}
              autoFocus
            />
            <SectionTitle>Emoji volto</SectionTitle>
            <div style={emojiGrid}>
              {FACE_EMOJIS.map(em => (
                <button key={em} onClick={() => { setEmoji(em); setAvatar(null) }}
                  style={{ ...emojiCell, borderColor: emoji === em && !avatar ? '#facc15' : 'rgba(255,255,255,0.1)' }}>
                  {em}
                </button>
              ))}
            </div>
            <BackButton onClick={() => setPane('menu')} />
          </div>
        )}

        {pane === 'appearance' && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Crea un avatar disegnato. Lascia disattivato per usare l'emoji.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>🎨 Avatar disegnato</span>
              <button
                onClick={() => setAvatar(prev => prev ? null : getRandomAvatar(rel.gender))}
                className={`toggle-switch ${avatar ? 'on' : ''}`}
                aria-label="Toggle avatar"
              />
            </div>
            {avatar && (
              <>
                <Picker label="Carnagione" opts={SKIN_OPTS} value={avatar.skinTone}
                  fmt={skinLabel} onPick={v => editAvatar({ skinTone: v })} />
                <Picker label="Capelli" opts={HAIR_STYLE_OPTS} value={avatar.hairStyle}
                  fmt={hairStyleLabel} onPick={v => editAvatar({ hairStyle: v })} />
                <Picker label="Colore capelli" opts={HAIR_COLOR_OPTS} value={avatar.hairColor}
                  fmt={v => v.replace('_', ' ')} onPick={v => editAvatar({ hairColor: v })} />
                <Picker label="Accessorio" opts={ACCESSORY_OPTS} value={avatar.accessory ?? 'none'}
                  fmt={accessoryLabel} onPick={v => editAvatar({ accessory: v })} />
                <button onClick={() => setAvatar(getRandomAvatar(rel.gender))}
                  className="btn-candy btn-candy--neutral" style={{ width: '100%', fontSize: 13, padding: '9px 0', marginTop: 6 }}>
                  🎲 Casuale
                </button>
              </>
            )}
            <BackButton onClick={() => setPane('menu')} />
          </div>
        )}

        {pane === 'attributes' && (
          <div>
            <SectionTitle>Attributi di {rel.name.split(' ')[0]}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
              {NPC_ATTR_META.map(m => {
                const val = attrs[m.key] as number
                return (
                  <div key={String(m.key)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{m.emoji} {m.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#facc15', minWidth: 38, textAlign: 'right' }}>{val}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={val}
                      onChange={e => setAttr(m.key, Number(e.target.value) as never)}
                      style={{ width: '100%', accentColor: '#facc15' }} />
                  </div>
                )
              })}
              {/* Sexuality */}
              <div>
                <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: 6 }}>🌈 Sessualità</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SEXUALITY_OPTS.map(s => (
                    <button key={s} onClick={() => setAttr('sexuality', s)}
                      style={{
                        padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: '1px solid', borderColor: attrs.sexuality === s ? '#facc15' : 'rgba(255,255,255,0.12)',
                        background: attrs.sexuality === s ? 'rgba(250,204,21,0.18)' : 'rgba(255,255,255,0.05)',
                        color: attrs.sexuality === s ? '#fde047' : 'var(--color-text)',
                      }}>
                      {SEXUALITY_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <BackButton onClick={() => setPane('menu')} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Small UI bits ───────────────────────────────────────────────

function PaneButton({ children, bg, dark, onClick }: { children: React.ReactNode; bg: string; dark?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none', cursor: 'pointer',
      background: bg, color: dark ? '#1a1a2e' : '#fff', fontSize: 15, fontWeight: 800,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 3px 0 rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
    }}>
      {children}
    </button>
  )
}

const subLabel: React.CSSProperties = { marginLeft: 'auto', fontSize: 11, fontWeight: 600, opacity: 0.7 }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 8px' }}>{children}</p>
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-candy btn-candy--neutral"
      style={{ width: '100%', fontSize: 14, padding: '11px 0', marginTop: 16, fontWeight: 700 }}>
      ← Indietro
    </button>
  )
}

function Picker<T extends string>({ label, opts, value, fmt, onPick }: {
  label: string; opts: T[]; value: T; fmt: (v: T) => string; onPick: (v: T) => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {opts.map(o => (
          <button key={o} onClick={() => onPick(o)}
            style={{
              padding: '5px 10px', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: '1px solid', borderColor: value === o ? '#facc15' : 'rgba(255,255,255,0.12)',
              background: value === o ? 'rgba(250,204,21,0.18)' : 'rgba(255,255,255,0.05)',
              color: value === o ? '#fde047' : 'var(--color-text)', textTransform: 'capitalize',
            }}>
            {fmt(o)}
          </button>
        ))}
      </div>
    </div>
  )
}

const skinLabel = (v: string) => ({ light: 'Chiara', medium_light: 'Chiara+', medium: 'Media', medium_dark: 'Scura+', dark: 'Scura' }[v] ?? v)
const hairStyleLabel = (v: string) => ({ bald: 'Calvo', buzz: 'Rasati', short: 'Corti', medium: 'Medi', long: 'Lunghi', wavy: 'Mossi', curly: 'Ricci', afro: 'Afro', ponytail: 'Coda', bun: 'Chignon' }[v] ?? v)
const accessoryLabel = (v: string) => ({ none: 'Nessuno', glasses_round: 'Occhiali ◯', glasses_square: 'Occhiali ▢', sunglasses: 'Sole', hat_cap: 'Cappellino', hat_beanie: 'Berretto', hat_fedora: 'Fedora' }[v] ?? v)

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1100,
  background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
}
const sheet: React.CSSProperties = {
  width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
  background: 'linear-gradient(160deg, #2A2150 0%, #1B1733 100%)',
  borderRadius: '20px 20px 0 0', padding: '20px 18px 32px',
  boxShadow: '0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.16)',
  border: '1px solid rgba(250,204,21,0.3)',
}
const textInput: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 15,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  color: 'var(--color-text)', marginBottom: 16, boxSizing: 'border-box',
}
const emojiGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 8,
}
const emojiCell: React.CSSProperties = {
  fontSize: 24, padding: '6px 0', borderRadius: 10, cursor: 'pointer',
  border: '1px solid', background: 'rgba(255,255,255,0.05)',
}
