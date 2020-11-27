import { ApiModel, ApiModelProperty } from "swagger-express-ts";

@ApiModel({
  description: "Transaction details",
  name: "TransactionDetailsModel",
})
export default class TransactionDetailsModel {

  @ApiModelProperty({
    description: "transaction status",
    required: true,
  })
  status: string;

  @ApiModelProperty({
    description: "transaction amount",
    required: true,
  })
  transaction_fee: string;

  @ApiModelProperty({
    description: "transaction fee",
    required: true,
  })
  amount: string;

  @ApiModelProperty({
    description: "to address",
    required: true,
  })
  to: string;

  @ApiModelProperty({
    description: "from address",
    required: true,
  })
  from: string;

  @ApiModelProperty({
    description: "transaction hash",
    required: true,
  })
  hash: string;

  @ApiModelProperty({
    description: "block no",
    required: true,
  })
  block_no: number;


}

