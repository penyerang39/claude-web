# Claude AI in Google Search

A userscript that seamlessly integrates Claude AI responses directly into your Google search results.

![Claude AI in Google Search](screenshot.png) *(You'll need to add a screenshot)*

## Features

- 🤖 Real-time Claude AI responses alongside Google search results
- 🎨 Native Google Search UI integration with dark mode support
- ⚙️ Configurable settings:
  - Choice of Claude models (Sonnet, Haiku)
  - Adjustable response length
  - API key management
- 📜 Query history tracking for context-aware responses
- 🔄 Persistent results during Google's dynamic page updates

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/)
2. [Click here to install the script](link-to-your-script.user.js) *(Add your installation link)*
3. Get your Claude API key from [Anthropic](https://www.anthropic.com/)
4. Click the ⚙️ icon in the Claude results panel to configure your API key

## Configuration

Access the settings by clicking the ⚙️ icon in the Claude results panel:

- **API Key**: Your Anthropic API key
- **Model**: Choose between different Claude models
  - claude-3-5-sonnet-20241022 (Default)
  - claude-3-5-haiku-20241022
  - claude-3-haiku-20240307
- **Max Tokens**: Adjust the length of Claude's responses (default: 1024)

## Requirements

- Modern web browser
- Tampermonkey or compatible userscript manager
- Anthropic API key

## Dependencies

- jQuery 3.7.1
- GM_config
- waitForKeyElements

## Permissions

- `GM.xmlHttpRequest`: For API calls to Anthropic
- `GM_getValue/setValue`: For storing settings and history
- `GM_addStyle`: For styling integration
- Connection to `api.anthropic.com`

## Development

To modify this script:

1. Clone the repository
2. Make your changes
3. Test in your browser with Tampermonkey
4. Submit a pull request

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

*(Add your chosen license)*

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Claude AI API
- [Tampermonkey](https://www.tampermonkey.net/)
- jQuery team
- GM_config developers

## Disclaimer

This is an unofficial integration and is not affiliated with Google or Anthropic.
