export function PrivacyPolicyScreen() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        Life Simulator 2D · Ultimo aggiornamento: giugno 2025
      </p>

      {[
        {
          title: '1. Dati raccolti',
          body: `Life Simulator 2D è progettato per funzionare completamente offline. In modalità offline, tutti i dati di gioco vengono salvati esclusivamente nel localStorage del tuo dispositivo e non vengono mai trasmessi a server esterni.\n\nSe scegli di creare un account per il cloud save (opzionale), raccogliamo:\n• Indirizzo email\n• Password (hash — mai in chiaro)\n• Dati di salvataggio del gioco (stato del personaggio, statistiche, progressi)`,
        },
        {
          title: '2. Come usiamo i dati',
          body: `I dati dell'account vengono usati esclusivamente per:\n• Autenticare l'utente\n• Sincronizzare il salvataggio di gioco tra dispositivi\n• Permettere il recupero del salvataggio in caso di perdita del dispositivo\n\nNon vendiamo, condividiamo o cediamo i tuoi dati a terze parti per scopi commerciali.`,
        },
        {
          title: '3. Provider terze parti',
          body: `Utilizziamo Supabase (supabase.com) come backend per l'autenticazione e il cloud save. Supabase è conforme al GDPR e ai requisiti di privacy europei. I dati sono ospitati su infrastruttura AWS in Europa.\n\nI font vengono caricati da Google Fonts (fonts.googleapis.com). Google raccoglie dati tecnici minimi per la fornitura del servizio.`,
        },
        {
          title: '4. Conservazione dei dati',
          body: `I dati locali rimangono sul tuo dispositivo finché non cancelli i dati dell'app o il browser.\n\nI dati cloud vengono conservati finché mantieni il tuo account. Puoi richiedere la cancellazione completa in qualsiasi momento scrivendo a: privacy@lifesim2d.com`,
        },
        {
          title: '5. Diritti degli utenti (GDPR)',
          body: `Se sei residente nell'Unione Europea, hai il diritto di:\n• Accedere ai tuoi dati personali\n• Richiedere la rettifica di dati errati\n• Richiedere la cancellazione ("diritto all'oblio")\n• Portabilità dei dati (export JSON disponibile nelle Impostazioni)\n• Opporsi al trattamento\n\nPer esercitare questi diritti: privacy@lifesim2d.com`,
        },
        {
          title: '6. Dati dei minori',
          body: `L'app è destinata a utenti di 13+ anni (12+ su Apple App Store per contenuti fantasy). Non raccogliamo consapevolmente dati personali di bambini sotto i 13 anni. Se sei un genitore e ritieni che tuo figlio abbia creato un account, contattaci.`,
        },
        {
          title: '7. Sicurezza',
          body: `Le comunicazioni tra l'app e i server Supabase avvengono via HTTPS/TLS 1.3. Le password vengono hashate con bcrypt prima della memorizzazione. I token di sessione vengono conservati in memoria volatile e non nei cookie persistenti.`,
        },
        {
          title: '8. Cookie e tracciamento',
          body: `L'app non utilizza cookie di profilazione o tracciamento pubblicitario. Non utilizziamo Google Analytics, Facebook Pixel o sistemi di advertising simili. L'unico storage utilizzato è il localStorage del browser per il salvataggio di gioco.`,
        },
        {
          title: '9. Modifiche alla policy',
          body: `In caso di modifiche significative a questa policy, gli utenti registrati verranno notificati via email con almeno 30 giorni di preavviso.`,
        },
        {
          title: '10. Contatti',
          body: `Per domande sulla privacy:\nEmail: privacy@lifesim2d.com\nSito: https://life-simulator-2d.vercel.app`,
        },
      ].map(({ title, body }) => (
        <div key={title} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 6 }}>{title}</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{body}</p>
        </div>
      ))}

      <div style={{ padding: '12px 0', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          Life Simulator 2D v1.0.0 · © 2025 · Tutti i diritti riservati
        </p>
      </div>
    </div>
  )
}
