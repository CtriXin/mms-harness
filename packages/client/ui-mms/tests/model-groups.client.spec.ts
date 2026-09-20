/**
 * The catalog folding behind the model seat: one provider group per MMS route
 * in, family -> model -> channel out.
 */
import { describe, expect, it } from 'vitest'
import type { ModelProviderGroup } from '@deepseek-ai/dsh-api-session-controller/types'
import { channelOf, familyLabelOf, foldCatalog, searchModels } from '../src/client/model-groups.ts'

/** One MMS route as the catalog delivers it: a provider holding a single model. */
function route(model: string, channel: string, fallback = false): ModelProviderGroup {
  return {
    id: `mms-${model}-${channel}`,
    name: `${model} · ${channel}${fallback ? ' · 备用' : ''}`,
    models: [{ id: `wire-${model}`, name: model }],
  }
}

describe('familyLabelOf', () => {
  it('takes the vendor segment of the model name', () => {
    expect(familyLabelOf('MiniMax-M2.7')).toBe('MiniMax')
    expect(familyLabelOf('deepseek-v4-flash')).toBe('deepseek')
    expect(familyLabelOf('claude-opus-5')).toBe('claude')
    expect(familyLabelOf('gpt-5.6-sol')).toBe('gpt')
  })

  it('folds a generation digit into its family, but not away to a single letter', () => {
    expect(familyLabelOf('qwen3-max')).toBe(familyLabelOf('qwen-plus'))
    expect(familyLabelOf('qwen3-max')).toBe('qwen')
    // `k3` must stay `k3`: stripping the digit would file it under `k`.
    expect(familyLabelOf('k3')).toBe('k3')
  })
})

describe('channelOf', () => {
  it('keeps only the channel, and reports the fallback rank', () => {
    expect(channelOf('MiniMax-M3 · newapi-tokyo', 'MiniMax-M3'))
      .toEqual({ label: 'newapi-tokyo', fallback: false })
    expect(channelOf('MiniMax-M3 · newapi-company · 备用', 'MiniMax-M3'))
      .toEqual({ label: 'newapi-company', fallback: true })
  })

  it('leaves a non-MMS provider name alone', () => {
    expect(channelOf('Some Upstream Provider', 'gpt-5.6'))
      .toEqual({ label: 'Some Upstream Provider', fallback: false })
  })
})

describe('foldCatalog', () => {
  const catalog = [
    route('MiniMax-M2.7', 'newapi-tokyo'),
    route('MiniMax-M2.7', 'newapi-company', true),
    route('MiniMax-M2.7', 'newapi-tencent', true),
    route('MiniMax-M3', 'newapi-tokyo'),
    route('MiniMax-M3', 'newapi-company', true),
    route('deepseek-v4-flash', 'newapi-tokyo'),
  ]

  it('collapses the repeated rows into one row per model', () => {
    const families = foldCatalog(catalog)
    expect(families.map(family => family.label)).toEqual(['MiniMax', 'deepseek'])
    expect(families[0]!.models.map(model => model.name)).toEqual(['MiniMax-M2.7', 'MiniMax-M3'])
    // Six catalog rows became two MiniMax rows; the channels moved one level down.
    expect(families[0]!.models[0]!.channels.map(channel => channel.label))
      .toEqual(['newapi-tokyo', 'newapi-company', 'newapi-tencent'])
  })

  it('puts the primary channel first, whatever order the catalog arrives in', () => {
    const families = foldCatalog([
      route('MiniMax-M3', 'newapi-company', true),
      route('MiniMax-M3', 'newapi-tencent', true),
      route('MiniMax-M3', 'newapi-tokyo'),
    ])
    const channels = families[0]!.models[0]!.channels
    expect(channels[0]).toMatchObject({ label: 'newapi-tokyo', fallback: false })
    // The remaining fallbacks keep catalog order rather than being reshuffled.
    expect(channels.slice(1).map(channel => channel.label)).toEqual(['newapi-company', 'newapi-tencent'])
  })

  it('carries each route\'s own wire identity and reasoning facts', () => {
    const efforts = { efforts: [{ id: 'max', name: 'Max' }] }
    const families = foldCatalog([
      { id: 'p-fast', name: 'k3 · relay-a', models: [{ id: 'k3-wire-a', name: 'k3' }] },
      { id: 'p-slow', name: 'k3 · relay-b · 备用', models: [{ id: 'k3-wire-b', name: 'k3', reasoning: efforts }] },
    ])
    const channels = families[0]!.models[0]!.channels
    expect(channels[0]).toMatchObject({ providerId: 'p-fast', modelId: 'k3-wire-a' })
    // Effort levels are per ROUTE: the seat must read them off the chosen channel.
    expect(channels[0]!.model.reasoning).toBeUndefined()
    expect(channels[1]!.model.reasoning).toEqual(efforts)
  })
})

describe('searchModels', () => {
  const families = foldCatalog([
    route('MiniMax-M3', 'newapi-tokyo'),
    route('deepseek-v4-flash', 'newapi-osaka'),
  ])

  it('matches a model by its own name, its family, or a channel that serves it', () => {
    expect(searchModels(families, 'm3').map(hit => hit.model.name)).toEqual(['MiniMax-M3'])
    expect(searchModels(families, 'minimax').map(hit => hit.model.name)).toEqual(['MiniMax-M3'])
    expect(searchModels(families, 'osaka').map(hit => hit.model.name)).toEqual(['deepseek-v4-flash'])
  })

  it('answers nothing for an empty query, so the family list stays in charge', () => {
    expect(searchModels(families, '   ')).toEqual([])
  })
})
