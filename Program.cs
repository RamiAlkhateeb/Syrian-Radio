using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using NinarFmPlayer;
using Nxt.UI;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(_ => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
// Arabic-only app: Nxt.UI falls back to FixedLocale(Arabic) when no locale is registered.
builder.Services.AddNxtUi(o =>
{
    o.App = NxtAppId.Radio;
    o.LogoUrl = "img/logo.svg";
    o.Description = new() { ["ar"] = "دليل بسيط للاستماع إلى محطات الراديو السورية من مكان واحد." };
});

await builder.Build().RunAsync();
