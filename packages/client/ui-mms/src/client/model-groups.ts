/**
 * Reshape the Host's model catalog for the composer's seat.
 *
 * MMS gives dsh one provider per approved route, so a model reachable through
 * three channels arrives as three provider groups that each hold a single
 * model: the flat list then shows `MiniMax-M2.7` three times, once under each
 * channel heading. The operator does not pick a route, they pick a MODEL —
 * and only sometimes care which channel carries it.
 *
 * So this module folds the catalog back into family -> model -> channel, and
 * the seat walks it in that order: pick MiniMax, pick M3, done, on the primary
 * channel. Changing the channel stays possible and stays out of the way.
 *
 * Nothing here carries a list of known model names. The family is derived from
 * the model's own name, so a model this file has never heard of groups with
 * its siblings the moment the Host offers it.
 */

import type { ModelCatalogModel, ModelProviderGroup } from '@deepseek-ai/dsh-api-session-controller/types'

/** Suffix MMS appends to a non-primary route's display name. */
const FALLBACK_SUFFIX = ' · 备用'

/** Separator between the model name and the channel in a route's display name. */
const LABEL_SEPARATOR = ' · '

/** One route serving a model: the wire identity plus how to describe it. */
export interface Channel {
  /** Provider id to submit (one MMS route). */
  providerId: string
  /** Model id to submit. */
  modelId: string
  /** Channel name alone, e.g. `newapi-tokyo`. */
  label: string
  /** MMS ranked this route behind the model's primary channel. */
  fallback: boolean
  /** The Host's per-route model facts, including its real reasoning efforts. */
  model: ModelCatalogModel
}

/** One logical model, with every channel that can serve it (primary first). */
export interface LogicalModel {
  /** The model's own name, e.g. `MiniMax-M3`. */
  name: string
  /** Serving routes; `channels[0]` is what picking the model uses. */
  channels: Channel[]
}

/** One model family, e.g. every `MiniMax-*`. */
export interface ModelFamily {
  /** Case-folded grouping key. */
  key: string
  /** Display name, in the casing the models themselves use. */
  label: string
  /** Members, in catalog order. */
  models: LogicalModel[]
}

/**
 * Derive a family label from a model's own name.
 *
 * The first segment is the vendor-ish part (`MiniMax-M3` -> `MiniMax`,
 * `deepseek-v4-flash` -> `deepseek`). A trailing generation digit is dropped
 * so `qwen3-max` and `qwen-plus` land together — but only when what remains is
 * still a word, which keeps a short name like `k3` intact instead of
 * collapsing it to `k`.
 * @param modelName - the model's display name.
 * @returns the family label.
 */
export function familyLabelOf(modelName: string): string {
  const head = modelName.trim().split(/[-_/\s.]/)[0] ?? ''
  if (head === '') return modelName.trim()
  const withoutGeneration = head.replace(/\d+$/, '')
  return withoutGeneration.length >= 3 ? withoutGeneration : head
}

/**
 * Split a route's display name into the channel part and its rank.
 *
 * MMS builds it as `<model> · <channel>[ · 备用]`. A group whose name does not
 * start with the model name is not an MMS route (an upstream provider, say),
 * so its whole name is the channel and it has no fallback rank.
 * @param groupName - the provider group's display name.
 * @param modelName - the model's own name.
 * @returns the channel label and whether MMS ranked it as a fallback.
 */
export function channelOf(groupName: string, modelName: string): { label: string; fallback: boolean } {
  const prefix = `${modelName}${LABEL_SEPARATOR}`
  const withoutModel = groupName.startsWith(prefix) ? groupName.slice(prefix.length) : groupName
  const fallback = withoutModel.endsWith(FALLBACK_SUFFIX)
  return {
    label: fallback ? withoutModel.slice(0, -FALLBACK_SUFFIX.length) : withoutModel,
    fallback,
  }
}

/**
 * Fold the catalog's provider groups into families of models.
 *
 * Catalog order is preserved throughout — MMS already emits primary routes
 * before their fallbacks, and within a model the channels are sorted so a
 * primary leads even if the catalog ever stops guaranteeing that.
 * @param groups - the catalog's provider groups.
 * @returns families, each holding its models, each holding its channels.
 */
export function foldCatalog(groups: readonly ModelProviderGroup[]): ModelFamily[] {
  const families = new Map<string, ModelFamily>()
  const models = new Map<string, LogicalModel>()
  for (const group of groups) {
    for (const model of group.models) {
      const key = familyLabelOf(model.name).toLowerCase()
      let family = families.get(key)
      if (family === undefined) {
        family = { key, label: familyLabelOf(model.name), models: [] }
        families.set(key, family)
      }
      const modelKey = `${key}\u0000${model.name}`
      let logical = models.get(modelKey)
      if (logical === undefined) {
        logical = { name: model.name, channels: [] }
        models.set(modelKey, logical)
        family.models.push(logical)
      }
      const { label, fallback } = channelOf(group.name, model.name)
      logical.channels.push({ providerId: group.id, modelId: model.id, label, fallback, model })
    }
  }
  for (const logical of models.values()) {
    // Stable: a primary leads, and equal ranks keep catalog order.
    logical.channels = logical.channels
      .map((channel, index) => ({ channel, index }))
      .sort((a, b) => Number(a.channel.fallback) - Number(b.channel.fallback) || a.index - b.index)
      .map(entry => entry.channel)
  }
  return [...families.values()]
}

/** One search hit: the model, and the family it came from (for the row's subtitle). */
export interface ModelHit {
  /** The family the model belongs to. */
  family: ModelFamily
  /** The matched model. */
  model: LogicalModel
}

/**
 * Every model matching a query, flattened across families.
 *
 * Typing skips the family step entirely: a query matches the model name, its
 * family, or any of its channels, so `tokyo` finds what that channel serves
 * and `m3` finds the model directly.
 * @param families - the folded catalog.
 * @param query - the operator's search text.
 * @returns matching models with their family, in catalog order.
 */
export function searchModels(families: readonly ModelFamily[], query: string): ModelHit[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []
  const hits: ModelHit[] = []
  for (const family of families) {
    for (const model of family.models) {
      const haystack = [family.label, model.name, ...model.channels.map(channel => channel.label)]
        .join(' ').toLowerCase()
      if (haystack.includes(needle)) hits.push({ family, model })
    }
  }
  return hits
}
