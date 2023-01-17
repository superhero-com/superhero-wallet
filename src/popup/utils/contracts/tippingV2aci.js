/* eslint-disable */
export default {
  "encodedAci": {
    "contract": {
      "event": {
        "variant": [
          {
            "TipReceived": [
              "address",
              "Tipping.amount",
              "Tipping.url"
            ]
          },
          {
            "ReTipReceived": [
              "address",
              "Tipping.amount",
              "Tipping.url"
            ]
          },
          {
            "TipWithdrawn": [
              "address",
              "Tipping.amount",
              "Tipping.url"
            ]
          },
          {
            "TipTokenReceived": [
              "address",
              "Tipping.amount",
              "Tipping.url",
              "TokenContract"
            ]
          },
          {
            "ReTipTokenReceived": [
              "address",
              "Tipping.amount",
              "Tipping.url",
              "TokenContract"
            ]
          },
          {
            "TipDirectReceived": [
              "address",
              "Tipping.amount",
              "Tipping.receiver_str"
            ]
          },
          {
            "TipDirectTokenReceived": [
              "address",
              "Tipping.amount",
              "Tipping.receiver_str",
              "TokenContract"
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
              "name": "url",
              "type": "Tipping.url"
            },
            {
              "name": "title",
              "type": "string"
            }
          ],
          "name": "tip",
          "payable": true,
          "returns": "int",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "Tipping.url"
            },
            {
              "name": "title",
              "type": "string"
            },
            {
              "name": "token",
              "type": "TokenContract"
            },
            {
              "name": "token_amount",
              "type": "int"
            }
          ],
          "name": "tip_token",
          "payable": false,
          "returns": "int",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "receiver",
              "type": "Tipping.receiver"
            },
            {
              "name": "title",
              "type": "string"
            }
          ],
          "name": "tip_direct",
          "payable": true,
          "returns": "int",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "receiver",
              "type": "Tipping.receiver"
            },
            {
              "name": "title",
              "type": "string"
            },
            {
              "name": "token",
              "type": "TokenContract"
            },
            {
              "name": "token_amount",
              "type": "int"
            }
          ],
          "name": "tip_token_direct",
          "payable": false,
          "returns": "int",
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
          "returns": "int",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "tip_id",
              "type": "Tipping.tip_id"
            },
            {
              "name": "token",
              "type": "TokenContract"
            },
            {
              "name": "token_amount",
              "type": "int"
            }
          ],
          "name": "retip_token",
          "payable": false,
          "returns": "int",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "Tipping.url"
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
              "type": "Tipping.url"
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
              "type": "Tipping.url"
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
              "type": "Tipping.url"
            }
          ],
          "name": "unclaimed_for_url",
          "payable": false,
          "returns": {
            "tuple": [
              "int",
              {
                "map": [
                  "TokenContract",
                  "int"
                ]
              }
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "Tipping.url"
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
        },
        {
          "arguments": [
            {
              "name": "tip_id",
              "type": "Tipping.tip_id"
            }
          ],
          "name": "get_tip_by_id",
          "payable": false,
          "returns": {
            "option": [
              "Tipping.tip"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "url_id",
              "type": "Tipping.url_id"
            }
          ],
          "name": "get_url_by_id",
          "payable": false,
          "returns": {
            "option": [
              "Tipping.url"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "retip_id",
              "type": "Tipping.retip_id"
            }
          ],
          "name": "get_retip_by_id",
          "payable": false,
          "returns": {
            "option": [
              "Tipping.retip"
            ]
          },
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "url",
              "type": "Tipping.url"
            }
          ],
          "name": "get_claim_by_url",
          "payable": false,
          "returns": {
            "option": [
              {
                "tuple": [
                  "Tipping.claim_gen",
                  "int",
                  {
                    "map": [
                      "TokenContract",
                      "int"
                    ]
                  }
                ]
              }
            ]
          },
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
                    "int",
                    {
                      "map": [
                        "TokenContract",
                        "int"
                      ]
                    }
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
            "name": "oracle_service",
            "type": "OracleService"
          },
          {
            "name": "version",
            "type": "string"
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
          "name": "amount",
          "typedef": "int",
          "vars": []
        },
        {
          "name": "receiver",
          "typedef": "address",
          "vars": []
        },
        {
          "name": "receiver_str",
          "typedef": "string",
          "vars": []
        },
        {
          "name": "tip",
          "typedef": {
            "variant": [
              {
                "AeTip": [
                  "Tipping.tip_meta",
                  "Tipping.url_id",
                  "Tipping.amount",
                  "Tipping.claim_gen"
                ]
              },
              {
                "TokenTip": [
                  "Tipping.tip_meta",
                  "Tipping.url_id",
                  "Tipping.tip_token_data",
                  "Tipping.claim_gen"
                ]
              },
              {
                "DirectAeTip": [
                  "Tipping.tip_meta",
                  "Tipping.receiver",
                  "Tipping.amount"
                ]
              },
              {
                "DirectTokenTip": [
                  "Tipping.tip_meta",
                  "Tipping.receiver",
                  "Tipping.tip_token_data"
                ]
              }
            ]
          },
          "vars": []
        },
        {
          "name": "tip_token_data",
          "typedef": {
            "record": [
              {
                "name": "token",
                "type": "TokenContract"
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
          "name": "tip_meta",
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
                "name": "timestamp",
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
                "name": "token_amount",
                "type": "int"
              },
              {
                "name": "claim_gen",
                "type": "Tipping.claim_gen"
              },
              {
                "name": "token",
                "type": {
                  "option": [
                    "TokenContract"
                  ]
                }
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
                "type": "address"
              },
              {
                "name": "_2",
                "type": "address"
              },
              {
                "name": "_3",
                "type": "int"
              }
            ],
            "name": "transfer_allowance",
            "payable": false,
            "returns": "unit",
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "address"
              },
              {
                "name": "_2",
                "type": "int"
              }
            ],
            "name": "transfer",
            "payable": false,
            "returns": "unit",
            "stateful": true
          }
        ],
        "kind": "contract_interface",
        "name": "TokenContract",
        "payable": false,
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
                  "name": "account",
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
  "interface": "\ncontract interface TokenContract =\n  stateful entrypoint transfer_allowance : (address, address, int) => unit\n  stateful entrypoint transfer : (address, int) => unit\n\ncontract interface OracleService =\n  record success_claim = {success : bool,account : address,percentage : int}\n  stateful entrypoint check_persist_claim : (string, address, bool) => OracleService.success_claim\n  payable stateful entrypoint query_oracle : (string, address) => unit\n\nmain contract Tipping =\n  record state = {urls : map(Tipping.url, Tipping.url_id),claims : map(Tipping.url_id, (Tipping.claim_gen * int * map(TokenContract, int))),url_index : map(Tipping.url_id, Tipping.url),tips : map(Tipping.tip_id, Tipping.tip),retips : map(Tipping.retip_id, Tipping.retip),oracle_service : OracleService,version : string}\n  datatype event = TipReceived(address, Tipping.amount, Tipping.url) | ReTipReceived(address, Tipping.amount, Tipping.url) | TipWithdrawn(address, Tipping.amount, Tipping.url) | TipTokenReceived(address, Tipping.amount, Tipping.url, TokenContract) | ReTipTokenReceived(address, Tipping.amount, Tipping.url, TokenContract) | TipDirectReceived(address, Tipping.amount, Tipping.receiver_str) | TipDirectTokenReceived(address, Tipping.amount, Tipping.receiver_str, TokenContract)\n  type tip_id = int\n  type url_id = int\n  type retip_id = int\n  type url = string\n  type claim_gen = int\n  type amount = int\n  type receiver = address\n  type receiver_str = string\n  datatype tip = AeTip(Tipping.tip_meta, Tipping.url_id, Tipping.amount, Tipping.claim_gen) | TokenTip(Tipping.tip_meta, Tipping.url_id, Tipping.tip_token_data, Tipping.claim_gen) | DirectAeTip(Tipping.tip_meta, Tipping.receiver, Tipping.amount) | DirectTokenTip(Tipping.tip_meta, Tipping.receiver, Tipping.tip_token_data)\n  record tip_token_data = {token : TokenContract,amount : int}\n  record tip_meta = {sender : address,title : string,timestamp : int}\n  record retip = {sender : address,amount : int,token_amount : int,claim_gen : Tipping.claim_gen,token : option(TokenContract),tip_id : Tipping.tip_id}\n  entrypoint init : (OracleService) => Tipping.state\n  payable stateful entrypoint tip : (Tipping.url, string) => int\n  stateful entrypoint tip_token : (Tipping.url, string, TokenContract, int) => int\n  payable stateful entrypoint tip_direct : (Tipping.receiver, string) => int\n  stateful entrypoint tip_token_direct : (Tipping.receiver, string, TokenContract, int) => int\n  payable stateful entrypoint retip : (Tipping.tip_id) => int\n  stateful entrypoint retip_token : (Tipping.tip_id, TokenContract, int) => int\n  payable stateful entrypoint pre_claim : (Tipping.url, address) => unit\n  stateful entrypoint claim : (Tipping.url, address, bool) => unit\n  entrypoint get_state : () => Tipping.state\n  entrypoint tips_for_url : (Tipping.url) => list(Tipping.tip)\n  entrypoint retips_for_tip : (Tipping.tip_id) => list(Tipping.retip)\n  entrypoint unclaimed_for_url : (Tipping.url) => (int * map(TokenContract, int))\n  entrypoint check_claim : (Tipping.url, address) => OracleService.success_claim\n  entrypoint get_tip_by_id : (Tipping.tip_id) => option(Tipping.tip)\n  entrypoint get_url_by_id : (Tipping.url_id) => option(Tipping.url)\n  entrypoint get_retip_by_id : (Tipping.retip_id) => option(Tipping.retip)\n  entrypoint get_claim_by_url : (Tipping.url) => option((Tipping.claim_gen * int * map(TokenContract, int)))\n"
}
