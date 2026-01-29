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