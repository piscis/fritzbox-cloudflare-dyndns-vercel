import type { Rule } from 'eslint'

const DIRECTIVES = [
  /^\s*eslint(-disable|-enable)?(-next-line|-line)?(\s|$)/,
  /^\s*(global|globals|exported)\s/,
  /^\s*@ts-(expect-error|ignore|nocheck|check)\b/,
  /^\/\s*<reference\s/,
  /^\s*@vitest-environment\s/,
  /^\s*[#@]__(PURE|NO_SIDE_EFFECTS)__\s*$/,
  /^\s*yaml-language-server:/,
  /^\s*v\d+(\.\d+)*\s*$/,
]

interface Located { value: string, loc?: { start: { line: number, column: number }, end: { line: number, column: number } } | null }

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Ban comments: decisions go in docs/adr/, everything else in code, tests or issues.' },
    schema: [],
    messages: {
      noComment: 'No comments. Record a decision in docs/adr/, file an issue for a workaround, or delete it. See .agents/skills/delete-comment/SKILL.md.',
    },
  },
  create(context) {
    const { sourceCode } = context
    const report = (comment: Located) => {
      if (!comment.loc || DIRECTIVES.some(d => d.test(comment.value)))
        return
      context.report({ loc: comment.loc, messageId: 'noComment' })
    }
    return {
      Program() {
        sourceCode.getAllComments().forEach(report)
        const templateBody = (sourceCode.ast as { templateBody?: { comments?: Located[] } }).templateBody
        templateBody?.comments?.forEach(report)
      },
    }
  },
}

export default rule
