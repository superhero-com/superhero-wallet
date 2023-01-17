/* eslint-disable */
export default {
  "encodedAci": {
    "contract": {
      "functions": [
        {
          "arguments": [
            {
              "name": "_1",
              "type": "int"
            },
            {
              "name": "_2",
              "type": "PoS"
            },
            {
              "name": "_3",
              "type": "int"
            }
          ],
          "name": "burn_trigger_pos",
          "payable": false,
          "returns": "unit",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "_1",
              "type": "address"
            }
          ],
          "name": "balance",
          "payable": false,
          "returns": {
            "option": [
              "int"
            ]
          },
          "stateful": false
        }
      ],
      "kind": "contract_main",
      "name": "FungibleTokenFull",
      "payable": false,
      "type_defs": []
    }
  },
  "externalEncodedAci": [
    {
      "contract": {
        "functions": [
          {
            "arguments": [
              {
                "name": "_1",
                "type": "int"
              },
              {
                "name": "_2",
                "type": "int"
              }
            ],
            "name": "set_paid",
            "payable": false,
            "returns": "unit",
            "stateful": true
          }
        ],
        "kind": "contract_interface",
        "name": "PoS",
        "payable": false,
        "type_defs": []
      }
    }
  ],
  "interface": "contract interface PoS =\n  stateful entrypoint set_paid : (int, int) => unit\n\nmain contract FungibleTokenFull =\n  stateful entrypoint burn_trigger_pos : (int, PoS, int) => unit\n  entrypoint balance : (address) => option(int)\n"
}
