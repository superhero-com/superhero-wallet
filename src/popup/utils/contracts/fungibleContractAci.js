/* eslint-disable */
export default {
  "encodedAci": {
    "contract": {
      "event": {
        "variant": [
          {
            "Transfer": [
              "address",
              "address",
              "int"
            ]
          },
          {
            "Allowance": [
              "address",
              "address",
              "int"
            ]
          },
          {
            "Burn": [
              "address",
              "int"
            ]
          },
          {
            "Mint": [
              "address",
              "int"
            ]
          },
          {
            "Swap": [
              "address",
              "int"
            ]
          }
        ]
      },
      "functions": [
        {
          "arguments": [],
          "name": "aex9_extensions",
          "payable": false,
          "returns": {
            "list": [
              "string"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "name",
              "type": "string"
            },
            {
              "name": "decimals",
              "type": "int"
            },
            {
              "name": "symbol",
              "type": "string"
            },
            {
              "name": "initial_owner_balance",
              "type": {
                "option": [
                  "int"
                ]
              }
            }
          ],
          "name": "init",
          "payable": false,
          "returns": "FungibleTokenFull.state",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "meta_info",
          "payable": false,
          "returns": "FungibleTokenFull.meta_info",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "total_supply",
          "payable": false,
          "returns": "int",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "owner",
          "payable": false,
          "returns": "address",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "balances",
          "payable": false,
          "returns": "FungibleTokenFull.balances",
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "account",
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
        },
        {
          "arguments": [],
          "name": "swapped",
          "payable": false,
          "returns": {
            "map": [
              "address",
              "int"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [],
          "name": "allowances",
          "payable": false,
          "returns": "FungibleTokenFull.allowances",
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "allowance_accounts",
              "type": "FungibleTokenFull.allowance_accounts"
            }
          ],
          "name": "allowance",
          "payable": false,
          "returns": {
            "option": [
              "int"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "from_account",
              "type": "address"
            }
          ],
          "name": "allowance_for_caller",
          "payable": false,
          "returns": {
            "option": [
              "int"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "from_account",
              "type": "address"
            },
            {
              "name": "to_account",
              "type": "address"
            },
            {
              "name": "value",
              "type": "int"
            }
          ],
          "name": "transfer_allowance",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "for_account",
              "type": "address"
            },
            {
              "name": "value",
              "type": "int"
            }
          ],
          "name": "create_allowance",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "for_account",
              "type": "address"
            },
            {
              "name": "value_change",
              "type": "int"
            }
          ],
          "name": "change_allowance",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "for_account",
              "type": "address"
            }
          ],
          "name": "reset_allowance",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "to_account",
              "type": "address"
            },
            {
              "name": "value",
              "type": "int"
            }
          ],
          "name": "transfer",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "value",
              "type": "int"
            }
          ],
          "name": "burn",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "account",
              "type": "address"
            },
            {
              "name": "value",
              "type": "int"
            }
          ],
          "name": "mint",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [],
          "name": "swap",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "account",
              "type": "address"
            }
          ],
          "name": "check_swap",
          "payable": false,
          "returns": "int",
          "stateful": true
        }
      ],
      "kind": "contract_main",
      "name": "FungibleTokenFull",
      "payable": false,
      "state": {
        "record": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "total_supply",
            "type": "int"
          },
          {
            "name": "balances",
            "type": "FungibleTokenFull.balances"
          },
          {
            "name": "meta_info",
            "type": "FungibleTokenFull.meta_info"
          },
          {
            "name": "allowances",
            "type": "FungibleTokenFull.allowances"
          },
          {
            "name": "swapped",
            "type": {
              "map": [
                "address",
                "int"
              ]
            }
          }
        ]
      },
      "type_defs": [
        {
          "name": "meta_info",
          "typedef": {
            "record": [
              {
                "name": "name",
                "type": "string"
              },
              {
                "name": "symbol",
                "type": "string"
              },
              {
                "name": "decimals",
                "type": "int"
              }
            ]
          },
          "vars": []
        },
        {
          "name": "allowance_accounts",
          "typedef": {
            "record": [
              {
                "name": "from_account",
                "type": "address"
              },
              {
                "name": "for_account",
                "type": "address"
              }
            ]
          },
          "vars": []
        },
        {
          "name": "balances",
          "typedef": {
            "map": [
              "address",
              "int"
            ]
          },
          "vars": []
        },
        {
          "name": "allowances",
          "typedef": {
            "map": [
              "FungibleTokenFull.allowance_accounts",
              "int"
            ]
          },
          "vars": []
        }
      ]
    }
  },
  "externalEncodedAci": [
    {
      "namespace": {
        "name": "ListInternal",
        "type_defs": []
      }
    },
    {
      "namespace": {
        "name": "List",
        "type_defs": []
      }
    },
    {
      "namespace": {
        "name": "String",
        "type_defs": []
      }
    }
  ],
  "interface": "\n\n\nmain contract FungibleTokenFull =\n  record state = {owner : address,total_supply : int,balances : FungibleTokenFull.balances,meta_info : FungibleTokenFull.meta_info,allowances : FungibleTokenFull.allowances,swapped : map(address, int)}\n  datatype event = Transfer(address, address, int) | Allowance(address, address, int) | Burn(address, int) | Mint(address, int) | Swap(address, int)\n  record meta_info = {name : string,symbol : string,decimals : int}\n  record allowance_accounts = {from_account : address,for_account : address}\n  type balances = map(address, int)\n  type allowances = map(FungibleTokenFull.allowance_accounts, int)\n  entrypoint aex9_extensions : () => list(string)\n  entrypoint init : (string, int, string, option(int)) => FungibleTokenFull.state\n  entrypoint meta_info : () => FungibleTokenFull.meta_info\n  entrypoint total_supply : () => int\n  entrypoint owner : () => address\n  entrypoint balances : () => FungibleTokenFull.balances\n  entrypoint balance : (address) => option(int)\n  entrypoint swapped : () => map(address, int)\n  entrypoint allowances : () => FungibleTokenFull.allowances\n  entrypoint allowance : (FungibleTokenFull.allowance_accounts) => option(int)\n  entrypoint allowance_for_caller : (address) => option(int)\n  stateful entrypoint transfer_allowance : (address, address, int) => unit\n  stateful entrypoint create_allowance : (address, int) => unit\n  stateful entrypoint change_allowance : (address, int) => unit\n  stateful entrypoint reset_allowance : (address) => unit\n  stateful entrypoint transfer : (address, int) => unit\n  stateful entrypoint burn : (int) => unit\n  stateful entrypoint mint : (address, int) => unit\n  stateful entrypoint swap : () => unit\n  stateful entrypoint check_swap : (address) => int\n"
}
