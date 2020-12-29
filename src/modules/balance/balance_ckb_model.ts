import { ApiModel, ApiModelProperty } from 'swagger-express-ts'

@ApiModel({
  description: 'Ckb balance',
  name: 'BalanceCkbModel'
})
export default class BalanceCkbModel {
  @ApiModelProperty({
    description: 'Id of version',
    required: true
  })
  free: string

  @ApiModelProperty({
    description: '',
    required: true
  })
  occupied: string

  @ApiModelProperty({
    description: 'Description of version',
    required: true
  })
  locked_order: string
}
