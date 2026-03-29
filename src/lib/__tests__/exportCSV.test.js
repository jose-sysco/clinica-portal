import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  prepareAppointments,
  preparePatients,
  prepareWaitlist,
  APPOINTMENTS_CSV,
  PATIENTS_CSV,
} from '../exportCSV'

// ---------------------------------------------------------------------------
// prepareAppointments
// ---------------------------------------------------------------------------
describe('prepareAppointments', () => {
  const raw = {
    id: 1,
    scheduled_at: '2026-03-28T10:30:00',
    ends_at:      '2026-03-28T11:00:00',
    status:       'confirmed',
    appointment_type: 'first_visit',
    reason: 'Consulta general',
    doctor:  { full_name: 'Dr. García' },
    patient: { name: 'Firulais' },
    owner:   { full_name: 'Juan Pérez', phone: '55551234' },
  }

  it('extrae fecha y horas de scheduled_at / ends_at sin conversión de zona', () => {
    const [result] = prepareAppointments([raw])
    expect(result._date).toBe('2026-03-28')
    expect(result._time_start).toBe('10:30')
    expect(result._time_end).toBe('11:00')
  })

  it('traduce status al español', () => {
    const [result] = prepareAppointments([raw])
    expect(result.status).toBe('Confirmada')
  })

  it('traduce appointment_type al español', () => {
    const [result] = prepareAppointments([raw])
    expect(result.appointment_type).toBe('Primera visita')
  })

  it('mantiene campos no traducidos intactos', () => {
    const [result] = prepareAppointments([raw])
    expect(result.reason).toBe('Consulta general')
    expect(result.doctor.full_name).toBe('Dr. García')
  })

  it('maneja scheduled_at nulo sin romper', () => {
    const [result] = prepareAppointments([{ ...raw, scheduled_at: null, ends_at: null }])
    expect(result._date).toBe('')
    expect(result._time_start).toBe('')
    expect(result._time_end).toBe('')
  })

  it('mantiene status original si no hay traducción', () => {
    const [result] = prepareAppointments([{ ...raw, status: 'unknown_status' }])
    expect(result.status).toBe('unknown_status')
  })
})

// ---------------------------------------------------------------------------
// preparePatients
// ---------------------------------------------------------------------------
describe('preparePatients', () => {
  it('traduce status al español', () => {
    const [result] = preparePatients([{ id: 1, name: 'Fido', status: 'active' }])
    expect(result.status).toBe('Activo')
  })

  it('preserva status desconocido tal cual', () => {
    const [result] = preparePatients([{ id: 1, name: 'Fido', status: 'otro' }])
    expect(result.status).toBe('otro')
  })
})

// ---------------------------------------------------------------------------
// prepareWaitlist
// ---------------------------------------------------------------------------
describe('prepareWaitlist', () => {
  it('traduce status y recorta created_at a fecha', () => {
    const [result] = prepareWaitlist([{
      id: 1,
      status: 'waiting',
      created_at: '2026-03-28T08:00:00',
    }])
    expect(result.status).toBe('En espera')
    expect(result.created_at).toBe('2026-03-28')
  })

  it('maneja created_at nulo sin romper', () => {
    const [result] = prepareWaitlist([{ id: 1, status: 'waiting', created_at: null }])
    expect(result.created_at).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Column definitions sanity check
// ---------------------------------------------------------------------------
describe('column definitions', () => {
  it('APPOINTMENTS_CSV tiene el mismo número de headers y keys', () => {
    expect(APPOINTMENTS_CSV.headers.length).toBe(APPOINTMENTS_CSV.keys.length)
  })

  it('PATIENTS_CSV tiene el mismo número de headers y keys', () => {
    expect(PATIENTS_CSV.headers.length).toBe(PATIENTS_CSV.keys.length)
  })
})

// ---------------------------------------------------------------------------
// downloadCSV — verifica que dispara la descarga
// ---------------------------------------------------------------------------
describe('downloadCSV', () => {
  beforeEach(() => {
    // jsdom no implementa URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock')
    global.URL.revokeObjectURL = vi.fn()

    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      parentNode: null,
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
  })

  it('genera CSV con BOM y cabecera correcta', async () => {
    const { downloadCSV } = await import('../exportCSV')

    let capturedContent = null
    // Blob is a real constructor — use a class mock
    global.Blob = class {
      constructor(parts) { capturedContent = parts[0] }
    }

    downloadCSV(
      'test',
      ['ID', 'Nombre'],
      ['id',  'name'],
      [{ id: 1, name: 'Fido' }]
    )

    expect(capturedContent).toContain('"ID","Nombre"')
    expect(capturedContent).toContain('"1","Fido"')
  })
})
