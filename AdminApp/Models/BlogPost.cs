namespace AdminApp.Models;

public class PostEntry
{
    public string TitleAr    { get; set; } = string.Empty;
    public string SummaryAr  { get; set; } = string.Empty;
    public string LinkedInUrl { get; set; } = string.Empty;
    public string Date       { get; set; } = DateTime.Now.ToString("yyyy-MM-dd");
}

public class GuideEntry
{
    public string TitleAr    { get; set; } = string.Empty;
    public string SummaryAr  { get; set; } = string.Empty;
    public string PayhipUrl  { get; set; } = string.Empty;
    public string PriceLabel { get; set; } = string.Empty;
}