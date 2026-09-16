from __future__ import annotations

from app.schemas.stone import Instrument

_MESSAGES: dict[tuple[Instrument, str, str], str] = {
    ("earth", "low", "low"): "地脈は静か。この石は長く眠っている。",
    ("earth", "low", "mid"): "土の記憶が薄い層になって積もっている。",
    ("earth", "low", "high"): "硬い芯が、高い響きを残している。",
    ("earth", "mid", "low"): "地面の重さが、ゆっくりと呼吸している。",
    ("earth", "mid", "mid"): "この石は道の端で、人の足音を聞いてきた。",
    ("earth", "mid", "high"): "乾いた鉱脈が、細い声で鳴っている。",
    ("earth", "high", "low"): "地鳴りが近い。深いところがまだ醒めない。",
    ("earth", "high", "mid"): "層がざわめく。長い沈黙のあとだ。",
    ("earth", "high", "high"): "岩の芯が震えている。古い熱が残っている。",
    ("moss", "low", "low"): "苔の下で、時間はほとんど動いていない。",
    ("moss", "low", "mid"): "湿り気を含んだ緑が、静かに守っている。",
    ("moss", "low", "high"): "薄い葉脈のような響きが、表面を走っている。",
    ("moss", "mid", "low"): "日陰の記憶。この石はあまり動かされていない。",
    ("moss", "mid", "mid"): "緑の膜の奥で、小さな循環が続いている。",
    ("moss", "mid", "high"): "朝露の音が、まだ石の肌に残っている。",
    ("moss", "high", "low"): "森の底が呼吸している。根が触れた跡がある。",
    ("moss", "high", "mid"): "湿った波動が濃い。生命の縁に近い石だ。",
    ("moss", "high", "high"): "苔が歌っている。この石は眠っていない。",
    ("water", "low", "low"): "水脈は遠い。表面だけが乾いている。",
    ("water", "low", "mid"): "川原の静けさ。何度も水に磨かれた。",
    ("water", "low", "high"): "滴の残響が、高いところで凍っている。",
    ("water", "mid", "low"): "深い流れを知っている。底の石だ。",
    ("water", "mid", "mid"): "水面のゆらぎが、今も輪郭に残っている。",
    ("water", "mid", "high"): "浅い瀬を転がってきた。軽い響きがある。",
    ("water", "high", "low"): "水脈がざわめく。表面の下で何かが循環している。",
    ("water", "high", "mid"): "潮の名残。この石は長いあいだ濡れていた。",
    ("water", "high", "high"): "飛沫の記憶が強い。岸で砕かれた石だ。",
    ("ember", "low", "low"): "火は遠い。炭の匂いだけが残っている。",
    ("ember", "low", "mid"): "かつての熱が、薄い層になって冷えている。",
    ("ember", "low", "high"): "熱の記憶が残る。かつて火の近くにあった。",
    ("ember", "mid", "low"): "炉の傍らの沈黙。重い赤が眠っている。",
    ("ember", "mid", "mid"): "夕暮れ色の鉱。まだ完全には冷めていない。",
    ("ember", "mid", "high"): "赤い筋が鳴る。短い炎を見ていた。",
    ("ember", "high", "low"): "地の底の残り火。波動が厚い。",
    ("ember", "high", "mid"): "灼けた面が呼吸している。触れれば温かい気がする。",
    ("ember", "high", "high"): "火脈が近い。この石はまだ歌を捨てていない。",
    ("night", "low", "low"): "夜の石。光をほとんど返さない。",
    ("night", "low", "mid"): "星の下で冷えた。輪郭だけが残っている。",
    ("night", "low", "high"): "暗い肌に、細い金属音が走っている。",
    ("night", "mid", "low"): "影を吸った鉱。深い場所から来た。",
    ("night", "mid", "mid"): "月の裏側のような静けさがある。",
    ("night", "mid", "high"): "夜風が削った面。高く、薄い。",
    ("night", "high", "low"): "闇が厚い。この石は見る者を見つめ返す。",
    ("night", "high", "mid"): "深夜の波動。儀式に向いている。",
    ("night", "high", "high"): "黒い輝きが鳴っている。境界の石だ。",
}


def _band_from_level(level: int) -> str:
    if level <= 3:
        return "low"
    if level >= 7:
        return "high"
    return "mid"


def _band_from_pitch(pitch: float) -> str:
    if pitch < 90:
        return "low"
    if pitch > 150:
        return "high"
    return "mid"


def compose_message(instrument: Instrument, level: int, pitch: float) -> str:
    key = (instrument, _band_from_level(level), _band_from_pitch(pitch))
    return _MESSAGES.get(key, "この石は、まだ名を持たない。")
