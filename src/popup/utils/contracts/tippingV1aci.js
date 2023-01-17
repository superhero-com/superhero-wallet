/* eslint-disable */
export default {
  "encodedAci": {
    "contract": {
      "event": {
        "variant": [
          {
            "TipReceived": [
              "address",
              "int",
              "Tipping.url"
            ]
          },
          {
            "ReTipReceived": [
              "address",
              "int",
              "Tipping.url"
            ]
          },
          {
            "TipWithdrawn": [
              "address",
              "int",
              "Tipping.url"
            ]
          }
        ]
      },
      "functions": [
        {
          "arguments": [
            {
              "name": "oracle_service",
              "type": "OracleService"
            },
            {
              "name": "owner",
              "type": "address"
            }
          ],
          "name": "init",
          "payable": false,
          "returns": "Tipping.state",
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "oracle_service",
              "type": "OracleService"
            }
          ],
          "name": "change_oracle_service",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "string"
            },
            {
              "name": "title",
              "type": "string"
            }
          ],
          "name": "tip",
          "payable": true,
          "returns": "unit",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "tip_id",
              "type": "Tipping.tip_id"
            }
          ],
          "name": "retip",
          "payable": true,
          "returns": "unit",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "string"
            },
            {
              "name": "expected_account",
              "type": "address"
            }
          ],
          "name": "pre_claim",
          "payable": true,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "string"
            },
            {
              "name": "account",
              "type": "address"
            },
            {
              "name": "recheck",
              "type": "bool"
            }
          ],
          "name": "claim",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "new_contract",
              "type": "address"
            }
          ],
          "name": "migrate_balance",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [],
          "name": "get_state",
          "payable": false,
          "returns": "Tipping.state",
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "string"
            }
          ],
          "name": "tips_for_url",
          "payable": false,
          "returns": {
            "list": [
              "Tipping.tip"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "tip_id",
              "type": "Tipping.tip_id"
            }
          ],
          "name": "retips_for_tip",
          "payable": false,
          "returns": {
            "list": [
              "Tipping.retip"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "string"
            }
          ],
          "name": "unclaimed_for_url",
          "payable": false,
          "returns": "int",
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "string"
            },
            {
              "name": "expected_account",
              "type": "address"
            }
          ],
          "name": "check_claim",
          "payable": false,
          "returns": "OracleService.success_claim",
          "stateful": false
        }
      ],
      "kind": "contract_main",
      "name": "Tipping",
      "payable": false,
      "state": {
        "record": [
          {
            "name": "urls",
            "type": {
              "map": [
                "Tipping.url",
                "Tipping.url_id"
              ]
            }
          },
          {
            "name": "claims",
            "type": {
              "map": [
                "Tipping.url_id",
                {
                  "tuple": [
                    "Tipping.claim_gen",
                    "int"
                  ]
                }
              ]
            }
          },
          {
            "name": "url_index",
            "type": {
              "map": [
                "Tipping.url_id",
                "Tipping.url"
              ]
            }
          },
          {
            "name": "tips",
            "type": {
              "map": [
                "Tipping.tip_id",
                "Tipping.tip"
              ]
            }
          },
          {
            "name": "retips",
            "type": {
              "map": [
                "Tipping.retip_id",
                "Tipping.retip"
              ]
            }
          },
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "oracle_service",
            "type": "OracleService"
          }
        ]
      },
      "type_defs": [
        {
          "name": "tip_id",
          "typedef": "int",
          "vars": []
        },
        {
          "name": "url_id",
          "typedef": "int",
          "vars": []
        },
        {
          "name": "retip_id",
          "typedef": "int",
          "vars": []
        },
        {
          "name": "url",
          "typedef": "string",
          "vars": []
        },
        {
          "name": "claim_gen",
          "typedef": "int",
          "vars": []
        },
        {
          "name": "tip",
          "typedef": {
            "record": [
              {
                "name": "sender",
                "type": "address"
              },
              {
                "name": "title",
                "type": "string"
              },
              {
                "name": "claim_gen",
                "type": "Tipping.claim_gen"
              },
              {
                "name": "timestamp",
                "type": "int"
              },
              {
                "name": "url_id",
                "type": "Tipping.url_id"
              },
              {
                "name": "amount",
                "type": "int"
              }
            ]
          },
          "vars": []
        },
        {
          "name": "retip",
          "typedef": {
            "record": [
              {
                "name": "sender",
                "type": "address"
              },
              {
                "name": "amount",
                "type": "int"
              },
              {
                "name": "claim_gen",
                "type": "Tipping.claim_gen"
              },
              {
                "name": "tip_id",
                "type": "Tipping.tip_id"
              }
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
      "contract": {
        "functions": [
          {
            "arguments": [
              {
                "name": "_1",
                "type": "string"
              },
              {
                "name": "_2",
                "type": "address"
              },
              {
                "name": "_3",
                "type": "bool"
              }
            ],
            "name": "check_persist_claim",
            "payable": false,
            "returns": "OracleService.success_claim",
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "string"
              },
              {
                "name": "_2",
                "type": "address"
              }
            ],
            "name": "query_oracle",
            "payable": true,
            "returns": "unit",
            "stateful": true
          }
        ],
        "kind": "contract_interface",
        "name": "OracleService",
        "payable": false,
        "type_defs": [
          {
            "name": "success_claim",
            "typedef": {
              "record": [
                {
                  "name": "success",
                  "type": "bool"
                },
                {
                  "name": "caller",
                  "type": "address"
                },
                {
                  "name": "percentage",
                  "type": "int"
                }
              ]
            },
            "vars": []
          }
        ]
      }
    }
  ],
  "interface": "\ncontract interface OracleService =\n  record success_claim = {success : bool,caller : address,percentage : int}\n  stateful entrypoint check_persist_claim : (string, address, bool) => OracleService.success_claim\n  payable stateful entrypoint query_oracle : (string, address) => unit\n\nmain contract Tipping =\n  record state = {urls : map(Tipping.url, Tipping.url_id),claims : map(Tipping.url_id, (Tipping.claim_gen * int)),url_index : map(Tipping.url_id, Tipping.url),tips : map(Tipping.tip_id, Tipping.tip),retips : map(Tipping.retip_id, Tipping.retip),owner : address,oracle_service : OracleService}\n  datatype event = TipReceived(address, int, Tipping.url) | ReTipReceived(address, int, Tipping.url) | TipWithdrawn(address, int, Tipping.url)\n  type tip_id = int\n  type url_id = int\n  type retip_id = int\n  type url = string\n  type claim_gen = int\n  record tip = {sender : address,title : string,claim_gen : Tipping.claim_gen,timestamp : int,url_id : Tipping.url_id,amount : int}\n  record retip = {sender : address,amount : int,claim_gen : Tipping.claim_gen,tip_id : Tipping.tip_id}\n  entrypoint init : (OracleService, address) => Tipping.state\n  stateful entrypoint change_oracle_service : (OracleService) => unit\n  payable stateful entrypoint tip : (string, string) => unit\n  payable stateful entrypoint retip : (Tipping.tip_id) => unit\n  payable stateful entrypoint pre_claim : (string, address) => unit\n  stateful entrypoint claim : (string, address, bool) => unit\n  stateful entrypoint migrate_balance : (address) => unit\n  entrypoint get_state : () => Tipping.state\n  entrypoint tips_for_url : (string) => list(Tipping.tip)\n  entrypoint retips_for_tip : (Tipping.tip_id) => list(Tipping.retip)\n  entrypoint unclaimed_for_url : (string) => int\n  entrypoint check_claim : (string, address) => OracleService.success_claim\n"
}
