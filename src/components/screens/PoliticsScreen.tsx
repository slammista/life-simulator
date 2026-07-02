import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { POLITICAL_PARTIES, POLITICAL_ROLES, type PoliticalRole } from '../../services/PoliticsEngine'
import { feedback as fireFeedback } from '../../services/FeedbackEngine'

const ROLE_ORDER: PoliticalRole[] = ['consigliere_comunale', 'sindaco', 'deputato', 'senatore', 'premier']

export function PoliticsScreen() {
  const {
    politics, stats, time, criminal, finance,
    registerToVote, vote, joinParty, leaveParty,
    conductCampaign, runForOffice, engageInCorruption,
  } = useGameStore()

  const [feedback, setFeedback] = useState('')
  const [tab, setTab] = useState<'overview' | 'parties' | 'career'>('overview')

  const act = (fn: () => { success: boolean; message: string }) => {
    const r = fn()
    fireFeedback(r.success ? 'success' : 'error')
    setFeedback(r.message)
  }

  const currentParty = POLITICAL_PARTIES.find(p => p.id === politics.partyMembership)
  const currentRoleDef = politics.currentRole ? POLITICAL_ROLES[politics.currentRole] : null
  const canVote = politics.isRegisteredVoter && (time.year - politics.lastVotedYear) >= 4

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, fontSize: 13, background: 'rgba(14,165,233,0.1)', borderColor: 'rgba(14,165,233,0.3)' }}>
          {feedback}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {([['overview', '🏛️ Stato'], ['parties', '🗳️ Partiti'], ['career', '📢 Carriera']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 11, border: 'none', cursor: 'pointer',
            background: tab === id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
            color: tab === id ? '#fff' : 'var(--color-text-secondary)',
          }}>{label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Age gate */}
          {time.age < 18 && (
            <div className="card card-locked" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏛️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Partecipazione non disponibile</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Potrai votare, iscriverti a un partito e fare politica dopo i 18 anni.
              </p>
            </div>
          )}
          {/* Current role */}
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>
              {currentRoleDef ? currentRoleDef.emoji : '👤'}
            </div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>
              {currentRoleDef ? currentRoleDef.name : 'Cittadino Privato'}
            </p>
            {currentParty && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {currentParty.emoji} {currentParty.name}
              </p>
            )}
            {currentRoleDef && (
              <p style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>
                Stipendio: €{currentRoleDef.salary.toLocaleString()}/mese
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div className="card" style={{ padding: '10px 14px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>📊 Stato Politico</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['🗳️ Elettore', politics.isRegisteredVoter ? 'Sì' : 'No'],
                ['📢 Campagne', politics.electionsCampaigns.toString()],
                ['🏆 Mandati', politics.mandatesWon.toString()],
                ['💥 Scandali', politics.scandals.toString()],
                ['⚡ Influenza', `${Math.round(politics.politicalInfluence)}/100`],
                ['⚠️ Corruzione', `${Math.round(politics.corruptionLevel)}/100`],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 10px' }}>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Influence bar */}
          <div className="card" style={{ padding: '10px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              Influenza Politica: {Math.round(politics.politicalInfluence)}/100
            </p>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${politics.politicalInfluence}%`, height: '100%', background: '#a78bfa', borderRadius: 4 }} />
            </div>
          </div>

          {/* Quick actions */}
          {!politics.isRegisteredVoter && time.age >= 18 && (
            <button className="btn-primary" style={{ padding: '9px 0', fontSize: 13 }} onClick={() => act(registerToVote)}>
              🗳️ Registrati come Elettore
            </button>
          )}

          {politics.isRegisteredVoter && !canVote && (
            <div className="card" style={{ padding: 10, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              🗓️ Prossime elezioni tra {4 - (time.year - politics.lastVotedYear)} anni
            </div>
          )}
        </div>
      )}

      {/* PARTIES */}
      {tab === 'parties' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {POLITICAL_PARTIES.map(party => {
            const isMember = politics.partyMembership === party.id
            return (
              <div key={party.id} className="card" style={{ padding: '12px 14px', border: isMember ? '1px solid rgba(167,139,250,0.4)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 20 }}>{party.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{party.name}</span>
                    {isMember && <span style={{ fontSize: 10, marginLeft: 8, color: '#a78bfa' }}>● Membro</span>}
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-secondary)' }}>
                    {party.ideology}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {canVote && (
                    <button
                      className="btn-primary"
                      style={{ flex: 1, fontSize: 11, padding: '6px 0' }}
                      onClick={() => act(() => vote(party.id))}
                    >
                      🗳️ Vota
                    </button>
                  )}
                  {!isMember ? (
                    <button
                      className={time.age >= 18 && finance.money >= 200 ? 'btn-primary' : 'btn-secondary'}
                      style={{ flex: 1, fontSize: 11, padding: '6px 0' }}
                      disabled={time.age < 18 || finance.money < 200}
                      onClick={() => act(() => joinParty(party.id))}
                    >
                      ➕ Iscriviti (€200)
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: 11, padding: '6px 0' }}
                      onClick={() => act(leaveParty)}
                    >
                      🚪 Lascia
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CAREER */}
      {tab === 'career' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Campaign action */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>📢 Campagna Elettorale</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Aumenta la tua influenza politica. Costo: €1.500. Campagne fatte: {politics.electionsCampaigns}.
            </p>
            <button
              className={politics.partyMembership && finance.money >= 1500 ? 'btn-primary' : 'btn-secondary'}
              style={{ width: '100%', padding: '8px 0', fontSize: 12 }}
              disabled={!politics.partyMembership || finance.money < 1500}
              onClick={() => act(conductCampaign)}
            >
              {!politics.partyMembership ? 'Devi essere iscritto a un partito' : finance.money < 1500 ? 'Servono €1.500' : '📢 Fai Campagna'}
            </button>
          </div>

          {/* Role cards */}
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Ruoli Politici
          </p>
          {ROLE_ORDER.map(roleId => {
            const def = POLITICAL_ROLES[roleId]
            const isCurrentRole = politics.currentRole === roleId
            const meetsAge = time.age >= def.minAge
            const meetsRep = stats.reputation >= def.minReputation
            const meetsRecord = !def.requiresCleanRecord || !criminal.hasRecord
            const meetsCampaigns = politics.electionsCampaigns >= def.minCampaigns
            const meetsInfluence = politics.politicalInfluence >= def.minInfluence
            const hasMembership = !!politics.partyMembership
            const canRun = meetsAge && meetsRep && meetsRecord && meetsCampaigns && meetsInfluence && hasMembership

            return (
              <div key={roleId} className="card" style={{ padding: '12px 14px', border: isCurrentRole ? '1px solid rgba(251,191,36,0.4)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 20 }}>{def.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{def.name}</span>
                    {isCurrentRole && <span style={{ fontSize: 10, marginLeft: 6, color: '#fbbf24' }}>★ Attuale</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
                    €{def.salary.toLocaleString()}/mese
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {[
                    [meetsAge,        `Min ${def.minAge}a`],
                    [meetsRep,        `Rep ${def.minReputation}`],
                    [meetsRecord,     'Fedina pulita'],
                    [meetsCampaigns,  `${def.minCampaigns} campagne`],
                    [meetsInfluence,  `Inf ${def.minInfluence}`],
                  ].filter(([,label]) => typeof label === 'string').map(([met, label]) => (
                    <span key={String(label)} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10,
                      background: met ? 'rgba(15,155,88,0.15)' : 'rgba(239,68,68,0.12)',
                      color: met ? '#4ade80' : '#ef4444',
                    }}>
                      {met ? '✓' : '✗'} {String(label)}
                    </span>
                  ))}
                </div>
                <button
                  className={canRun && !isCurrentRole ? 'btn-primary' : 'btn-secondary'}
                  style={{ width: '100%', padding: '7px 0', fontSize: 12 }}
                  disabled={!canRun || isCurrentRole}
                  onClick={() => act(() => runForOffice(roleId))}
                >
                  {isCurrentRole ? '★ Ruolo Attuale' : !hasMembership ? 'Serve iscrizione a partito' : canRun ? `${def.emoji} Candidati` : 'Requisiti non soddisfatti'}
                </button>
              </div>
            )
          })}

          {/* Corruption (only if has role) */}
          {politics.currentRole && (
            <div className="card" style={{ padding: '12px 14px', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#ef4444' }}>
                💰 Corruzione (Rischio!)
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Rischio scoperta: ~{Math.round(Math.min(90, 20 + politics.corruptionLevel * 0.7))}%. Livello corruzione: {Math.round(politics.corruptionLevel)}/100.
              </p>
              <button
                className="btn-secondary"
                style={{ width: '100%', padding: '7px 0', fontSize: 12, borderColor: 'rgba(239,68,68,0.4)' }}
                onClick={() => act(engageInCorruption)}
              >
                ⚠️ Accetta Tangente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
