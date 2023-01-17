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
            "Approval": [
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
            "Mint": [
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
            "LockLiquidity": [
              "int"
            ]
          },
          {
            "PairMint": [
              "address",
              "int",
              "int"
            ]
          },
          {
            "PairBurn": [
              "address",
              "address",
              "string"
            ]
          },
          {
            "SwapTokens": [
              "address",
              "address",
              "string"
            ]
          },
          {
            "Sync": [
              "int",
              "int"
            ]
          }
        ]
      },
      "functions": [
        {
          "arguments": [
            {
              "name": "factory",
              "type": "IAedexV2FactoryForPair"
            },
            {
              "name": "token0",
              "type": "IAEX9Minimal"
            },
            {
              "name": "token1",
              "type": "IAEX9Minimal"
            },
            {
              "name": "min_liquidity",
              "type": {
                "option": [
                  "int"
                ]
              }
            },
            {
              "name": "debug_time",
              "type": {
                "option": [
                  "int"
                ]
              }
            }
          ],
          "name": "init",
          "payable": false,
          "returns": "AedexV2Pair.state",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "meta_info",
          "payable": false,
          "returns": "IAEX9Minimal.meta_info",
          "stateful": false
        },
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
          "arguments": [],
          "name": "total_supply",
          "payable": false,
          "returns": "int",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "balances",
          "payable": false,
          "returns": "AedexV2Pair.balances",
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "address",
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
          "name": "allowances",
          "payable": false,
          "returns": "AedexV2Pair.allowances",
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "allowance_accounts",
              "type": "AedexV2Pair.allowance_accounts"
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
          "arguments": [],
          "name": "owner",
          "payable": false,
          "returns": "address",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "price0_cumulative_last",
          "payable": false,
          "returns": "int",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "price1_cumulative_last",
          "payable": false,
          "returns": "int",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "get_reserves",
          "payable": false,
          "returns": "IAedexV2Pair.reserves",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "minimum_liquidity",
          "payable": false,
          "returns": "int",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "factory",
          "payable": false,
          "returns": "IAedexV2FactoryForPair",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "token0",
          "payable": false,
          "returns": "IAEX9Minimal",
          "stateful": false
        },
        {
          "arguments": [],
          "name": "token1",
          "payable": false,
          "returns": "IAEX9Minimal",
          "stateful": false
        },
        {
          "arguments": [
            {
              "name": "time",
              "type": "int"
            }
          ],
          "name": "set_debug_time",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "to",
              "type": "address"
            }
          ],
          "name": "mint",
          "payable": false,
          "returns": "int",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "to",
              "type": "address"
            }
          ],
          "name": "burn",
          "payable": false,
          "returns": "IAedexV2Pair.amounts",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "amount0_out",
              "type": "int"
            },
            {
              "name": "amount1_out",
              "type": "int"
            },
            {
              "name": "to",
              "type": "address"
            },
            {
              "name": "callback_opt",
              "type": {
                "option": [
                  "IAedexV2Callback"
                ]
              }
            }
          ],
          "name": "swap",
          "payable": false,
          "returns": "unit",
          "stateful": true
        },
        {
          "arguments": [
            {
              "name": "to",
              "type": "address"
            }
          ],
          "name": "skim",
          "payable": false,
          "returns": {
            "tuple": []
          },
          "stateful": true
        },
        {
          "arguments": [],
          "name": "sync",
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
              "name": "recipient",
              "type": "address"
            },
            {
              "name": "amount",
              "type": "int"
            }
          ],
          "name": "transfer",
          "payable": false,
          "returns": "unit",
          "stateful": true
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
        }
      ],
      "kind": "contract_main",
      "name": "AedexV2Pair",
      "payable": false,
      "state": {
        "record": [
          {
            "name": "total_supply",
            "type": "int"
          },
          {
            "name": "balance_of",
            "type": "AedexV2Pair.balances"
          },
          {
            "name": "locked_liquidity",
            "type": "int"
          },
          {
            "name": "allowances",
            "type": "AedexV2Pair.allowances"
          },
          {
            "name": "factory",
            "type": "IAedexV2FactoryForPair"
          },
          {
            "name": "token0",
            "type": "IAEX9Minimal"
          },
          {
            "name": "token1",
            "type": "IAEX9Minimal"
          },
          {
            "name": "reserve0",
            "type": "int"
          },
          {
            "name": "reserve1",
            "type": "int"
          },
          {
            "name": "block_timestamp_last",
            "type": "int"
          },
          {
            "name": "price0_cumulative_last",
            "type": "int"
          },
          {
            "name": "price1_cumulative_last",
            "type": "int"
          },
          {
            "name": "min_liquidity",
            "type": "int"
          },
          {
            "name": "k_last",
            "type": "int"
          },
          {
            "name": "debug_time",
            "type": {
              "option": [
                "int"
              ]
            }
          }
        ]
      },
      "type_defs": [
        {
          "name": "owner",
          "typedef": "address",
          "vars": []
        },
        {
          "name": "spender",
          "typedef": "address",
          "vars": []
        },
        {
          "name": "allowance_accounts",
          "typedef": "IAEX9Minimal.allowance_accounts",
          "vars": []
        },
        {
          "name": "allowances",
          "typedef": {
            "map": [
              "AedexV2Pair.allowance_accounts",
              "int"
            ]
          },
          "vars": []
        },
        {
          "name": "balances",
          "typedef": {
            "map": [
              "AedexV2Pair.owner",
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
      "contract": {
        "functions": [
          {
            "arguments": [],
            "name": "meta_info",
            "payable": false,
            "returns": "IAEX9Minimal.meta_info",
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
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "IAEX9Minimal.allowance_accounts"
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
            "name": "create_allowance",
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
          }
        ],
        "kind": "contract_interface",
        "name": "IAEX9Minimal",
        "payable": false,
        "type_defs": [
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
          }
        ]
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
              }
            ],
            "name": "deposit_to",
            "payable": true,
            "returns": "unit",
            "stateful": true
          },
          {
            "arguments": [],
            "name": "deposit",
            "payable": true,
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
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "int"
              }
            ],
            "name": "withdraw",
            "payable": false,
            "returns": "unit",
            "stateful": true
          }
        ],
        "kind": "contract_interface",
        "name": "IWAE",
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
                "type": "address"
              },
              {
                "name": "_2",
                "type": "int"
              },
              {
                "name": "_3",
                "type": "int"
              }
            ],
            "name": "aedex_v2_call",
            "payable": false,
            "returns": "unit",
            "stateful": false
          }
        ],
        "kind": "contract_interface",
        "name": "IAedexV2Callback",
        "payable": false,
        "type_defs": []
      }
    },
    {
      "contract": {
        "functions": [
          {
            "arguments": [],
            "name": "fee_to",
            "payable": false,
            "returns": {
              "option": [
                "address"
              ]
            },
            "stateful": false
          }
        ],
        "kind": "contract_interface",
        "name": "IAedexV2FactoryForPair",
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
            "arguments": [
              {
                "name": "_1",
                "type": "IAedexV2FactoryForPair"
              },
              {
                "name": "_2",
                "type": "IAEX9Minimal"
              },
              {
                "name": "_3",
                "type": "IAEX9Minimal"
              },
              {
                "name": "_4",
                "type": {
                  "option": [
                    "int"
                  ]
                }
              },
              {
                "name": "_5",
                "type": {
                  "option": [
                    "int"
                  ]
                }
              }
            ],
            "name": "init",
            "payable": false,
            "returns": "void",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "minimum_liquidity",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "factory",
            "payable": false,
            "returns": "IAedexV2FactoryForPair",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "token0",
            "payable": false,
            "returns": "IAEX9Minimal",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "token1",
            "payable": false,
            "returns": "IAEX9Minimal",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "price0_cumulative_last",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "price1_cumulative_last",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "k_last",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "address"
              }
            ],
            "name": "mint",
            "payable": false,
            "returns": "int",
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "address"
              }
            ],
            "name": "burn",
            "payable": false,
            "returns": "IAedexV2Pair.amounts",
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "int"
              },
              {
                "name": "_2",
                "type": "int"
              },
              {
                "name": "_3",
                "type": "address"
              },
              {
                "name": "_4",
                "type": {
                  "option": [
                    "IAedexV2Callback"
                  ]
                }
              }
            ],
            "name": "swap",
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
            "name": "skim",
            "payable": false,
            "returns": "unit",
            "stateful": true
          },
          {
            "arguments": [],
            "name": "sync",
            "payable": false,
            "returns": "unit",
            "stateful": true
          },
          {
            "arguments": [],
            "name": "get_reserves",
            "payable": false,
            "returns": "IAedexV2Pair.reserves",
            "stateful": false
          },
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
          }
        ],
        "kind": "contract_interface",
        "name": "IAedexV2Pair",
        "payable": false,
        "type_defs": [
          {
            "name": "amounts",
            "typedef": {
              "record": [
                {
                  "name": "amount0",
                  "type": "int"
                },
                {
                  "name": "amount1",
                  "type": "int"
                }
              ]
            },
            "vars": []
          },
          {
            "name": "reserves",
            "typedef": {
              "record": [
                {
                  "name": "reserve0",
                  "type": "int"
                },
                {
                  "name": "reserve1",
                  "type": "int"
                },
                {
                  "name": "block_timestamp_last",
                  "type": "int"
                }
              ]
            },
            "vars": []
          }
        ]
      }
    },
    {
      "namespace": {
        "name": "Math",
        "type_defs": []
      }
    },
    {
      "namespace": {
        "name": "UQ112x112",
        "type_defs": []
      }
    },
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
    },
    {
      "namespace": {
        "name": "Utils",
        "type_defs": []
      }
    },
    {
      "contract": {
        "functions": [
          {
            "arguments": [],
            "name": "fee_to",
            "payable": false,
            "returns": {
              "option": [
                "address"
              ]
            },
            "stateful": false
          },
          {
            "arguments": [],
            "name": "fee_to_setter",
            "payable": false,
            "returns": "address",
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "IAEX9Minimal"
              },
              {
                "name": "_2",
                "type": "IAEX9Minimal"
              }
            ],
            "name": "get_pair",
            "payable": false,
            "returns": {
              "option": [
                "IAedexV2Pair"
              ]
            },
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "int"
              }
            ],
            "name": "get_nth_pair",
            "payable": false,
            "returns": "IAedexV2Pair",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "all_pairs_length",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "get_all_pairs",
            "payable": false,
            "returns": {
              "list": [
                "IAedexV2Pair"
              ]
            },
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "IAEX9Minimal"
              },
              {
                "name": "_2",
                "type": "IAEX9Minimal"
              },
              {
                "name": "_3",
                "type": {
                  "option": [
                    "int"
                  ]
                }
              },
              {
                "name": "_4",
                "type": {
                  "option": [
                    "int"
                  ]
                }
              }
            ],
            "name": "create_pair",
            "payable": false,
            "returns": "IAedexV2Pair",
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": {
                  "option": [
                    "address"
                  ]
                }
              }
            ],
            "name": "set_fee_to",
            "payable": false,
            "returns": "unit",
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "_1",
                "type": "address"
              }
            ],
            "name": "set_fee_toSetter",
            "payable": false,
            "returns": "unit",
            "stateful": false
          }
        ],
        "kind": "contract_interface",
        "name": "IAedexV2Factory",
        "payable": false,
        "type_defs": []
      }
    },
    {
      "namespace": {
        "name": "AedexV2Library",
        "type_defs": []
      }
    },
    {
      "namespace": {
        "name": "Option",
        "type_defs": []
      }
    },
    {
      "contract": {
        "functions": [
          {
            "arguments": [
              {
                "name": "factory",
                "type": "IAedexV2Factory"
              },
              {
                "name": "wae",
                "type": "IWAE"
              },
              {
                "name": "wae_aex9",
                "type": "IAEX9Minimal"
              }
            ],
            "name": "init",
            "payable": false,
            "returns": "AedexV2Router.state",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "balance",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "factory",
            "payable": false,
            "returns": "IAedexV2Factory",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "wae",
            "payable": false,
            "returns": "IWAE",
            "stateful": false
          },
          {
            "arguments": [],
            "name": "wae_aex9",
            "payable": false,
            "returns": "IAEX9Minimal",
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "token_a",
                "type": "IAEX9Minimal"
              },
              {
                "name": "token_b",
                "type": "IAEX9Minimal"
              },
              {
                "name": "amount_a_desired",
                "type": "int"
              },
              {
                "name": "amount_b_desired",
                "type": "int"
              },
              {
                "name": "amount_a_min",
                "type": "int"
              },
              {
                "name": "amount_b_min",
                "type": "int"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "min_liquidity",
                "type": {
                  "option": [
                    "int"
                  ]
                }
              },
              {
                "name": "deadline",
                "type": "int"
              }
            ],
            "name": "add_liquidity",
            "payable": false,
            "returns": {
              "tuple": [
                "AedexV2Router.amount_a",
                "AedexV2Router.amount_b",
                "AedexV2Router.liquidity"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "token",
                "type": "IAEX9Minimal"
              },
              {
                "name": "amount_token_desired",
                "type": "int"
              },
              {
                "name": "amount_token_min",
                "type": "int"
              },
              {
                "name": "amount_ae_min",
                "type": "int"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "min_liquidity",
                "type": {
                  "option": [
                    "int"
                  ]
                }
              },
              {
                "name": "deadline",
                "type": "int"
              }
            ],
            "name": "add_liquidity_ae",
            "payable": true,
            "returns": {
              "tuple": [
                "AedexV2Router.amount_token",
                "AedexV2Router.amount_ae",
                "AedexV2Router.liquidity"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "token_a",
                "type": "IAEX9Minimal"
              },
              {
                "name": "token_b",
                "type": "IAEX9Minimal"
              },
              {
                "name": "liquidity",
                "type": "int"
              },
              {
                "name": "amount_a_min",
                "type": "int"
              },
              {
                "name": "amount_b_min",
                "type": "int"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "deadline",
                "type": "int"
              }
            ],
            "name": "remove_liquidity",
            "payable": false,
            "returns": {
              "tuple": [
                "AedexV2Router.amount_a",
                "AedexV2Router.amount_b"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "token",
                "type": "IAEX9Minimal"
              },
              {
                "name": "liquidity",
                "type": "int"
              },
              {
                "name": "amount_token_min",
                "type": "int"
              },
              {
                "name": "amount_ae_min",
                "type": "int"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "deadline",
                "type": "int"
              }
            ],
            "name": "remove_liquidity_ae",
            "payable": true,
            "returns": {
              "tuple": [
                "AedexV2Router.amount_token",
                "AedexV2Router.amount_ae"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "amount_in",
                "type": "int"
              },
              {
                "name": "amount_out_min",
                "type": "int"
              },
              {
                "name": "path",
                "type": {
                  "list": [
                    "IAEX9Minimal"
                  ]
                }
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "deadline",
                "type": "int"
              },
              {
                "name": "callback_opt",
                "type": {
                  "option": [
                    "IAedexV2Callback"
                  ]
                }
              }
            ],
            "name": "swap_exact_tokens_for_tokens",
            "payable": false,
            "returns": {
              "list": [
                "int"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "amount_out",
                "type": "int"
              },
              {
                "name": "amount_in_max",
                "type": "int"
              },
              {
                "name": "path",
                "type": {
                  "list": [
                    "IAEX9Minimal"
                  ]
                }
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "deadline",
                "type": "int"
              },
              {
                "name": "callback_opt",
                "type": {
                  "option": [
                    "IAedexV2Callback"
                  ]
                }
              }
            ],
            "name": "swap_tokens_for_exact_tokens",
            "payable": false,
            "returns": {
              "list": [
                "int"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "amount_out_min",
                "type": "int"
              },
              {
                "name": "path",
                "type": {
                  "list": [
                    "IAEX9Minimal"
                  ]
                }
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "deadline",
                "type": "int"
              },
              {
                "name": "callback_opt",
                "type": {
                  "option": [
                    "IAedexV2Callback"
                  ]
                }
              }
            ],
            "name": "swap_exact_ae_for_tokens",
            "payable": true,
            "returns": {
              "list": [
                "int"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "amount_out",
                "type": "int"
              },
              {
                "name": "amount_in_max",
                "type": "int"
              },
              {
                "name": "path",
                "type": {
                  "list": [
                    "IAEX9Minimal"
                  ]
                }
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "deadline",
                "type": "int"
              },
              {
                "name": "callback_opt",
                "type": {
                  "option": [
                    "IAedexV2Callback"
                  ]
                }
              }
            ],
            "name": "swap_tokens_for_exact_ae",
            "payable": false,
            "returns": {
              "list": [
                "int"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "amount_in",
                "type": "int"
              },
              {
                "name": "amount_out_min",
                "type": "int"
              },
              {
                "name": "path",
                "type": {
                  "list": [
                    "IAEX9Minimal"
                  ]
                }
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "deadline",
                "type": "int"
              },
              {
                "name": "callback_opt",
                "type": {
                  "option": [
                    "IAedexV2Callback"
                  ]
                }
              }
            ],
            "name": "swap_exact_tokens_for_ae",
            "payable": false,
            "returns": {
              "list": [
                "int"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "amount_out",
                "type": "int"
              },
              {
                "name": "path",
                "type": {
                  "list": [
                    "IAEX9Minimal"
                  ]
                }
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "deadline",
                "type": "int"
              },
              {
                "name": "callback_opt",
                "type": {
                  "option": [
                    "IAedexV2Callback"
                  ]
                }
              }
            ],
            "name": "swap_ae_for_exact_tokens",
            "payable": true,
            "returns": {
              "list": [
                "int"
              ]
            },
            "stateful": true
          },
          {
            "arguments": [
              {
                "name": "amount_a",
                "type": "int"
              },
              {
                "name": "reserve_a",
                "type": "int"
              },
              {
                "name": "reserve_b",
                "type": "int"
              }
            ],
            "name": "quote",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "amount_in",
                "type": "int"
              },
              {
                "name": "reserve_in",
                "type": "int"
              },
              {
                "name": "reserve_out",
                "type": "int"
              }
            ],
            "name": "get_amount_out",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "amount_out",
                "type": "int"
              },
              {
                "name": "reserve_in",
                "type": "int"
              },
              {
                "name": "reserve_out",
                "type": "int"
              }
            ],
            "name": "get_amount_in",
            "payable": false,
            "returns": "int",
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "amount_in",
                "type": "int"
              },
              {
                "name": "path",
                "type": {
                  "list": [
                    "IAEX9Minimal"
                  ]
                }
              }
            ],
            "name": "get_amounts_out",
            "payable": false,
            "returns": {
              "list": [
                "int"
              ]
            },
            "stateful": false
          },
          {
            "arguments": [
              {
                "name": "amount_out",
                "type": "int"
              },
              {
                "name": "path",
                "type": {
                  "list": [
                    "IAEX9Minimal"
                  ]
                }
              }
            ],
            "name": "get_amounts_in",
            "payable": false,
            "returns": {
              "list": [
                "int"
              ]
            },
            "stateful": false
          }
        ],
        "kind": "contract_child",
        "name": "AedexV2Router",
        "payable": true,
        "state": {
          "record": [
            {
              "name": "factory",
              "type": "IAedexV2Factory"
            },
            {
              "name": "wae",
              "type": "IWAE"
            },
            {
              "name": "wae_aex9",
              "type": "IAEX9Minimal"
            }
          ]
        },
        "type_defs": [
          {
            "name": "amount_a",
            "typedef": "int",
            "vars": []
          },
          {
            "name": "amount_b",
            "typedef": "int",
            "vars": []
          },
          {
            "name": "amount_token",
            "typedef": "int",
            "vars": []
          },
          {
            "name": "amount_ae",
            "typedef": "int",
            "vars": []
          },
          {
            "name": "liquidity",
            "typedef": "int",
            "vars": []
          }
        ]
      }
    }
  ],
  "interface": "contract interface IAEX9Minimal =\n  record allowance_accounts = {from_account : address,for_account : address}\n  record meta_info = {name : string,symbol : string,decimals : int}\n  entrypoint meta_info : () => IAEX9Minimal.meta_info\n  entrypoint total_supply : () => int\n  entrypoint balance : (address) => option(int)\n  entrypoint allowance : (IAEX9Minimal.allowance_accounts) => option(int)\n  stateful entrypoint transfer : (address, int) => unit\n  stateful entrypoint create_allowance : (address, int) => unit\n  stateful entrypoint transfer_allowance : (address, address, int) => unit\n\ncontract interface IWAE =\n  payable stateful entrypoint deposit_to : (address) => unit\n  payable stateful entrypoint deposit : () => unit\n  stateful entrypoint transfer : (address, int) => unit\n  stateful entrypoint withdraw : (int) => unit\n\ncontract interface IAedexV2Callback =\n  entrypoint aedex_v2_call : (address, int, int) => unit\n\ncontract interface IAedexV2FactoryForPair =\n  entrypoint fee_to : () => option(address)\n\ncontract interface IAedexV2Pair =\n  record amounts = {amount0 : int,amount1 : int}\n  record reserves = {reserve0 : int,reserve1 : int,block_timestamp_last : int}\n  entrypoint balance : (address) => option(int)\n  entrypoint init : (IAedexV2FactoryForPair, IAEX9Minimal, IAEX9Minimal, option(int), option(int)) => void\n  entrypoint minimum_liquidity : () => int\n  entrypoint factory : () => IAedexV2FactoryForPair\n  entrypoint token0 : () => IAEX9Minimal\n  entrypoint token1 : () => IAEX9Minimal\n  entrypoint price0_cumulative_last : () => int\n  entrypoint price1_cumulative_last : () => int\n  entrypoint k_last : () => int\n  stateful entrypoint mint : (address) => int\n  stateful entrypoint burn : (address) => IAedexV2Pair.amounts\n  stateful entrypoint swap : (int, int, address, option(IAedexV2Callback)) => unit\n  stateful entrypoint skim : (address) => unit\n  stateful entrypoint sync : () => unit\n  entrypoint get_reserves : () => IAedexV2Pair.reserves\n  stateful entrypoint transfer_allowance : (address, address, int) => unit\n\n\n\n\n\n\n\ncontract interface IAedexV2Factory =\n  entrypoint fee_to : () => option(address)\n  entrypoint fee_to_setter : () => address\n  entrypoint get_pair : (IAEX9Minimal, IAEX9Minimal) => option(IAedexV2Pair)\n  entrypoint get_nth_pair : (int) => IAedexV2Pair\n  entrypoint all_pairs_length : () => int\n  entrypoint get_all_pairs : () => list(IAedexV2Pair)\n  stateful entrypoint create_pair : (IAEX9Minimal, IAEX9Minimal, option(int), option(int)) => IAedexV2Pair\n  entrypoint set_fee_to : (option(address)) => unit\n  entrypoint set_fee_toSetter : (address) => unit\n\n\n\npayable contract AedexV2Router =\n  record state = {factory : IAedexV2Factory,wae : IWAE,wae_aex9 : IAEX9Minimal}\n  type amount_a = int\n  type amount_b = int\n  type amount_token = int\n  type amount_ae = int\n  type liquidity = int\n  entrypoint init : (IAedexV2Factory, IWAE, IAEX9Minimal) => AedexV2Router.state\n  entrypoint balance : () => int\n  entrypoint factory : () => IAedexV2Factory\n  entrypoint wae : () => IWAE\n  entrypoint wae_aex9 : () => IAEX9Minimal\n  stateful entrypoint add_liquidity : (IAEX9Minimal, IAEX9Minimal, int, int, int, int, address, option(int), int) => (AedexV2Router.amount_a * AedexV2Router.amount_b * AedexV2Router.liquidity)\n  payable stateful entrypoint add_liquidity_ae : (IAEX9Minimal, int, int, int, address, option(int), int) => (AedexV2Router.amount_token * AedexV2Router.amount_ae * AedexV2Router.liquidity)\n  stateful entrypoint remove_liquidity : (IAEX9Minimal, IAEX9Minimal, int, int, int, address, int) => (AedexV2Router.amount_a * AedexV2Router.amount_b)\n  payable stateful entrypoint remove_liquidity_ae : (IAEX9Minimal, int, int, int, address, int) => (AedexV2Router.amount_token * AedexV2Router.amount_ae)\n  stateful entrypoint swap_exact_tokens_for_tokens : (int, int, list(IAEX9Minimal), address, int, option(IAedexV2Callback)) => list(int)\n  stateful entrypoint swap_tokens_for_exact_tokens : (int, int, list(IAEX9Minimal), address, int, option(IAedexV2Callback)) => list(int)\n  payable stateful entrypoint swap_exact_ae_for_tokens : (int, list(IAEX9Minimal), address, int, option(IAedexV2Callback)) => list(int)\n  stateful entrypoint swap_tokens_for_exact_ae : (int, int, list(IAEX9Minimal), address, int, option(IAedexV2Callback)) => list(int)\n  stateful entrypoint swap_exact_tokens_for_ae : (int, int, list(IAEX9Minimal), address, int, option(IAedexV2Callback)) => list(int)\n  payable stateful entrypoint swap_ae_for_exact_tokens : (int, list(IAEX9Minimal), address, int, option(IAedexV2Callback)) => list(int)\n  entrypoint quote : (int, int, int) => int\n  entrypoint get_amount_out : (int, int, int) => int\n  entrypoint get_amount_in : (int, int, int) => int\n  entrypoint get_amounts_out : (int, list(IAEX9Minimal)) => list(int)\n  entrypoint get_amounts_in : (int, list(IAEX9Minimal)) => list(int)\n\nmain contract AedexV2Pair =\n  record state = {total_supply : int,balance_of : AedexV2Pair.balances,locked_liquidity : int,allowances : AedexV2Pair.allowances,factory : IAedexV2FactoryForPair,token0 : IAEX9Minimal,token1 : IAEX9Minimal,reserve0 : int,reserve1 : int,block_timestamp_last : int,price0_cumulative_last : int,price1_cumulative_last : int,min_liquidity : int,k_last : int,debug_time : option(int)}\n  datatype event = Transfer(address, address, int) | Approval(address, address, int) | Allowance(address, address, int) | Mint(address, int) | Burn(address, int) | LockLiquidity(int) | PairMint(address, int, int) | PairBurn(address, address, string) | SwapTokens(address, address, string) | Sync(int, int)\n  type owner = address\n  type spender = address\n  type allowance_accounts = IAEX9Minimal.allowance_accounts\n  type allowances = map(AedexV2Pair.allowance_accounts, int)\n  type balances = map(AedexV2Pair.owner, int)\n  entrypoint init : (IAedexV2FactoryForPair, IAEX9Minimal, IAEX9Minimal, option(int), option(int)) => AedexV2Pair.state\n  entrypoint meta_info : () => IAEX9Minimal.meta_info\n  entrypoint aex9_extensions : () => list(string)\n  entrypoint total_supply : () => int\n  entrypoint balances : () => AedexV2Pair.balances\n  entrypoint balance : (address) => option(int)\n  entrypoint allowances : () => AedexV2Pair.allowances\n  entrypoint allowance : (AedexV2Pair.allowance_accounts) => option(int)\n  entrypoint allowance_for_caller : (address) => option(int)\n  entrypoint owner : () => address\n  entrypoint price0_cumulative_last : () => int\n  entrypoint price1_cumulative_last : () => int\n  entrypoint get_reserves : () => IAedexV2Pair.reserves\n  entrypoint minimum_liquidity : () => int\n  entrypoint factory : () => IAedexV2FactoryForPair\n  entrypoint token0 : () => IAEX9Minimal\n  entrypoint token1 : () => IAEX9Minimal\n  stateful entrypoint set_debug_time : (int) => unit\n  stateful entrypoint mint : (address) => int\n  stateful entrypoint burn : (address) => IAedexV2Pair.amounts\n  stateful entrypoint swap : (int, int, address, option(IAedexV2Callback)) => unit\n  stateful entrypoint skim : (address) => unit\n  stateful entrypoint sync : () => unit\n  stateful entrypoint create_allowance : (address, int) => unit\n  stateful entrypoint transfer : (address, int) => unit\n  stateful entrypoint transfer_allowance : (address, address, int) => unit\n  stateful entrypoint change_allowance : (address, int) => unit\n  stateful entrypoint reset_allowance : (address) => unit\n"
}
