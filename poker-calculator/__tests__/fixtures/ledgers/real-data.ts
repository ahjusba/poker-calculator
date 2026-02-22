/*
FIRST SESSION:
  player: Lauri P., net_amount: -1247, device_id: RHb-0Unr50,
  player: Akseli, net_amount: -2000, device_id: HuFTNJLI6e,
  player: Jussi, net_amount: 1006, device_id: nDCo0CjA_m,
  player: Lasse, net_amount: 97, device_id: 2u4-SIis3W,
  player: Aleksi K., net_amount: 2144, device_id: pvjSRj-p3k,

SECOND SESSION:
  player: Lauri P., net_amount: -4000, device_id: RHb-0Unr50,
  player: Akseli, net_amount: 4000, device_id: KDBqjTtDCt,

THIRD SESSION:
  player: Jaakko, net_amount: 576, device_id: FQl3QSL8H6,
  player: Lauri P., net_amount: 3017, device_id: 7C7WggNp1M,
  player: Lasse, net_amount: 2639, device_id: yuW6MT27xi,
  player: Jussi, net_amount: -3000, device_id: nDCo0CjA_m,
  player: Mikko, net_amount: -3232, device_id: kzQ_mFJHzj,

RESULTING AGGREGATED DATA:
  Lauri P: net_amount = -1247 + -4000 + 3017 = -2230, sessions: 3, device_ids: [RHb-0Unr50, 7C7WggNp1M],
  Akseli: net_amount = -2000 + 4000 = 2000, sessions: 2, device_ids: [HuFTNJLI6e, KDBqjTtDCt],
  Jussi: net_amount = 1006 + -3000 = -1994, sessions: 2, device_ids: [nDCo0CjA_m],
  Lasse: net_amount = 97 + 2639 = 2736, sessions: 2, device_ids: [2u4-SIis3W, yuW6MT27xi],
  Jaakko: net_amount = 576, sessions: 1, device_ids: [FQl3QSL8H6],
  Mikko: net_amount = -3232, sessions: 1, device_ids: [kzQ_mFJHzj],
*/

export const sessions_data = [
  {
    "buyInTotal": 30222,
    "inGameTotal": 0,
    "buyOutTotal": 30222,
    "playersInfos": {
      "RHb-0Unr50": {
        "names": [
          "Lauri P."
        ],
        "id": "RHb-0Unr50",
        "buyInSum": 15000,
        "buyOutSum": 13753,
        "inGame": 0,
        "net": -1247
      },
      "HuFTNJLI6e": {
        "names": [
          "Haamu"
        ],
        "id": "HuFTNJLI6e",
        "buyInSum": 2000,
        "buyOutSum": 0,
        "inGame": 0,
        "net": -2000
      },
      "nDCo0CjA_m": {
        "names": [
          "Perkins"
        ],
        "id": "nDCo0CjA_m",
        "buyInSum": 5000,
        "buyOutSum": 6006,
        "inGame": 0,
        "net": 1006
      },
      "2u4-SIis3W": {
        "names": [
          "Lasse",
          "Lasse"
        ],
        "id": "2u4-SIis3W",
        "buyInSum": 6222,
        "buyOutSum": 6319,
        "inGame": 0,
        "net": 97
      },
      "pvjSRj-p3k": {
        "names": [
          "LIMP=KUOLEMA"
        ],
        "id": "pvjSRj-p3k",
        "buyInSum": 2000,
        "buyOutSum": 4144,
        "inGame": 0,
        "net": 2144
      }
    },
    "gameHasRake": false
  },
  {
    "buyInTotal": 6000,
    "inGameTotal": 4000,
    "buyOutTotal": 2000,
    "playersInfos": {
      "RHb-0Unr50": {
        "names": [
          "Lauri P.",
          "Lauri P."
        ],
        "id": "RHb-0Unr50",
        "buyInSum": 4000,
        "buyOutSum": 0,
        "inGame": 0,
        "net": -4000
      },
      "KDBqjTtDCt": {
        "names": [
          "Haamu"
        ],
        "id": "KDBqjTtDCt",
        "buyInSum": 2000,
        "buyOutSum": 2000,
        "inGame": 4000,
        "net": 4000
      }
    },
    "gameHasRake": false
  },
  {
    "buyInTotal": 31000,
    "inGameTotal": 0,
    "buyOutTotal": 31000,
    "playersInfos": {
      "FQl3QSL8H6": {
        "names": [
          "jaakko"
        ],
        "id": "FQl3QSL8H6",
        "buyInSum": 4000,
        "buyOutSum": 4576,
        "inGame": 0,
        "net": 576
      },
      "7C7WggNp1M": {
        "names": [
          "Lauri P."
        ],
        "id": "7C7WggNp1M",
        "buyInSum": 15000,
        "buyOutSum": 18017,
        "inGame": 0,
        "net": 3017
      },
      "yuW6MT27xi": {
        "names": [
          "Lasse"
        ],
        "id": "yuW6MT27xi",
        "buyInSum": 3000,
        "buyOutSum": 5639,
        "inGame": 0,
        "net": 2639
      },
      "nDCo0CjA_m": {
        "names": [
          "Perkins"
        ],
        "id": "nDCo0CjA_m",
        "buyInSum": 3000,
        "buyOutSum": 0,
        "inGame": 0,
        "net": -3000
      },
      "kzQ_mFJHzj": {
        "names": [
          "Mikko",
          "Mikko"
        ],
        "id": "kzQ_mFJHzj",
        "buyInSum": 6000,
        "buyOutSum": 2768,
        "inGame": 0,
        "net": -3232
      }
    },
    "gameHasRake": false
  }
]

