export interface TokenInfo {
  name: string
  symbol: string
  decimal: number
  address: string
  amount: number
  chianName: string
}

export interface SudtTokenInfo extends TokenInfo {
  typeHash: string
}

// example
// const glia: SudtTokenInfo = {
//   name: 'Glias Dex Test',
//   symbol: 'GDT',
//   decimal: 8,
//   address: 'ckt1qyqppsrmkue95prhy4faekhqg7re5zxh8czq8w7sdn',
//   amount: 9909988048.9891405,
//   chianName: 'ckb',
//   typeHash: '0x788c79191970e313693351531930b46a708b1ca58f6d414ddc8a8827afb554ff'

// }
