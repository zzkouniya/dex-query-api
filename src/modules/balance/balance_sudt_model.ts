import { ApiModel, ApiModelProperty } from "swagger-express-ts";

@ApiModel({
  description: "Sudt balance",
  name: "BalanceSudtModel",
})
export default class BalanceSudtModel {
  @ApiModelProperty({
    description: "free",
    required: true,
  })
  free: string;

  @ApiModelProperty({
    description: "locked_order",
    required: true,
  })
  locked_order: string;
}

