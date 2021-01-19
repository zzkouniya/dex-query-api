export interface ForceBridgeRepository {
  getForceBridgeHistory: (ckbAddress: string, ethAddress: string, pureCross: boolean) => Promise<[]>
}
