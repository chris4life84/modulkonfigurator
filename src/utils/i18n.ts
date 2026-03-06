const strings: Record<string, string> = {
  'app.title': 'Modulhaus-Konfigurator',
  'app.subtitle': 'Gestalten Sie Ihr individuelles Modulhaus',

  'step.template': 'Vorlage',
  'step.modules': 'Module & Optionen',
  'step.summary': 'Zusammenfassung',

  'nav.back': 'Zurück',
  'nav.next': 'Weiter',
  'nav.finish': 'Konfiguration abschließen',

  'template.select': 'Vorlage auswählen',
  'template.description': 'Wählen Sie eine Vorlage als Ausgangspunkt. Sie können die Konfiguration anschließend frei erweitern.',

  'editor.catalog.title': 'Module hinzufügen',
  'editor.catalog.select': 'Modul auswählen und auf eine grüne Position klicken',
  'editor.selected': 'Ausgewählt',
  'editor.remove': 'Entfernen',
  'editor.rotate': 'Drehen',
  'editor.size.small': 'Klein (3,0 × 1,5 m)',
  'editor.size.large': 'Groß (3,0 × 3,0 m)',
  'editor.click_to_place': 'Klicken zum Platzieren',
  'editor.move': 'Verschieben',
  'editor.move_hint': 'Modul ziehen, um es zu verschieben. Alternativ auf eine blaue Position klicken.',
  'editor.cancel': 'Abbrechen',
  'editor.rotate_blocked': 'Drehung nicht möglich (Überlappung oder Konnektivität)',
  'editor.config.title': 'Konfiguration',
  'editor.placement_hint': 'Klicken Sie auf eine grüne Position, um das Modul zu platzieren.',

  'options.title': 'Optionen konfigurieren',
  'options.description': 'Passen Sie die Details für jedes Modul an.',
  'options.no_options': 'Keine Optionen für diesen Modultyp verfügbar.',

  'summary.title': 'Ihre Konfiguration',
  'summary.modules': 'Module',
  'summary.options_label': 'Optionen',
  'summary.total': 'Gesamtpreis',
  'summary.dimensions': 'Gesamtmaße',
  'summary.contact': 'Kontakt & Anfrage',
  'summary.contact.description': 'Senden Sie uns Ihre Konfiguration für ein unverbindliches Angebot.',
  'summary.contact.name': 'Name',
  'summary.contact.email': 'E-Mail',
  'summary.contact.phone': 'Telefon',
  'summary.contact.message': 'Nachricht',
  'summary.contact.send': 'Anfrage senden',
  'summary.contact.sent': 'Vielen Dank! Wir melden uns bei Ihnen.',

  'price.from': 'ab',
  'price.total': 'Gesamt',

  'dimensions.inner_height': 'Innenhöhe: 2,10 m',
  'dimensions.outer_height': 'Außenhöhe: 2,50 m',

  'view.3d': '3D-Ansicht',
  'view.2d': '2D-Grundriss',

  'editor.drag_hint': 'Modul ziehen oder klicken, dann auf dem Grundriss platzieren',
  'editor.catalog.hint': 'Klicken = platzieren · Ziehen = gezielt platzieren',

  'pdf.export': 'PDF herunterladen',
  'pdf.generating': 'PDF wird erstellt...',
  'pdf.footer': 'Erstellt mit dem Modulhaus-Konfigurator · Alle Preise sind Richtwerte inkl. MwSt.',

  'walls.title': 'Türen & Fenster',
  'walls.shared': 'Verbundwand',
  'walls.wall': 'Wand',
  'walls.door': 'Tür',
  'walls.window': 'Fenster',
  'walls.front': 'Vorne',
  'walls.back': 'Hinten',
  'walls.left': 'Links',
  'walls.right': 'Rechts',
};

export function t(key: string): string {
  return strings[key] ?? key;
}
