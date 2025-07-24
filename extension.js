/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

class BangsProvider {
    constructor(extension) {
        this._extension = extension;
        this.bangsData = extension.bangsData;
        this._settings = extension._settings;
    }

    get id() {
        return this._extension.uuid;
    }

    activateResult(result, terms) {
        const input = terms.join(' ');
        const encodedQuery = encodeURIComponent(input);

        // Check for custom bangs first
        const match = input.match(/^!(\S+)\s+(.+)$/);
        if (match) {
            const [_, bangKey, query] = match;
            const bang = this.bangsData.find((b) => b.key === bangKey);
            let url = `https://duckduckgo.com/?t=h_&q=!${bangKey}+${encodeURIComponent(query)}`;
            if (bang) {
                url = bang.url.replace('{query}', encodeURIComponent(query));
            }
            Gio.AppInfo.launch_default_for_uri(url, null);
            return;
        }

        // Use default search engine for non-bang searches
        if (input.trim()) {
            const defaultSearchEngine = this._settings.get_string('default-search-engine');
            const url = defaultSearchEngine.replace('{query}', encodeURIComponent(input));
            Gio.AppInfo.launch_default_for_uri(url, null);
        }
    }

    getInitialResultSet(terms) {
        const input = terms.join(' ');
        const match = input.match(/^!(\w+)\s+/);

        // Show results for bang searches
        if (match) {
            return Promise.resolve(['Bang Search']);
        }
        
        // Show results for any non-empty search query (default search engine) if enabled
        if (input.trim() && this._settings.get_boolean('enable-default-search')) {
            return Promise.resolve(['Default Search']);
        }
        
        return Promise.resolve([]);
    }

    filterResults(results, maxResults) {
        return results.filter(result => result === 'Bang Search' || result === 'Default Search').slice(0, maxResults);
    }

    getResultMetas(results) {
        const gicon = Gio.icon_new_for_string(`${this._extension.path}/bang.png`);
        const { scaleFactor } = St.ThemeContext.get_for_stage(global.stage);

        return Promise.resolve(
            results.map((result) => {
                if (result === 'Bang Search') {
                    return {
                        id: 'Bang Search',
                        name: 'Bangs Search',
                        description: 'Use a bang (!bang) to search specific services',
                        createIcon: (size) => new St.Icon({
                            gicon,
                            width: size * scaleFactor,
                            height: size * scaleFactor,
                        }),
                    };
                } else if (result === 'Default Search') {
                    const defaultSearchEngine = this._settings.get_string('default-search-engine');
                    const engineName = this._getSearchEngineName(defaultSearchEngine);
                    return {
                        id: 'Default Search',
                        name: 'Default Search',
                        description: 'Search using default search engine (' + engineName + ')',
                        createIcon: (size) => new St.Icon({
                            gicon,
                            width: size * scaleFactor,
                            height: size * scaleFactor,
                        }),
                    };
                }
            })
        );
    }

    _getSearchEngineName(url) {
        if (url.includes('google.com')) return 'Google';
        if (url.includes('duckduckgo.com')) return 'DuckDuckGo';
        if (url.includes('bing.com')) return 'Bing';
        if (url.includes('yahoo.com')) return 'Yahoo';
        if (url.includes('startpage.com')) return 'Startpage';
        if (url.includes('searx')) return 'SearX';
        return 'Default Engine';
    }
}

export default class BangSearch extends Extension {
    constructor(meta) {
        super(meta);
        this._provider = null;
        this.bangsData = null;
        this._settings = null;
    }

    _loadBangs() {
        const bangsFile = Gio.File.new_for_path(`${GLib.get_user_config_dir()}/bangs.json`);
        try {
            const [, contents] = bangsFile.load_contents(null);
            this.bangsData = JSON.parse(new TextDecoder().decode(contents));
        } catch (e) {
            this.bangsData = [];
        }
    }

    enable() {
        this._settings = this.getSettings();
        this._loadBangs();

        if (!this._provider) {
            this._provider = new BangsProvider(this);
            Main.overview.searchController.addProvider(this._provider);
        }
    }

    disable() {
        if (this._provider) {
            Main.overview.searchController.removeProvider(this._provider);
            this._provider = null;
        }
        this.bangsData = null;
        this._settings = null;
    }
}