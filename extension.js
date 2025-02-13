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
    }

    getInitialResultSet(terms) {
        const input = terms.join(' ');
        const match = input.match(/^!(\w+)\s+/);

        if (match) {
            return Promise.resolve(['Bang Search']);
        }
        return Promise.resolve([]);
    }

    filterResults(results, maxResults) {
        return results.filter(result => result === 'Bang Search').slice(0, maxResults);
    }

    getResultMetas(results) {
        const gicon = Gio.icon_new_for_string(`${this._extension.path}/bang.png`);
        const { scaleFactor } = St.ThemeContext.get_for_stage(global.stage);

        return Promise.resolve(
            results.map(() => ({
                id: 'Bang Search',
                name: 'Bangs Search',
                description: 'Use a bang (!bang) to search specific services',
                createIcon: (size) => new St.Icon({
                    gicon,
                    width: size * scaleFactor,
                    height: size * scaleFactor,
                }),
            }))
        );
    }
}

export default class BangSearch extends Extension {
    constructor(meta) {
        super(meta);
        this._provider = null;
        this.bangsData = null;
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
    }
}