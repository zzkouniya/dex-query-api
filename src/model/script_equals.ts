import { Script } from '@ckb-lumos/base'
import CkbCellScriptModel from './ckb/ckb_cell_script'

export interface ScriptEquals {
  equalsLockScript: (script: Script | CkbCellScriptModel, targetScript: Script | CkbCellScriptModel) => boolean
  equalsTypeScript: (script: Script | CkbCellScriptModel, targetScript: Script | CkbCellScriptModel) => boolean
}
export class DefaultScriptEquals implements ScriptEquals {
  equalsLockScript (script: Script | CkbCellScriptModel, targetScript: Script | CkbCellScriptModel): boolean {
    return this.equalsScript(script, targetScript)
  }

  equalsTypeScript (script: Script | CkbCellScriptModel, targetScript: Script | CkbCellScriptModel): boolean {
    return this.equalsScript(script, targetScript)
  }

  private equalsScript (script: Script | CkbCellScriptModel, targetScript: Script | CkbCellScriptModel): boolean {
    if (!script || !targetScript) {
      return false
    }
    const s1 = this.normalizeScript(script)
    const s2 = this.normalizeScript(targetScript)
    return (
      s1.code_hash === s2.code_hash &&
          s1.hash_type === s2.hash_type &&
          s1.args === s2.args
    )
  }

  normalizeScript (script: Script | CkbCellScriptModel): {
    code_hash: string
    hash_type: string
    args: string
  } {
    if ('code_hash' in script) {
      const s = script
      return {
        code_hash: s.code_hash,
        hash_type: s.hash_type,
        args: script.args
      }
    }

    return {
      code_hash: script.codeHash,
      hash_type: script.hashType,
      args: script.args
    }
  }
}
