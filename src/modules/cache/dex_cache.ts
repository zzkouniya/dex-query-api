
export interface DexCache {

  set: (key: string, value: string) => void

  get: (key: string) => Promise<string>
}
