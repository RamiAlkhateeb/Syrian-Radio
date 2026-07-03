using Octokit;

namespace AdminApp.Services;

public class GitHubService
{
    private GitHubClient? _client;
    private string _owner = string.Empty;
    private string _repo  = string.Empty;

    public void Initialize(string token, string owner, string repo)
    {
        _owner = owner;
        _repo  = repo;
        _client = new GitHubClient(new ProductHeaderValue("PortfolioAdminSuite"))
        {
            Credentials = new Credentials(token)
        };
    }

    public bool IsConfigured => _client != null && !string.IsNullOrEmpty(_owner);

    public async Task<string> GetFileRawAsync(string path)
    {
        if (!IsConfigured) throw new Exception("GitHub client not initialized.");
        var contents = await _client!.Repository.Content.GetAllContents(_owner, _repo, path);
        // RepositoryContent.Content is already decoded UTF-8 text in Octokit 14.x
        return contents.First().Content ?? string.Empty;
    }

    public async Task SaveFileContentAsync(string path, string content, string commitMessage)
    {
        if (!IsConfigured) throw new Exception("GitHub client not initialized.");
        // Pass plain text — Octokit 14.x automatically base64-encodes before sending to GitHub API.
        // Pre-encoding here would cause double-encoding: GitHub stores base64 text instead of HTML.
        try
        {
            var existing = await _client!.Repository.Content.GetAllContents(_owner, _repo, path);
            var sha = existing.First().Sha;
            await _client.Repository.Content.UpdateFile(
                _owner, _repo, path,
                new UpdateFileRequest(commitMessage, content, sha));
        }
        catch (NotFoundException)
        {
            await _client!.Repository.Content.CreateFile(
                _owner, _repo, path,
                new CreateFileRequest(commitMessage, content));
        }
    }

    public async Task InjectBetweenMarkersAsync(
        string filePath,
        string startMarker,
        string endMarker,
        string newBlock,
        string commitMessage)
    {
        if (!IsConfigured) throw new Exception("GitHub client not initialized.");

        string html = await GetFileRawAsync(filePath);

        int startIdx = html.IndexOf(startMarker, StringComparison.Ordinal);
        int endIdx   = html.IndexOf(endMarker,   StringComparison.Ordinal);

        if (startIdx < 0 || endIdx < 0)
            throw new Exception($"Markers not found in {filePath}. Expected: {startMarker} and {endMarker}");

        int contentStart = startIdx + startMarker.Length;
        string before    = html[..contentStart];
        string after     = html[endIdx..];

        // Prepend new block so newest content appears first
        string updated = before + "\n" + newBlock + "\n" + after;

        await SaveFileContentAsync(filePath, updated, commitMessage);
    }
}