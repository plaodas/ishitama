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
    ("crystal", "low", "low"): "白い静寂の奥で、光だけが眠っている。",
    ("crystal", "low", "mid"): "薄明かりを抱いた結晶。澄んだ記憶がある。",
    ("crystal", "low", "high"): "細い光が、高い音になってほどけていく。",
    ("crystal", "mid", "low"): "透明な層が、ゆっくりと光を呼吸している。",
    ("crystal", "mid", "mid"): "光の欠片が重なり、静かな環を描いている。",
    ("crystal", "mid", "high"): "結晶の縁が鳴る。朝の光に似た響きだ。",
    ("crystal", "high", "low"): "白い波動が満ちている。深部はまだ静かだ。",
    ("crystal", "high", "mid"): "光脈が目を覚まし、内側から輝いている。",
    ("crystal", "high", "high"): "結晶が強く歌う。光が石を通り抜けている。",
    ("shale", "low", "low"): "黒い層の底で、古い時間が沈黙している。",
    ("shale", "low", "mid"): "頁岩の薄い記憶。重なった影がほどけない。",
    ("shale", "low", "high"): "暗い断面から、乾いた高音がこぼれている。",
    ("shale", "mid", "low"): "積み重なる影が、低くゆっくり呼吸している。",
    ("shale", "mid", "mid"): "黒い層のあいだに、遠い圧力が残っている。",
    ("shale", "mid", "high"): "薄い層が触れ合い、鋭い声を返している。",
    ("shale", "high", "low"): "深い圧力が近い。黒い地層がざわめいている。",
    ("shale", "high", "mid"): "幾重もの影が動き、埋もれた記憶を押し上げる。",
    ("shale", "high", "high"): "黒い層が一斉に鳴る。裂け目に力が満ちている。",
    ("sand", "low", "low"): "砂の記憶は静か。風だけが通り過ぎていく。",
    ("sand", "low", "mid"): "乾いた粒のあいだに、陽だまりが残っている。",
    ("sand", "low", "high"): "細かな砂粒が、明るい音を散らしている。",
    ("sand", "mid", "low"): "遠い砂丘の重さが、ゆるやかに脈打っている。",
    ("sand", "mid", "mid"): "風に磨かれた面が、柔らかな熱を返している。",
    ("sand", "mid", "high"): "金色の粒が跳ね、軽い響きが空へ昇る。",
    ("sand", "high", "low"): "砂の底が動いている。眠った地形の息づかいだ。",
    ("sand", "high", "mid"): "乾いた波が重なり、古い風景を描いている。",
    ("sand", "high", "high"): "砂嵐の記憶が歌う。光と風がせめぎ合っている。",
    ("frost", "low", "low"): "冷たい光の底で、時間が凍りついている。",
    ("frost", "low", "mid"): "薄氷のような静けさが、表面を覆っている。",
    ("frost", "low", "high"): "霜の縁から、澄んだ高音が立ち上がる。",
    ("frost", "mid", "low"): "青白い冷気が、深くゆっくり呼吸している。",
    ("frost", "mid", "mid"): "凍った流れの記憶が、内側で揺れている。",
    ("frost", "mid", "high"): "氷の薄片が触れ合うような響きがある。",
    ("frost", "high", "low"): "凍土の波動が満ちる。深部に冬が残っている。",
    ("frost", "high", "mid"): "冷たい光が巡り、眠った水脈を起こしている。",
    ("frost", "high", "high"): "氷晶が強く歌う。静寂に亀裂が走っている。",
    ("moss-deep", "low", "low"): "深い苔の下で、森の時間が眠っている。",
    ("moss-deep", "low", "mid"): "濃い緑の層に、古い雨の記憶が残っている。",
    ("moss-deep", "low", "high"): "暗い葉脈を、細く澄んだ響きが走っている。",
    ("moss-deep", "mid", "low"): "森の底の重さが、ゆっくりと息をしている。",
    ("moss-deep", "mid", "mid"): "根と苔のあいだで、静かな循環が続いている。",
    ("moss-deep", "mid", "high"): "深緑の膜が揺れ、露の音を返している。",
    ("moss-deep", "high", "low"): "古い森が目を覚ます。地中の根がざわめいている。",
    ("moss-deep", "high", "mid"): "濃い生命の波が、幾重にも石を包んでいる。",
    ("moss-deep", "high", "high"): "深い苔が歌っている。森の境界が近い。",
    ("dusk", "low", "low"): "宵の底で、最後の光が静かに眠っている。",
    ("dusk", "low", "mid"): "夕闇の薄い層に、一日の記憶が残っている。",
    ("dusk", "low", "high"): "暮れゆく空から、細い鐘の音が落ちてくる。",
    ("dusk", "mid", "low"): "夜になる前の影が、ゆっくり呼吸している。",
    ("dusk", "mid", "mid"): "光と闇の境目が、石の内側で揺れている。",
    ("dusk", "mid", "high"): "宵風に磨かれた面が、淡い声を返している。",
    ("dusk", "high", "low"): "夕闇が満ちている。遠い地平が脈打っている。",
    ("dusk", "high", "mid"): "紫の波動が巡り、夜の入口を開いている。",
    ("dusk", "high", "high"): "宵の光が強く鳴る。昼と夜が交わる石だ。",
    ("void", "low", "low"): "何も響かない。ただ深い静けさだけがある。",
    ("void", "low", "mid"): "名のない空白が、音の形を待っている。",
    ("void", "low", "high"): "虚ろな奥から、一本の細い音だけが届く。",
    ("void", "mid", "low"): "空白がゆっくり脈打つ。まだ何者でもない。",
    ("void", "mid", "mid"): "光も影もない場所で、輪郭だけが浮かんでいる。",
    ("void", "mid", "high"): "沈黙の縁が震え、遠い境界を知らせている。",
    ("void", "high", "low"): "深い虚無が満ちる。石の奥に底が見えない。",
    ("void", "high", "mid"): "空白そのものが動き、周囲の音を吸い込んでいる。",
    ("void", "high", "high"): "虚が歌っている。存在と無の境界が開いている。",
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
