import { describe, expect, it, vi } from 'vitest'

import codeBlockCtrl from 'muya/lib/contentState/codeBlockCtrl'

interface TestBlock {
  key: string
  children?: TestBlock[]
  functionType?: string
  lang?: string
  nextSibling?: string
  parent?: string
  text?: string
}

class TestContentState {
  blocks: TestBlock[] = []
  cursor: unknown = null
  isGitlabCompatibilityEnabled = false
  partialRender = vi.fn()
  updateMathBlock = vi.fn(() => false)

  getBlock(key: string) {
    const find = (blocks: TestBlock[]): TestBlock | null => {
      for (const block of blocks) {
        if (block.key === key) {
          return block
        }

        const child = find(block.children ?? [])
        if (child) {
          return child
        }
      }

      return null
    }

    return find(this.blocks)
  }

  getParent(block: TestBlock) {
    return this.getBlock(block.parent)
  }

  getNextSibling(block: TestBlock) {
    return this.getBlock(block.nextSibling)
  }

  codeBlockUpdate = vi.fn()
}

codeBlockCtrl(TestContentState)

describe('legacy muyajs code block language selection', () => {
  it('ignores a stale paragraph reference instead of reading functionType from null', () => {
    const contentState = new TestContentState()
    const paragraph = { id: 'removed-block' } as HTMLElement

    expect(contentState.selectLanguage(paragraph, 'javascript')).toBe(false)
    expect(contentState.partialRender).not.toHaveBeenCalled()
  })

  it('ignores a missing block when updating the code language directly', () => {
    const contentState = new TestContentState()

    expect(contentState.updateCodeLanguage(null, 'javascript')).toBe(false)
    expect(contentState.partialRender).not.toHaveBeenCalled()
  })

  it('still updates an existing language input block', () => {
    const codeLine = { key: 'line', lang: '', text: '', children: [] }
    const codeBlock = { key: 'code', lang: '', text: '', children: [codeLine] }
    const languageInput = {
      key: 'lang',
      functionType: 'languageInput',
      text: '',
      parent: 'pre',
      nextSibling: 'code'
    }
    const preBlock = {
      key: 'pre',
      functionType: 'fencecode',
      lang: '',
      text: '',
      children: [languageInput, codeBlock]
    }
    const contentState = new TestContentState()
    contentState.blocks = [preBlock]

    expect(contentState.selectLanguage({ id: 'lang' } as HTMLElement, 'javascript')).toBe(true)

    expect(languageInput.text).toBe('javascript')
    expect(preBlock.lang).toBe('javascript')
    expect(codeBlock.lang).toBe('javascript')
    expect(codeLine.lang).toBe('javascript')
    expect(contentState.cursor).toEqual({
      start: { key: 'line', offset: 0 },
      end: { key: 'line', offset: 0 },
      isEdit: false
    })
    expect(contentState.partialRender).toHaveBeenCalledTimes(1)
  })
})
