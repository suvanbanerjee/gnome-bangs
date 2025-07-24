# !Bangs Search

<img src="bang.png" width="200" height="200">

Bangs Search is a GNOME Shell extension that allows you to quickly search using !bangs from your GNOME search. It is inspired by DuckDuckGo's !bangs feature and includes a configurable default search engine for regular searches.

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" height="100">](https://extensions.gnome.org/extension/7824/bangs-search/)

## Features

- **!Bang Search**: Type `!` followed by the bang command you want to use in the GNOME search bar. For example, `!w GNOME` searches Wikipedia, or `!g GNOME` searches Google.
- **Default Search Engine**: When you type any search query without a bang, it will use your configured default search engine (DuckDuckGo by default). This feature can be disabled in preferences.
- **Custom Bangs**: Add your own custom bang shortcuts through the preferences.
- **Configurable**: Set your preferred default search engine and enable/disable the default search feature through the extension preferences.

## Usage

### Bang Searches
To use Bangs Search, simply type `!` followed by the bang command you want to use in the GNOME search bar. For example, to search for `!w` in Wikipedia, type `!w GNOME` or for google search, type `!g GNOME`.

### Default Search Engine
For any search without a bang (e.g., just typing `GNOME desktop`), the extension will show a "Default Search" option using your configured default search engine. You can change the default search engine or disable this feature entirely in the extension preferences.

### Pro Tip

Use it with the `Super` key to quickly search for anything on the web. Alternatively, use the Searchlight extension to assign a keyboard shortcut to open the search bar and then type `!` followed by the bang command. Trust me, it's faster than opening a browser and typing the search query.

## Installation

To locally install and run use the Makefile:

```bash
make install
```

To uninstall:

```bash
make uninstall
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
