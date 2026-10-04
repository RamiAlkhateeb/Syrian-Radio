namespace NinarFmPlayer.Shared;

// EmbedUrl is the station's own page, shown in the app when it has no native stream or the native stream fails.
public sealed record RadioStation(
    string Id,
    string Name,
    string ShortLabel,
    string DialFrequency,
    string DialUnit,
    string Dial,
    double Frequency,
    string Description,
    string Logo,
    string Href,
    string StreamUrl,
    bool UseProxy,
    bool IsLiveStream,
    string? EmbedUrl = null);

/// <summary>The station list, shared by the player (Index) and the AI assistant.</summary>
public static class RadioStations
{
    public static readonly IReadOnlyList<RadioStation> All =
    [
        new RadioStation(
            "ninar",
            "نينار FM",
            "نينار",
            "89,6",
            "FM",
            "89.6 FM",
            89.6,
            "البث المباشر من سوريا",
            "img/ninar-logo.png",
            "",
            "http://ninarfm.grtvstream.com:8896/",
            true,
            true),

        new RadioStation(
            "sham",
            "شام FM",
            "شام",
            "92,3",
            "FM",
            "92.3 FM",
            92.3,
            "البث المباشر: أغانٍ وأخبار من دمشق",
            "img/sham-fm-logo.png",
            "https://sham.fm/",
            "https://radioshamfm.grtvstream.com:8400/stream",
            false,
            true,
            "https://sham.fm/"),

        new RadioStation(
            "damascus",
            "إذاعة دمشق",
            "دمشق",
            "95,0",
            "FM",
            "95.0 FM",
            95.0,
            "البث المباشر من دمشق",
            "img/radio-damascus-logo.svg",
            "https://damasradio.fm/",
            "https://radiodamascus.ortas.live/RDimshq/RDimshqAudioLive/playlist.m3u8",
            false,
            true,
            "https://damasradio.fm/"),

        new RadioStation(
            "syria-tv",
            "راديو سوريا",
            "سوريا",
            "102,0",
            "FM",
            "102.0 FM",
            102.0,
            "البث المباشر لقناة سوريا",
            "img/syria-tv.png",
            "https://www.syria.tv/%D8%B1%D8%A7%D8%AF%D9%8A%D9%88-%D8%B3%D9%88%D8%B1%D9%8A%D8%A7",
            "",
            false,
            false),

        new RadioStation(
            "rozana",
            "روزنة FM",
            "روزنة",
            "98,0",
            "FM",
            "98.0 FM",
            98.0,
            "البث المباشر من روزنة",
            "img/rozana-fm-logo.svg",
            "https://www.rozana.fm/",
            "https://stream.radio.co/sea7ed1c60/listen",
            false,
            true)
    ];

    public static RadioStation? Find(string? id) => All.FirstOrDefault(s => string.Equals(s.Id, id, StringComparison.OrdinalIgnoreCase));
}
