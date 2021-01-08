import { ApiModel, ApiModelProperty } from 'swagger-express-ts'

@ApiModel({
  description: 'Ckb balance',
  name: 'BestPriceModel'
})
export default class BestPriceModel {
  @ApiModelProperty({
    description: 'price',
    required: true
  })
  price: string
}