/*
*/

export const payout_data = [
  {
    "buyInTotal": 14000,
    "inGameTotal": 1824,
    "buyOutTotal": 12176,
    "playersInfos": {
      "7C7WggNp1M": {
        "names": [
          "Lauri P."
        ],
        "id": "7C7WggNp1M",
        "buyInSum": 2000,
        "buyOutSum": 2033,
        "inGame": 0,
        "net": 33
      },
      "nDCo0CjA_m": {
        "names": [
          "Perkins"
        ],
        "id": "nDCo0CjA_m",
        "buyInSum": 2000,
        "buyOutSum": 0,
        "inGame": 0,
        "net": -2000
      },
      "0InsxVr9xo": {
        "names": [
          "Haamukone"
        ],
        "id": "0InsxVr9xo",
        "buyInSum": 2000,
        "buyOutSum": 0,
        "inGame": 0,
        "net": -2000
      },
      "zkGVJb7I5U": {
        "names": [
          "Patzer"
        ],
        "id": "zkGVJb7I5U",
        "buyInSum": 2000,
        "buyOutSum": 0,
        "inGame": 1824,
        "net": -176
      },
      "lqP155LHFZ": {
        "names": [
          "Kake"
        ],
        "id": "lqP155LHFZ",
        "buyInSum": 2000,
        "buyOutSum": 4011,
        "inGame": 0,
        "net": 2011
      },
      "FQl3QSL8H6": {
        "names": [
          "jaakko"
        ],
        "id": "FQl3QSL8H6",
        "buyInSum": 2000,
        "buyOutSum": 6132,
        "inGame": 0,
        "net": 4132
      },
      "HuFTNJLI6e": {
        "names": [
          "Haamu"
        ],
        "id": "HuFTNJLI6e",
        "buyInSum": 2000,
        "buyOutSum": 0,
        "inGame": 0,
        "net": -2000
      }
    },
    "gameHasRake": false
  }
]

export const bugged_data_1 = [
  {
    "buyInTotal": 105456,
    "inGameTotal": 30582,
    "buyOutTotal": 74874,
    "playersInfos": {
      "FQl3QSL8H6": {
        "names": [
          "jaakko",
          "jaakko",
          "jaakko",
          "jaakko"
        ],
        "id": "FQl3QSL8H6",
        "buyInSum": 44456,
        "buyOutSum": 24456,
        "inGame": 23145,
        "net": 3145
      },
      "ymD7xdl9mQ": {
        "names": [
          "Kola-Allu",
          "Kola-Allu",
          "Kola-Allu",
          "Kola-Allu",
          "Kola-Allu",
          "Kola-Allu"
        ],
        "id": "ymD7xdl9mQ",
        "buyInSum": 12000,
        "buyOutSum": 10688,
        "inGame": 0,
        "net": -1312
      },
      "jZIpJ2hNYE": {
        "names": [
          "Kake"
        ],
        "id": "jZIpJ2hNYE",
        "buyInSum": 2000,
        "buyOutSum": 2007,
        "inGame": 0,
        "net": 7
      },
      "nDCo0CjA_m": {
        "names": [
          "Perkins",
          "Perkins",
          "Perkins",
          "Perkins"
        ],
        "id": "nDCo0CjA_m",
        "buyInSum": 16000,
        "buyOutSum": 0,
        "inGame": 0,
        "net": -16000
      },
      "0w9M5q7tsf": {
        "names": [
          "Joel"
        ],
        "id": "0w9M5q7tsf",
        "buyInSum": 2000,
        "buyOutSum": 3451,
        "inGame": 0,
        "net": 1451
      },
      "iu909D4uFV": {
        "names": [
          "lasseuusiks",
          "Lasse"
        ],
        "id": "iu909D4uFV",
        "buyInSum": 15000,
        "buyOutSum": 0,
        "inGame": 7437,
        "net": -7563
      },
      "7C7WggNp1M": {
        "names": [
          "Lauri P."
        ],
        "id": "7C7WggNp1M",
        "buyInSum": 12000,
        "buyOutSum": 20073,
        "inGame": 0,
        "net": 8073
      },
      "kzQ_mFJHzj": {
        "names": [
          "Mikko"
        ],
        "id": "kzQ_mFJHzj",
        "buyInSum": 2000,
        "buyOutSum": 14199,
        "inGame": 0,
        "net": 12199
      }
    },
    "gameHasRake": false
  }
]