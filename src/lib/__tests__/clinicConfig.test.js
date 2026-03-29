import { describe, it, expect } from 'vitest'
import { getConfig, clinicConfig } from '../clinicConfig'

describe('getConfig', () => {
  it('retorna la configuración de veterinaria', () => {
    const config = getConfig('veterinary')
    expect(config.patientLabel).toBe('Mascota')
    expect(config.ownerLabel).toBe('Dueño')
    expect(config.showSpecies).toBe(true)
    expect(config.showBreed).toBe(true)
    expect(config.requiresOwner).toBe(true)
    expect(config.showBloodType).toBe(false)
  })

  it('retorna la configuración general para tipo desconocido', () => {
    const config = getConfig('tipo_que_no_existe')
    expect(config).toEqual(clinicConfig.general)
  })

  it('retorna la configuración de pediatría', () => {
    const config = getConfig('pediatric')
    expect(config.patientType).toBe('human')
    expect(config.showBloodType).toBe(true)
    expect(config.requiresOwner).toBe(true)
    expect(config.showMicrochip).toBe(false)
  })

  it('retorna la configuración de odontología (dental)', () => {
    const config = getConfig('dental')
    expect(config.patientType).toBe('human')
    expect(config.adultCheck).toBe(true)
    expect(config.showSpecies).toBe(false)
  })

  it('retorna la configuración de nutrición con label "Cliente"', () => {
    const config = getConfig('nutrition')
    expect(config.patientLabel).toBe('Cliente')
  })

  it('retorna la configuración de coaching con label "Coachee"', () => {
    const config = getConfig('coaching')
    expect(config.patientLabel).toBe('Coachee')
  })

  it('retorna la configuración de fitness con label "Atleta"', () => {
    const config = getConfig('fitness')
    expect(config.patientLabel).toBe('Atleta')
  })
})

describe('clinicConfig — propiedades invariantes', () => {
  const allTypes = Object.keys(clinicConfig)

  it.each(allTypes)('%s tiene patientLabel definido', (type) => {
    expect(clinicConfig[type].patientLabel).toBeTruthy()
  })

  it.each(allTypes)('%s tiene ownerLabel definido', (type) => {
    expect(clinicConfig[type].ownerLabel).toBeTruthy()
  })

  it.each(allTypes)('%s tiene patientType como "human" o "animal"', (type) => {
    expect(['human', 'animal']).toContain(clinicConfig[type].patientType)
  })

  it('solo veterinary tiene showMicrochip = true', () => {
    const withMicrochip = allTypes.filter(t => clinicConfig[t].showMicrochip)
    expect(withMicrochip).toEqual(['veterinary'])
  })

  it('solo veterinary tiene showReproductiveStatus = true', () => {
    const withRepro = allTypes.filter(t => clinicConfig[t].showReproductiveStatus)
    expect(withRepro).toEqual(['veterinary'])
  })
})
