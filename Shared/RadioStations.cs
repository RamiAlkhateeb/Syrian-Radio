namespace NinarFmPlayer.Shared;

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
    bool IsLiveStream);

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
            "أغانٍ وأخبار من دمشق",
            "img/sham-fm-logo.png",
            "http://radio.sham.fm/",
            "",
            false,
            false),

        new RadioStation(
            "damascus",
            "إذاعة دمشق",
            "دمشق",
            "95,0",
            "FM",
            "95.0 FM",
            95.0,
            "البث الرسمي من دمشق",
            "img/radio-damascus-logo.svg",
            "https://damasradio.fm/",
            "",
            false,
            false),

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
