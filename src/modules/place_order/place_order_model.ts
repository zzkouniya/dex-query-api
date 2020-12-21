import { ApiModel, ApiModelProperty } from "swagger-express-ts"
@ApiModel({
  description: "PlaceOrder",
  name: "PlaceOrderModel"
})
export class Payload {

    @ApiModelProperty({
      description: "pay",
      required: true,
    })
    pay: string

    @ApiModelProperty({
      description: "price",
      required: true,
    })
    price: string

    @ApiModelProperty({
      description: "udt_type_args",
      required: true,
    })
    udt_type_args: string

    @ApiModelProperty({
      description: "ckb_address",
      required: true,
    })
    ckb_address: string

    @ApiModelProperty({
      description: "is_bid",
      required: true,
    })
    is_bid: boolean

    @ApiModelProperty({
      description: "udt_decimals",
      required: true,
    })
    udt_decimals: number
    // spent_cells?: Array<LumosOutPoint>
}
