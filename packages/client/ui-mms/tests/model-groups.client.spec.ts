/**
 * The catalog folding behind the model seat: one provider group per MMS route
 * in, family -> model -> channel out.
 */
import { describe, expect, it } from 'vitest'
import type { ModelProviderGroup } from '@deepseek-ai/dsh-api-session-controller/types'
import { channelOf, familyLabelOf, foldCatalog, searchModels } from '../src/client/model-groups.ts'

/** One MMS wire face as the catalog delivers it: a channel holding models. */
function face(channel: string, models: readonly string[], suffix = ''): ModelProviderGroup {
  return {
    id: `mms-${channel}${suffix}`,
    name: `${channel}${suffix}`,
    models: models.map(model => ({ id: `wire-${model}`, name: model })),
  }
}

/** The ranking MMS publishes beside the catalog: 0 is the model's primary. */
function ranked(rows: readonly [string, string, number][]) {
  return rows.map(([model, channel, rank]) => ({ model, provider: `mms-${channel}`, rank }))
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
  it('keeps the channel and drops what only tells its faces apart', () => {
    // A model reaches a channel through exactly one face, so `· openai-responses
    // · max` is noise inside that model's own channel list.
    expect(channelOf('newapi-tokyo')).toBe('newapi-tokyo')
    expect(channelOf('newapi-tokyo · openai-responses · max')).toBe('newapi-tokyo')
  })

  it('leaves a non-MMS provider name alone', () => {
    expect(channelOf('Some Upstream Provider')).toBe('Some Upstream Provider')
  })
})

describe('foldCatalog', () => {
  const catalog = [
    face('newapi-tokyo', ['MiniMax-M2.7', 'MiniMax-M3', 'deepseek-v4-flash']),
    face('newapi-company', ['MiniMax-M2.7', 'MiniMax-M3']),
    face('newapi-tencent', ['MiniMax-M2.7']),
  ]
  const ranks = ranked([
    ['MiniMax-M2.7', 'newapi-tokyo', 0], ['MiniMax-M2.7', 'newapi-company', 1],
    ['MiniMax-M2.7', 'newapi-tencent', 2], ['MiniMax-M3', 'newapi-tokyo', 0],
    ['MiniMax-M3', 'newapi-company', 1], ['deepseek-v4-flash', 'newapi-tokyo', 0],
  ])

  it('turns faces holding many models into models holding many channels', () => {
    const families = foldCatalog(catalog, ranks)
    expect(families.map(family => family.label)).toEqual(['MiniMax', 'deepseek'])
    expect(families[0]!.models.map(model => model.name)).toEqual(['MiniMax-M2.7', 'MiniMax-M3'])
    expect(families[0]!.models[0]!.channels.map(channel => channel.label))
      .toEqual(['newapi-tokyo', 'newapi-company', 'newapi-tencent'])
  })

  it('orders a model\'s channels by the rank MMS published, not by catalog order', () => {
    // The ranking no longer rides in the display name, so a catalog that lists
    // the fallbacks first must still put the primary first.
    const families = foldCatalog([
      face('newapi-company', ['MiniMax-M3']),
      face('newapi-tencent', ['MiniMax-M3']),
      face('newapi-tokyo', ['MiniMax-M3']),
    ], ranked([['MiniMax-M3', 'newapi-tokyo', 0], ['MiniMax-M3', 'newapi-company', 1],
      ['MiniMax-M3', 'newapi-tencent', 2]]))
    expect(families[0]!.models[0]!.channels.map(channel => [channel.label, channel.rank]))
      .toEqual([['newapi-tokyo', 0], ['newapi-company', 1], ['newapi-tencent', 2]])
  })

  it('never lets an unranked channel outrank an approved primary', () => {
    // An upstream provider MMS never approved has no rank; it must sort last
    // rather than claim the model's primary channel.
    const families = foldCatalog([
      face('Some Upstream Provider', ['MiniMax-M3']),
      face('newapi-tokyo', ['MiniMax-M3']),
    ], ranked([['MiniMax-M3', 'newapi-tokyo', 0]]))
    expect(families[0]!.models[0]!.channels.map(channel => channel.label))
      .toEqual(['newapi-tokyo', 'Some Upstream Provider'])
  })

  it('keeps catalog order when the Host cannot say how channels rank', () => {
    const families = foldCatalog([
      face('newapi-company', ['MiniMax-M3']),
      face('newapi-tokyo', ['MiniMax-M3']),
    ])
    expect(families[0]!.models[0]!.channels.map(channel => channel.label))
      .toEqual(['newapi-company', 'newapi-tokyo'])
  })

  it('carries each face\'s own wire identity and reasoning facts', () => {
    const efforts = { efforts: [{ id: 'max', name: 'Max' }] }
    const families = foldCatalog([
      { id: 'p-fast', name: 'relay-a', models: [{ id: 'k3-wire-a', name: 'k3' }] },
      { id: 'p-slow', name: 'relay-b', models: [{ id: 'k3-wire-b', name: 'k3', reasoning: efforts }] },
    ], [{ model: 'k3', provider: 'p-fast', rank: 0 }, { model: 'k3', provider: 'p-slow', rank: 1 }])
    const channels = families[0]!.models[0]!.channels
    expect(channels[0]).toMatchObject({ providerId: 'p-fast', modelId: 'k3-wire-a' })
    // Effort levels are per FACE: the seat must read them off the chosen channel.
    expect(channels[0]!.model.reasoning).toBeUndefined()
    expect(channels[1]!.model.reasoning).toEqual(efforts)
  })
})

describe('searchModels', () => {
  const families = foldCatalog([
    face('newapi-tokyo', ['MiniMax-M3']),
    face('newapi-osaka', ['deepseek-v4-flash']),
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
