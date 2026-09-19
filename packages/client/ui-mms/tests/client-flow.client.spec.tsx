// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { DirectoryListing } from '@deepseek-ai/dsh-api-remotes/client'
import type { DirectoryFlowOwnerProps } from '@deepseek-ai/dsh-client-ui-workspace/client'
import { BrowseDirectoryFlow } from '../src/client/flow.ts'

afterEach(cleanup)

const HOME = '/home/u'
const homeListing: DirectoryListing = {
  path: HOME,
  home: HOME,
  crumbs: [{ name: '/', path: '/', hidden: false }, { name: 'u', path: HOME, hidden: false }],
  entries: [{ name: 'Documents', path: `${HOME}/Documents`, hidden: false }],
  truncated: false,
}

function owner(overrides: Partial<DirectoryFlowOwnerProps> = {}): DirectoryFlowOwnerProps {
  return {
    open: true, busy: false,
    onPicked: vi.fn(), onCancel: vi.fn(), onError: vi.fn(),
    ...overrides,
  }
}

describe('project dialog flow adapter', () => {
  it('adapts the owner conversation onto the dialog: confirm picks, dismissal cancels', async () => {
    const props = owner()
    const listDirectory = vi.fn(async (): Promise<DirectoryListing> => homeListing)
    const t = (key: string): string => key
    render(
      <BrowseDirectoryFlow
        useWorkspaces={selector => selector({ items: [], archivedSessionIds: [], phase: 'ready', state: 'idle', error: null })}
        {...props}
        listDirectory={listDirectory}
        createDirectory={vi.fn(async () => '')}
        t={t}
      />,
    )
    // The dialog opened at home; its confirm (browser.open) adopts the listed level.
    const openButton = screen.getByRole<HTMLButtonElement>('button', { name: 'browser.open' })
    await waitFor(() => { expect(openButton.disabled).toBe(false) })
    fireEvent.click(openButton)
    expect(props.onPicked).toHaveBeenCalledWith(HOME)
    fireEvent.click(screen.getByRole('button', { name: 'browser.cancel' }))
    expect(props.onCancel).toHaveBeenCalled()
    expect(props.onError).not.toHaveBeenCalled()
  })

  it('renders nothing while the flow is closed', () => {
    const view = render(
      <BrowseDirectoryFlow
        useWorkspaces={selector => selector({ items: [], archivedSessionIds: [], phase: 'ready', state: 'idle', error: null })}
        {...owner({ open: false })}
        listDirectory={vi.fn(async () => homeListing)}
        createDirectory={vi.fn(async () => '')}
        t={key => key}
      />,
    )
    expect(view.container.innerHTML).toBe('')
  })
})
